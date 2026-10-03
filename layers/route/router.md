# route / router

When: once per app, `src/router.ts`, the route tree every page's route is added to.

## Good

```ts
// src/router.ts
import { createRouter } from "@tanstack/react-router";
import { indexRoute, rootRoute } from "./root.route";
import { todoListRoute } from "./features/todo/TodoList/TodoList.route";
import { todoFormRoute } from "./features/todo/TodoForm/TodoForm.route";
import { todoDetailRoute } from "./features/todo/TodoDetail/TodoDetail.route";

// One entry per page: the app's sitemap.
const routeTree = rootRoute.addChildren([
  indexRoute,
  todoListRoute,
  todoFormRoute,
  todoDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

Why:

- `addChildren` names each page's route, one entry per page: the app's page-granular
  sitemap. A new page is a route file in its own directory and one line here.
- Every route is a static import, so the compiler sees the whole tree. That tree is what
  the strings in `Link`, `useNavigate`, `useParams({ from })` and `useSearch({ from })`
  are checked against.
- `Register` hands the tree's type to the library. Without it those strings are plain
  `string`s and nothing checks them.
- The tree is composed here, not in `root.route.tsx`. Page routes import `rootRoute`, so
  only a third module can import both sides without a cycle.
- A page's line goes in when its route is declared, before its Container exists. The
  Components' links need the tree to compile, and each route gets `component:` last.

## Usage

The code that uses this module: `main.tsx` hands the router to the provider, and every link in a Component is checked against the registered tree.

```tsx
// src/main.tsx
worker.start().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});

// TodoList.component.tsx — `to` must be a path in the tree, and `params` its params
const TodoRows = memo(function TodoRows({ todos }: { todos: Todo[] }) {
  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <li key={todo.id} className="rounded border p-2">
          <Link to="/todos/$todoId" params={{ todoId: todo.id }}>
            {todo.title}
          </Link>
        </li>
      ))}
    </ul>
  );
});
```

## Bad: the router type is not registered

```ts
const routeTree = rootRoute.addChildren([indexRoute, todoListRoute, todoFormRoute, todoDetailRoute]);

export const router = createRouter({ routeTree });
```

Why: Without `Register`, `<Link to>` and `useParams({ from })` accept any string, so a
renamed path breaks at runtime instead of in the build. The declaration is what ties every
link to this tree.

## Bad: the routes are collected with `import.meta.glob`

```ts
const routeModules = import.meta.glob<Record<string, AnyRoute>>("./features/*/*/*.route.ts", {
  eager: true,
});
const pageRoutes = Object.values(routeModules).flatMap((module) => Object.values(module));

const routeTree = rootRoute.addChildren([indexRoute, ...pageRoutes]);
```

Why: The tree is assembled while the app runs, so its type is only `AnyRoute[]` and no
link string is checked against it any more. Each page's route is imported by name.

## Bad: one bundle per feature

```ts
import { todoRoutes } from "./features/todo/todo.routes";

const routeTree = rootRoute.addChildren([indexRoute, ...todoRoutes]);
```

Why: This file stops being the page-granular sitemap; which pages exist is now read one
feature file at a time. Bundles wait until this list measurably causes merge conflicts.
