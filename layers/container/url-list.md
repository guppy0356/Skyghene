# container / url-list

When: a list whose filter, sort and page live in the URL's search.

## Good

```tsx
// src/features/todo/TodoList/TodoList.container.tsx
import { useSearch } from "@tanstack/react-router";
import { useTodoListContainer } from "./TodoList.container.hook";
import { TodoListComponent } from "./TodoList.component";

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

Why:

- The filter, sort and page are URL state, so they come from `useSearch`. `from` gives
  `search` the route's parsed type, with every defaulted field filled in.
- `params: search` hands the hook the parsed search whole. Its schema is pinned to the
  API's params type, so one shape travels on to the API and nothing here reshapes it.
- `search={search}` is the one prop that does not come from the hook. The Component
  renders the current filter and page from it and writes the next ones back, which is
  what earns URL state a prop.
- The search is read once, here. The hook does not hand it back, and the Component does
  not read the URL again.
- Only the read happens here. Writing the next search is the Component's, through
  `<Link>` and `navigate`.

## Usage

The code that uses this Container: the page's route, the only place it is rendered.

```ts
// src/features/todo/TodoList/TodoList.route.ts
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { todoListRouteOptions } from "./TodoList.search";
import { TodoListContainer } from "./TodoList.container";

export const todoListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos",
  // validateSearch and the default-stripping middleware: what types useSearch({ from: "/todos" })
  ...todoListRouteOptions,
  // attached last, once this Container exists
  component: TodoListContainer,
});
```

## Bad: the Component reads the search itself

```tsx
    <TodoListComponent
      todos={todos}
      total={total}
      isPending={isPending}
      isRefetching={isRefetching}
    />

// TodoList.component.tsx
  const search = useSearch({ from: "/todos" });
```

Why: A story can no longer set the filter through `args`; the router's URL has to supply
it. One read and one prop keep every filtered state pinnable.

## Bad: the Container writes the URL

```tsx
  const navigate = useNavigate();
  const applySearch = useCallback(
    (next: TodoListSearch) => navigate({ to: "/todos", search: next }),
    [navigate],
  );
  // ...
      search={search}
      applySearch={applySearch}
```

Why: The page's `<Link>`s cannot leave the Component, so changing the address now
happens in two layers. The Container reads the URL; the Component writes it.

## Bad: `search` comes back from the hook

```tsx
  const { todos, total, isPending, isRefetching, params } = useTodoListContainer({
    params: search,
  });
  // ...
      search={params}
```

Why: URL state is not the hook's to own, so it never comes back in its return. The
Container passes on the value it read.
