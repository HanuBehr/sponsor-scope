import { z } from "zod";

const commaList = z
  .string()
  .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean));

export const campaignFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    targetChannelName: z.string().trim().optional(),
    targetAvgViewers: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().int().min(0).optional()),
    targetNiche: z.string().trim().optional(),
    minViewers: z.coerce.number().int().min(0, "Minimum viewers must be 0 or higher"),
    maxViewers: z.coerce.number().int().min(1, "Maximum viewers must be at least 1"),
    languages: commaList.pipe(z.array(z.string().min(1)).min(1, "Add at least one language")),
    sponsorKeywords: commaList.pipe(z.array(z.string().min(1)).min(1, "Add at least one sponsor keyword")),
    categories: z.array(
      z.object({
        name: z.string().trim(),
        twitchId: z.string().trim(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.maxViewers < data.minViewers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Maximum viewers must be greater than or equal to minimum viewers",
        path: ["maxViewers"],
      });
    }

    const completeCategories = data.categories.filter((category) => category.name || category.twitchId);

    if (completeCategories.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one category",
        path: ["categories"],
      });
    }

    for (const category of completeCategories) {
      if (!category.name || !category.twitchId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each category needs a name and Twitch game ID",
          path: ["categories"],
        });
      }
    }
  })
  .transform((data) => ({
    ...data,
    languages: data.languages.map((language) => language.toUpperCase()),
    categories: data.categories.filter((category) => category.name && category.twitchId),
  }));

export function parseCampaignFormData(formData: FormData) {
  return campaignFormSchema.safeParse({
    name: formData.get("name"),
    targetChannelName: formData.get("targetChannelName"),
    targetAvgViewers: formData.get("targetAvgViewers"),
    targetNiche: formData.get("targetNiche"),
    minViewers: formData.get("minViewers"),
    maxViewers: formData.get("maxViewers"),
    languages: formData.get("languages"),
    sponsorKeywords: formData.get("sponsorKeywords"),
    categories: [1, 2, 3].map((index) => ({
      name: formData.get(`categoryName${index}`),
      twitchId: formData.get(`twitchGameId${index}`),
    })),
  });
}

export function formatValidationError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}
