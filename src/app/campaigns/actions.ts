"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { SponsorLeadStatus, SponsorSignalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatValidationError, parseCampaignFormData } from "@/lib/campaigns/validation";
import { exportCampaignLeadsToSheets } from "@/lib/sheets";
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
      targetChannelName: parsed.data.targetChannelName || null,
      targetAvgViewers: parsed.data.targetAvgViewers ?? null,
      targetNiche: parsed.data.targetNiche || null,
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
        targetChannelName: parsed.data.targetChannelName || null,
        targetAvgViewers: parsed.data.targetAvgViewers ?? null,
        targetNiche: parsed.data.targetNiche || null,
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

export async function updateLeadExportFieldsAction(campaignId: string, leadId: string, formData: FormData) {
  const sponsorCategory = getOptionalFormValue(formData, "sponsorCategory");
  const sponsorshipType = getOptionalFormValue(formData, "sponsorshipType");
  const sponsorContact = getOptionalFormValue(formData, "sponsorContact");
  const outreachStatus = getOptionalFormValue(formData, "outreachStatus") ?? "Not Contacted";
  const notes = getOptionalFormValue(formData, "notes");

  await prisma.sponsorLead.update({
    where: { id: leadId, campaignId },
    data: {
      sponsorCategory,
      sponsorshipType,
      sponsorContact,
      outreachStatus,
      notes,
    },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/leads`);
}

export async function exportUnexportedLeadsAction(campaignId: string) {
  let result;

  try {
    result = await exportCampaignLeadsToSheets(campaignId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Sheets export failed";
    redirect(`/campaigns/${campaignId}/leads?export=failed&message=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/leads`);

  if (result.errors.length > 0) {
    redirect(`/campaigns/${campaignId}/leads?export=partial&exported=${result.exportedCount}&attempted=${result.attemptedCount}&message=${encodeURIComponent(result.errors.join(" | "))}`);
  }

  redirect(`/campaigns/${campaignId}/leads?export=success&exported=${result.exportedCount}&attempted=${result.attemptedCount}`);
}

function getOptionalFormValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}
