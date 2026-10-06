import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";

export const rootRoute = createRootRoute({
  component: () => (
    <main>
      <Outlet />
    </main>
  ),
});

// Placeholder until the first feature page registers its own route.
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <div>
      <h1>Job-tracker Playground</h1>
    </div>
  ),
});
