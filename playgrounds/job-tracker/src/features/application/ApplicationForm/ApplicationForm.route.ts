import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { ApplicationFormContainer } from "./ApplicationForm.container";

export const applicationFormRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications/new",
  // Attached last. The route was declared and registered without it, so links
  // to this page compiled before the Container existed.
  component: ApplicationFormContainer,
});
