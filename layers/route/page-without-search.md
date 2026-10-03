# route / page-without-search

When: a list, a detail or a form page that keeps no filter, sort, page number or tab in the URL's search.

## Good

```ts
// src/features/todo/TodoDetail/TodoDetail.route.ts
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { TodoDetailContainer } from "./TodoDetail.container";

export const todoDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos/$todoId",
  // Attached last. The route was declared and registered without it, so links
  // to this page compiled before the Container existed.
  component: TodoDetailContainer,
});
```

Why:

- Path and Container are the whole file. The page keeps nothing in the search, so there
  are no route options to spread and no `{Page}.search.ts` to import.
- `$todoId` in the path is the whole declaration of the param. The router reads its name
  out of the string, and that types `useParams({ from: "/todos/$todoId" })` in the
  Container and the `params` of every `<Link>` to this page.
- No `loader` and no `beforeLoad`. The todo is fetched by the page's container hook
  through the Queries layer; the route only maps an address to a Container.
- `getParentRoute: () => rootRoute` imports the root route. The root route never imports
  this file back, since the two would then import each other.
- `component:` is the last line written. The path goes into `router.ts` first, so every
  Component that links to `/todos/$todoId` compiles before this Container exists.

## Usage

The code that uses this route: `router.ts` registers it, and the Container reads the param its path declares.

```tsx
// src/router.ts — the route enters the tree by name
const routeTree = rootRoute.addChildren([indexRoute, todoListRoute, todoDetailRoute]);

// TodoDetail.container.tsx — `from` names this route's path, which is what types todoId
export function TodoDetailContainer() {
  const { todoId } = useParams({ from: "/todos/$todoId" });
  const { detail, isPending, isRefetching, isNotFound } = useTodoDetailContainer({ todoId });
  return (
    <TodoDetailComponent
      detail={detail}
      isPending={isPending}
      isRefetching={isRefetching}
      isNotFound={isNotFound}
    />
  );
}
```

## Bad: the route prefetches the todo

```ts
export const todoDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos/$todoId",
  loader: ({ params }) => queryClient.ensureQueryData(todoQueries.detail(params.todoId)),
  component: TodoDetailContainer,
});
```

Why: The route now competes with the container hook as the place the page's data comes
from. A route holds a path, its route options and a Container; data stays in the Queries
layer and the container hook.

## Bad: the search remembers where the reader came from

```ts
// TodoDetail.search.ts declares `from: "list" | "board"` for a Back link to read
import { todoDetailRouteOptions } from "./TodoDetail.search";

export const todoDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos/$todoId",
  ...todoDetailRouteOptions,
  component: TodoDetailContainer,
});
```

Why: `from` describes how the reader got here, not what the page shows, so a shared link
offers a way back its receiver never took. The way back is the browser's Back button.

## Bad: a file-based route

```ts
// src/routes/todos.$todoId.ts
import { createFileRoute } from "@tanstack/react-router";
import { TodoDetailContainer } from "../features/todo/TodoDetail/TodoDetail.container";

export const Route = createFileRoute("/todos/$todoId")({
  component: TodoDetailContainer,
});
```

Why: The route leaves the page directory, and the tree becomes a file a plugin generates.
Routes are code-based: each page directory owns its route, and `router.ts` lists them.
