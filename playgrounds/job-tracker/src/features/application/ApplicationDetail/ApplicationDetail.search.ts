import { z } from "zod";
import { stripSearchParams } from "@tanstack/react-router";

// Written here: the API has never heard of a tab, which only picks the pane
// this page shows.
const ApplicationDetailTab = z.enum(["overview", "interviews"]);
type ApplicationDetailTab = z.infer<typeof ApplicationDetailTab>;

// Declared first: the schema reads it, and so does the strip middleware.
const applicationDetailSearchDefaults = {
  tab: "overview" as ApplicationDetailTab,
};

// A malformed tab falls back to the first pane instead of failing the route: a
// typo in a shared link should still show the application.
const applicationDetailSearchSchema = z.object({
  tab: ApplicationDetailTab
    .default(applicationDetailSearchDefaults.tab)
    .catch(applicationDetailSearchDefaults.tab),
});

export type ApplicationDetailSearch = z.infer<typeof applicationDetailSearchSchema>;

export const applicationDetailRouteOptions = {
  validateSearch: applicationDetailSearchSchema,
  search: {
    middlewares: [stripSearchParams<ApplicationDetailSearch>(applicationDetailSearchDefaults)],
  },
};
