import { createRouter } from "@tanstack/react-router";
import { indexRoute, rootRoute } from "./root.route";
import { applicationListRoute } from "./features/application/ApplicationList/ApplicationList.route";
import { applicationFormRoute } from "./features/application/ApplicationForm/ApplicationForm.route";
import { applicationDetailRoute } from "./features/application/ApplicationDetail/ApplicationDetail.route";

// One entry per page: the app's sitemap.
const routeTree = rootRoute.addChildren([
  indexRoute,
  applicationListRoute,
  applicationFormRoute,
  applicationDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
