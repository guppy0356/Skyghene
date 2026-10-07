import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { applicationListRouteOptions } from "./ApplicationList.search";
import { ApplicationListContainer } from "./ApplicationList.container";

export const applicationListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications",
  ...applicationListRouteOptions,
  // Attached last. The route was declared and registered without it, so links
  // to this page compiled before the Container existed.
  component: ApplicationListContainer,
});
