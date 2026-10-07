import { z } from "zod";
import { stripSearchParams } from "@tanstack/react-router";
import {
  APPLICATION_SORTS,
  APPLICATION_STATUSES,
  type ApplicationListParams,
  type ApplicationSort,
  type ApplicationStatus,
} from "@api/Application.api";

// Declared first: the schema reads these, and so does the strip middleware.
// Not `as const`: it makes `status` a readonly array, and the schema and
// stripSearchParams both take the mutable search shape.
const applicationListSearchDefaults = {
  status: [] as ApplicationStatus[],
  sort: "-appliedAt" as ApplicationSort,
  page: 1,
};

// A malformed value falls back instead of failing the route: this address is
// ordinary editable text, and a typo or a stale bookmark should still show a list.
const applicationListSearchSchema = z.object({
  status: z
    .array(z.enum(APPLICATION_STATUSES))
    .default(applicationListSearchDefaults.status)
    .catch(applicationListSearchDefaults.status),
  sort: z
    .enum(APPLICATION_SORTS)
    .default(applicationListSearchDefaults.sort)
    .catch(applicationListSearchDefaults.sort),
  page: z
    .number()
    .int()
    .min(1)
    .default(applicationListSearchDefaults.page)
    .catch(applicationListSearchDefaults.page),
}) satisfies z.ZodType<ApplicationListParams, unknown>;

export type ApplicationListSearch = z.infer<typeof applicationListSearchSchema>;

export const applicationListRouteOptions = {
  validateSearch: applicationListSearchSchema,
  search: {
    middlewares: [stripSearchParams<ApplicationListSearch>(applicationListSearchDefaults)],
  },
};
