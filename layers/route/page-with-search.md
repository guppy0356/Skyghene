# route / page-with-search

When: a page that keeps a filter, a sort, a page number or an open tab in the URL's search.

## Good

```ts
// src/features/todo/TodoList/TodoList.route.ts
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { todoListRouteOptions } from "./TodoList.search";
import { TodoListContainer } from "./TodoList.container";

export const todoListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos",
  ...todoListRouteOptions,
  // Attached last. The route was declared and registered without it, so links
  // to this page compiled before the Container existed.
  component: TodoListContainer,
});
```

Why:

- `...todoListRouteOptions` brings in `validateSearch` and the middleware that strips
  defaults, in one spread. `TodoList.search.ts` exports these options and keeps the
  schema and defaults private, so both halves arrive together.
- The spread is what types the search. `useSearch({ from: "/todos" })` returns the parsed
  value with every default filled in, and each `<Link to="/todos">` checks the `search`
  it passes.
- The options are imported, not written here, because the story and test router spread
  the same ones. A harness then parses exactly the addresses the app produces.
- Path, options and Container, nothing else. No `loader`: the container hook fetches the
  list from the search the Container hands it as a param.
- `component:` is the last line written. The path and the spread go into `router.ts`
  first, so every Component that links to `/todos` compiles before this Container exists.

## Usage

The code that uses this route: `router.ts` registers it, and the Container reads the search it parses.

```tsx
// src/router.ts — the route enters the tree by name
const routeTree = rootRoute.addChildren([indexRoute, todoListRoute, todoDetailRoute]);

// TodoList.container.tsx — `from` names this route, which is what types search
export function TodoListContainer() {
  const search = useSearch({ from: "/todos" });
  const { todos, total, isPending, isRefetching } = useTodoListContainer({ params: search });
  return (
    <TodoListComponent
      todos={todos}
      total={total}
      isPending={isPending}
      isRefetching={isRefetching}
      search={search}
    />
  );
}
```

## Bad: the schema is written in the route file

```ts
// The contract TodoList.search.ts holds, written here instead
const todoListSearchDefaults = { page: 1 };
const todoListSearchSchema = z.object({
  page: z.number().int().min(1).default(todoListSearchDefaults.page).catch(todoListSearchDefaults.page),
}) satisfies z.ZodType<TodoListParams, unknown>;

export const todoListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos",
  validateSearch: todoListSearchSchema,
  search: {
    middlewares: [stripSearchParams<z.infer<typeof todoListSearchSchema>>(todoListSearchDefaults)],
  },
  component: TodoListContainer,
});
```

Why: The story and test router cannot import a route file, which brings the Container and a
server with it, so the harness would have to restate this contract. The contract is its own
module, which the route and the harness both spread.

## Bad: only `validateSearch` is taken from the options

```ts
export const todoListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos",
  validateSearch: todoListRouteOptions.validateSearch,
  component: TodoListContainer,
});
```

Why: Without the strip middleware, a link built from the parsed search writes every default
into the address, so `/todos` and `/todos?page=1` stop being one address. The options are
spread whole.

## Bad: the route prefetches the list

```ts
export const todoListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos",
  ...todoListRouteOptions,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => queryClient.ensureQueryData(todoQueries.list(deps)),
  component: TodoListContainer,
});
```

Why: The list now has two places it is fetched from, the route and the container hook. A
route holds a path, its route options and a Container; data stays in the Queries layer and
the container hook.
