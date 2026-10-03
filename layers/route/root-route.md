# route / root-route

When: once per app, `src/root.route.tsx`, the root route: the layout around every page and the app's redirects.

## Good

```tsx
// src/root.route.tsx
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

// "/" has no page of its own; it sends the reader on to the todo list.
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/todos" });
  },
});
```

Why:

- The imports are the router and `Nav`, and no page code. Every page route imports
  `rootRoute` from this file, so importing a page back would make the two import each
  other.
- The layout is the root route's `component`: the chrome, and an `<Outlet />` where the
  matched page's Container renders.
- `Nav` is safe to render here because it imports nothing routable, so it cannot close a
  cycle through this file.
- The `/` redirect lives here, beside the layout. A redirect is app-shell chrome, not a
  feature, so no page directory owns it.
- `redirect({ to: "/todos" })` names a path, not a route object. The string is checked
  against the tree `router.ts` registers, with no import of the page.

## Usage

The code that uses these exports: `router.ts` builds the tree from them, and every page route names `rootRoute` as its parent.

```ts
// src/router.ts
const routeTree = rootRoute.addChildren([indexRoute, todoListRoute, todoDetailRoute]);

// TodoList.route.ts — a page route imports the root route, never the other way round
export const todoListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos",
  ...todoListRouteOptions,
  component: TodoListContainer,
});
```

## Bad: the root route builds the tree

```tsx
import { todoListRoute } from "./features/todo/TodoList/TodoList.route";
import { todoDetailRoute } from "./features/todo/TodoDetail/TodoDetail.route";

// ...

export const routeTree = rootRoute.addChildren([indexRoute, todoListRoute, todoDetailRoute]);
```

Why: Each page route imports `rootRoute` from this file, so the two now import each other.
The tree is composed in `router.ts`, which can import both sides.

## Bad: the redirect is a page

```ts
// src/features/home/Home/Home.route.ts
export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/todos" });
  },
});
```

Why: A redirect is not a feature, and this page directory has nothing to show. Redirects
live in `root.route.tsx`, beside the layout.

## Bad: every page renders the chrome

```tsx
// No layout: the root route renders a bare <Outlet />
export const rootRoute = createRootRoute();

// TodoList.component.tsx, and every other page's Component
  return (
    <>
      <Nav />
      {/* ... */}
    </>
  );
```

Why: Navigation and the page layout are not a feature, yet every page now carries them,
and a page that forgets `<Nav />` loses it. The layout is written once, in the root route.
