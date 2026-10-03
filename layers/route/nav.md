# route / nav

When: once per app, `src/nav/Nav.component.tsx`, the links the layout shows on every page.

## Good

```tsx
// src/nav/Nav.component.tsx
import { Link } from "@tanstack/react-router";

export function Nav() {
  return (
    <nav className="flex gap-4 border-b px-4 py-3">
      <Link to="/todos" activeProps={{ className: "font-semibold" }}>
        Todos
      </Link>
      <Link to="/projects" activeProps={{ className: "font-semibold" }}>
        Projects
      </Link>
    </nav>
  );
}
```

Why:

- The one import is `Link`. Nothing routable comes in, no route object and no route file,
  which is what lets the root route render `Nav` without a cycle.
- Each `to` is a path string, checked against the tree `router.ts` registers. A page
  renamed or removed fails the build here, with nothing imported.
- No Container, no container hook, no component hook and no story. Chrome renders the
  same links on every page and holds nothing.
- The file sits in `src/nav/`, outside every page directory. Navigation is app-shell
  chrome, not a feature.
- The links carry no `search`. Each names a destination, so the list opens on its own
  defaults rather than on whatever the current page held.

## Usage

The code that uses `Nav`: the root route's layout, the only place it renders.

```tsx
// src/root.route.tsx
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
```

## Bad: the link takes its path from the route

```tsx
import { todoListRoute } from "../features/todo/TodoList/TodoList.route";

// ...
      <Link to={todoListRoute.to} activeProps={{ className: "font-semibold" }}>
        Todos
      </Link>
```

Why: The root route renders `Nav`, and `TodoList.route.ts` imports the root route, so the
imports now run in a circle. A path string is checked against the registered tree with no
import at all.

## Bad: Nav counts the open todos

```tsx
export function Nav() {
  const { data: todos } = useQuery(todoQueries.list());
  return (
    <nav className="flex gap-4 border-b px-4 py-3">
      <Link to="/todos" activeProps={{ className: "font-semibold" }}>
        Todos ({todos?.filter((todo) => !todo.completed).length ?? 0})
      </Link>
```

Why: Server data lives in a page's container hook, and chrome has neither a Container nor a
container hook. Data that belongs to the whole app has no home in this architecture yet.

## Bad: the list link keeps the current search

```tsx
      <Link to="/todos" search={true} activeProps={{ className: "font-semibold" }}>
        Todos
      </Link>
```

Why: Whatever the current page holds in its search rides into the list, such as a todo's
open `tab`, which the list never declares. A link out names its destination and carries no
search.
