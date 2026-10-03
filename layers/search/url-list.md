# search / url-list

When: a list whose filter, sort or page lives in the URL's search, as the query parameters its list endpoint takes.

## Good

```ts
// src/features/todo/TodoList/TodoList.search.ts
import { z } from "zod";
import { stripSearchParams } from "@tanstack/react-router";
import {
  TODO_PRIORITIES,
  TODO_SORTS,
  TODO_STATUSES,
  type TodoListParams,
  type TodoSort,
  type TodoStatus,
} from "@api/Todo.api";

// Declared first: the schema reads these, and so does the strip middleware.
// Not `as const`: it makes `status` a readonly array, and the schema and
// stripSearchParams both take the mutable search shape.
const todoListSearchDefaults = {
  status: [] as TodoStatus[],
  sort: "-createdAt" as TodoSort,
  page: 1,
};

// A malformed value falls back instead of failing the route: this address is
// ordinary editable text, and a typo or a stale bookmark should still show a list.
const todoListSearchSchema = z.object({
  // No default: no priority chosen means every priority.
  priority: z.enum(TODO_PRIORITIES).optional().catch(undefined),
  status: z
    .array(z.enum(TODO_STATUSES))
    .default(todoListSearchDefaults.status)
    .catch(todoListSearchDefaults.status),
  sort: z
    .enum(TODO_SORTS)
    .default(todoListSearchDefaults.sort)
    .catch(todoListSearchDefaults.sort),
  page: z
    .number()
    .int()
    .min(1)
    .default(todoListSearchDefaults.page)
    .catch(todoListSearchDefaults.page),
}) satisfies z.ZodType<TodoListParams, unknown>;

export type TodoListSearch = z.infer<typeof todoListSearchSchema>;

export const todoListRouteOptions = {
  validateSearch: todoListSearchSchema,
  search: {
    middlewares: [stripSearchParams<TodoListSearch>(todoListSearchDefaults)],
  },
};
```

Why:

- `satisfies z.ZodType<TodoListParams, unknown>` pins the parsed search to the list
  endpoint's params from `@api`, so a parameter whose type changes, or one the endpoint
  starts to require, fails here, at the schema. The second argument is the input side,
  spelled out to say that the address coming in is deliberately left unvalidated.
- The members come from `@api`: `TODO_STATUSES`, `TODO_PRIORITIES` and `TODO_SORTS` are the
  generated enums' `.options`. `satisfies` would not notice a member the contract adds,
  since a narrower union is assignable to a wider one; with no second copy here, nothing
  can fall behind.
- `priority` is `.optional()` and has no entry in the defaults: no priority chosen means
  every priority, so its absence is the value. `status`, `sort` and `page` always mean
  something and take `.default()`, which also lets every `<Link>` to `/todos` leave them
  out.
- Every field ends in `.catch()`, and the comment above the schema says why. The address is
  ordinary editable text, so a typo or a stale bookmark falls back and still shows a list.
- The defaults object comes first, and the schema and `stripSearchParams` both read it, so
  `/todos` and `/todos?page=1` stay one address. `status` and `sort` carry their own
  assertions, since the schema's type does not exist yet and a bare `"-createdAt"` would
  widen to `string`.
- Only `todoListRouteOptions` and `TodoListSearch` are exported. The route and the test
  router spread the same options, so no harness can assemble an address the app never
  produces.

## Usage

The code that uses this file's exports: the route and the test router spread the same options, and the component hook builds the next search from the parsed type.

```tsx
// TodoList.route.ts — the spread is what types useSearch({ from: "/todos" }) as TodoListSearch
export const todoListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos",
  ...todoListRouteOptions,
  component: TodoListContainer,
});

// src/test/todo-router.tsx — the harness chooses its paths and spreads the contract, never restating it
export function createTodoRouter({ children, initialUrl = "/todos" }: TodoRouterOptions) {
  const rootRoute = createRootRoute();
  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/todos",
      ...todoListRouteOptions,
      component: () => children,
    }),
  ]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  });
}

// TodoList.component.hook.ts — the next search spreads the parsed value; page 1 is the default, so it leaves the address
export interface TodoListComponentParams {
  search: TodoListSearch;
  applySearch: (next: TodoListSearch) => void;
}

export function useTodoListComponent({
  search,
  applySearch,
}: TodoListComponentParams): TodoListComponentState {
  const toggleStatus = useCallback(
    (status: TodoStatus) => {
      const next = search.status.includes(status)
        ? search.status.filter((s) => s !== status)
        : [...search.status, status];
      applySearch({ ...search, status: next, page: 1 });
    },
    [search, applySearch],
  );
  return { toggleStatus };
}
```

## Bad: the priorities are typed out

```ts
  // No default: no priority chosen means every priority.
  priority: z.enum(["low", "medium", "high"]).optional().catch(undefined),
```

Why: When the contract adds a priority, this copy falls behind and `satisfies` does not
notice, so an address asking for the new priority silently shows every priority. The API
has the members; the schema reads them off `TODO_PRIORITIES`.

## Bad: the schema and the defaults are exported

```ts
export const todoListSearchDefaults = {
  status: [] as TodoStatus[],
  sort: "-createdAt" as TodoSort,
  page: 1,
};

export const todoListSearchSchema = z.object({
  // ...
}) satisfies z.ZodType<TodoListParams, unknown>;

export type TodoListSearch = z.infer<typeof todoListSearchSchema>;
```

Why: Each consumer now assembles the route options itself, and a test router that takes only
`validateSearch: todoListSearchSchema` passes while asserting against
`/todos?status=[]&sort=-createdAt&page=1`, an address the app never produces. The module
hands out the assembled options, so a harness can choose its paths but not restate their
contract.

## Bad: `sort` has a default and no `.catch()`

```ts
  sort: z.enum(TODO_SORTS).default(todoListSearchDefaults.sort),
```

Why: `.default()` answers only a missing sort, so a bookmark saved with a sort the API has
since dropped now fails the route instead of showing a list. A malformed value in this
ordinary editable address falls back through `.catch()`.
