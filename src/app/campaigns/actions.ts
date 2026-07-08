"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { SponsorLeadStatus, SponsorSignalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatValidationError, parseCampaignFormData } from "@/lib/campaigns/validation";
import { detectCampaignSponsorSignals } from "@/lib/signals/detection";
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

export async function detectSignalsAction(campaignId: string) {
  let result;

  try {
    result = await detectCampaignSponsorSignals(campaignId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signal detection failed";
    redirect(`/campaigns/${campaignId}?signals=failed&message=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/signals`);
  redirect(`/campaigns/${campaignId}?signals=success&created=${result.created}&scanned=${result.scanned}&duplicates=${result.skippedDuplicates}`);
}

export async function rejectSignalAction(campaignId: string, signalId: string) {
  await prisma.sponsorSignal.update({
    where: { id: signalId, campaignId },
    data: { status: SponsorSignalStatus.REJECTED },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/signals`);
}

export async function confirmSignalAsLeadAction(campaignId: string, signalId: string, formData: FormData) {
  const sponsorName = String(formData.get("sponsorName") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!sponsorName) {
    redirect(`/campaigns/${campaignId}/signals?error=${encodeURIComponent("Sponsor name is required to confirm a lead")}`);
  }

  const signal = await prisma.sponsorSignal.findUnique({
    where: { id: signalId },
    include: {
      channel: true,
      vod: true,
    },
  });

  if (!signal || signal.campaignId !== campaignId) {
    notFound();
  }

  const sourceUrl = signal.vod?.twitchVodId ? `https://www.twitch.tv/videos/${signal.vod.twitchVodId}` : `https://www.twitch.tv/${signal.channel.login}`;

  await prisma.$transaction([
    prisma.sponsorLead.upsert({
      where: { sponsorSignalId: signal.id },
      update: {
        sponsorName,
        sourceUrl,
        notes: notes || null,
        status: SponsorLeadStatus.CONFIRMED,
      },
      create: {
        campaignId: signal.campaignId,
        channelId: signal.channelId,
        sponsorSignalId: signal.id,
        sponsorName,
        sourceUrl,
        notes: notes || null,
        status: SponsorLeadStatus.CONFIRMED,
      },
    }),
    prisma.sponsorSignal.update({
      where: { id: signal.id },
      data: {
        sponsorName,
        status: SponsorSignalStatus.CONFIRMED,
      },
    }),
  ]);

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/signals`);
  revalidatePath(`/campaigns/${campaignId}/leads`);
  redirect(`/campaigns/${campaignId}/leads`);
}
