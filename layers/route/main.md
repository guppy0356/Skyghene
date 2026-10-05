# route / main

When: once per app, `src/main.tsx`, the entry module `index.html` loads.

## Good

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import "./app.css";

const queryClient = new QueryClient();

async function enableMocking() {
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
```

Why:

- Bootstrap and nothing else: one `QueryClient`, the mock worker, the render. No route,
  no layout and no router type is declared here.
- `router` arrives finished from `router.ts`, where the tree is composed and registered.
  This file only hands it to `RouterProvider`.
- One `QueryClient` for the whole app, provided above the router. Every page's container
  hook reads the same keyed cache, which is how two pages over one resource share data
  without sharing a hook.
- `enableMocking()` loads `src/mocks/browser.ts` with a dynamic `import()` when it runs,
  and starts the worker that file builds from `src/mocks/handlers.ts`, the dev seed. Tests
  start their own empty worker in `src/test/setup.ts` and never this one.
- `onUnhandledRequest: "bypass"` lets a request that no handler matches go on to the
  network as it is, with nothing printed.
- The render runs inside `enableMocking().then(...)`, once `worker.start()` has resolved.

## Usage

The code that loads this module: `index.html`, whose `#root` is where the app renders.

```html
<!-- index.html -->
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

## Bad: the routes are declared here

```tsx
const rootRoute = createRootRoute({ component: Layout });
const todoListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos",
  component: TodoListContainer,
});
const router = createRouter({ routeTree: rootRoute.addChildren([todoListRoute]) });
```

Why: Adding a page now means editing the entry point in three places, and the file no
longer says at a glance what it does. Each page owns its route file, and `router.ts`
composes them.

## Bad: the layout wraps the router

```tsx
      <QueryClientProvider client={queryClient}>
        <Nav />
        <main className="mx-auto max-w-3xl p-4">
          <RouterProvider router={router} />
        </main>
      </QueryClientProvider>
```

Why: `Nav` renders outside `RouterProvider`, where its links have no router to read. The
layout is the root route's `component`, inside the router.
