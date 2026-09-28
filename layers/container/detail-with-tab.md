# container / detail-with-tab

When: a page for one record, found by the id in the URL path, whose open tab lives in the search.

## Good

```tsx
// src/features/todo/TodoDetail/TodoDetail.container.tsx
import { useParams, useSearch } from "@tanstack/react-router";
import { useTodoDetailContainer } from "./TodoDetail.container.hook";
import { TodoDetailComponent } from "./TodoDetail.component";

export function TodoDetailContainer() {
  const { todoId } = useParams({ from: "/todos/$todoId" });
  const search = useSearch({ from: "/todos/$todoId" });
  const {
    detail,
    comments,
    isTodoPending,
    isTodoRefetching,
    isNotFound,
    isCommentsLoading,
  } = useTodoDetailContainer({ todoId, withComments: search.tab === "comments" });
  return (
    <TodoDetailComponent
      detail={detail}
      comments={comments}
      isTodoPending={isTodoPending}
      isTodoRefetching={isTodoRefetching}
      isNotFound={isNotFound}
      isCommentsLoading={isCommentsLoading}
      search={search}
    />
  );
}
```

Why:

- One address, two reads: `useParams` for the id in the path, `useSearch` for the tab in
  the search, both `from` this page's route.
- `withComments: search.tab === "comments"` is the one translation here. No reader would
  notice it, so it is wiring: it keeps `tab`, a word only the URL knows, out of the hook,
  the way a path segment becomes an id.
- `search` goes to the Component as its own prop. The Component renders the open tab
  from it and switches tabs by writing it back.
- One hook call, although the page reads the todo and its comments. Both queries live in
  the page's one hook, so the Component is typed from one interface.
- The flags keep the hook's names. Two queries put the resource in front of each, and
  the comments query waits on `withComments`, so its Skeleton flag is `isCommentsLoading`.

## Usage

The code that uses this Container: the page's route, the only place it is rendered.

```ts
// src/features/todo/TodoDetail/TodoDetail.route.ts
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { todoDetailRouteOptions } from "./TodoDetail.search";
import { TodoDetailContainer } from "./TodoDetail.container";

export const todoDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  // the route both reads name; $todoId becomes todoId
  path: "/todos/$todoId",
  // validateSearch for `tab`: what types search.tab
  ...todoDetailRouteOptions,
  // attached last, once this Container exists
  component: TodoDetailContainer,
});
```

## Bad: the hook gets `tab`

```tsx
  } = useTodoDetailContainer({ todoId, tab: search.tab });
```

Why: The hook now speaks the URL's vocabulary. Turning `tab` into `withComments` is
wiring, and it is what keeps the hook URL-agnostic.

## Bad: the Container words the tab

```tsx
      search={search}
      tabTitle={search.tab === "comments" ? "Comments" : "Timeline"}
```

Why: A label is something a reader notices, so it is the component hook's to derive.
The Container translates only what no reader would notice.

## Bad: a second hook for the comments

```tsx
  const { detail, isTodoPending, isTodoRefetching, isNotFound } = useTodoDetailContainer({ todoId });
  const { comments, isCommentsLoading } = useTodoCommentsContainer({
    todoId,
    withComments: search.tab === "comments",
  });
```

Why: The Container now assembles the page's server state from two hooks, and no single
interface is left to type the Component with. One page has one container hook.
