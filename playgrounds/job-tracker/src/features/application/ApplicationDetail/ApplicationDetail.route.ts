import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { applicationDetailRouteOptions } from "./ApplicationDetail.search";
import { ApplicationDetailContainer } from "./ApplicationDetail.container";

export const applicationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications/$applicationId",
  ...applicationDetailRouteOptions,
  // Attached last. The route was declared and registered without it, so links
  // to this page compiled before the Container existed.
  component: ApplicationDetailContainer,
});
