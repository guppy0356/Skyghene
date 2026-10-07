import { createRootRoute, createRoute, Outlet, redirect } from "@tanstack/react-router";
import { Nav } from "./nav/Nav.component";

export const rootRoute = createRootRoute({
  component: () => (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl p-4">
        <Outlet />
      </main>
    </>
  ),
});

// "/" has no page of its own; it sends the reader on to the application list.
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/applications" });
  },
});
