import { z } from "zod";
import type { CreateApplicationInput } from "@api/Application.api";

export const applicationFormSchema = z.object({
  companyId: z.string().min(1, "Choose a company"),
  position: z.string().trim().min(1, "Position is required"),
  appliedAt: z.iso.date("Pick the date you applied"),
  notes: z.string().trim(),
}) satisfies z.ZodType<CreateApplicationInput>;

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;
