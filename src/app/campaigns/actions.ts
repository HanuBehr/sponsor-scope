"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatValidationError, parseCampaignFormData } from "@/lib/campaigns/validation";
import { runCampaignDiscovery } from "@/lib/twitch/discovery";

export async function createCampaignAction(formData: FormData) {
  const parsed = parseCampaignFormData(formData);

  if (!parsed.success) {
    redirect(`/campaigns/new?error=${encodeURIComponent(formatValidationError(parsed.error))}`);
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: parsed.data.name,
      minViewers: parsed.data.minViewers,
      maxViewers: parsed.data.maxViewers,
      languages: parsed.data.languages,
      sponsorKeywords: parsed.data.sponsorKeywords,
      categories: {
        create: parsed.data.categories,
      },
    },
  });

  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}`);
}

export async function updateCampaignAction(campaignId: string, formData: FormData) {
  const parsed = parseCampaignFormData(formData);

  if (!parsed.success) {
    redirect(`/campaigns/${campaignId}/edit?error=${encodeURIComponent(formatValidationError(parsed.error))}`);
  }

  const existingCampaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true },
  });

  if (!existingCampaign) {
    notFound();
  }

  await prisma.$transaction([
    prisma.campaignCategory.deleteMany({ where: { campaignId } }),
    prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: parsed.data.name,
        minViewers: parsed.data.minViewers,
        maxViewers: parsed.data.maxViewers,
        languages: parsed.data.languages,
        sponsorKeywords: parsed.data.sponsorKeywords,
        categories: {
          create: parsed.data.categories,
        },
      },
    }),
  ]);

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  redirect(`/campaigns/${campaignId}`);
}

export async function deleteCampaignAction(campaignId: string) {
  await prisma.campaign.delete({
    where: { id: campaignId },
  });

  revalidatePath("/campaigns");
  redirect("/campaigns");
}

export async function runDiscoveryAction(campaignId: string) {
  const result = await runCampaignDiscovery(campaignId);

  revalidatePath(`/campaigns/${campaignId}`);

  if (result.status === "FAILED") {
    redirect(`/campaigns/${campaignId}?discovery=failed&message=${encodeURIComponent(result.errorMessage ?? "Discovery failed")}`);
  }

  redirect(`/campaigns/${campaignId}?discovery=success&streams=${result.streamsMatched}&vods=${result.vodsFetched}`);
}
