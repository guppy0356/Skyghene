# container / detail-page

When: a page for one record, found by the id in the URL path, with nothing in the search.

## Good

```tsx
// src/features/todo/TodoDetail/TodoDetail.container.tsx
import { useParams } from "@tanstack/react-router";
import { useTodoDetailContainer } from "./TodoDetail.container.hook";
import { TodoDetailComponent } from "./TodoDetail.component";

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

Why:

- The id is a path segment, so it comes from `useParams`. `from` names this page's
  route and is checked against the route tree, so `todoId` arrives typed as a `string`.
- `todoId` goes into the hook as a param. The hook never sees the URL, so it can be
  called, and tested, without a router.
- `todoId` stops at the hook. The Component renders `detail`, which carries its own id,
  and writes nothing back to the path.
- `isNotFound` goes down like every other field, with no branch around the Component.
  The not-found screen is the Component's, where a story reaches it through `args`.
- Each field is passed as its own prop. What the Component receives is written here,
  one line per field.

## Usage

The code that uses this Container: the page's route, the only place it is rendered.

```ts
// src/features/todo/TodoDetail/TodoDetail.route.ts
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { TodoDetailContainer } from "./TodoDetail.container";

export const todoDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  // the route that useParams({ from: "/todos/$todoId" }) names; $todoId becomes todoId
  path: "/todos/$todoId",
  // attached last, once this Container exists
  component: TodoDetailContainer,
});
```

## Bad: the hook reads the URL itself

```tsx
export function TodoDetailContainer() {
  const { detail, isPending, isRefetching, isNotFound } = useTodoDetailContainer();
```

Why: The hook now calls `useParams`, so calling it, and testing it, needs a router.
Reading the address is the Container's job.

## Bad: the Container renders the not-found page

```tsx
  const { detail, isPending, isRefetching, isNotFound } = useTodoDetailContainer({ todoId });
  if (isNotFound) return <NotFound />;
  return (
```

Why: The 404 screen now sits outside the Component, where no story or test of the page
reaches it. The Container renders the Component and nothing else.

## Bad: the id goes to the Component too

```tsx
    <TodoDetailComponent
      todoId={todoId}
      detail={detail}
```

Why: The id already arrives in `detail`. URL state joins the Component's props only when
the Component renders it and writes it back.
