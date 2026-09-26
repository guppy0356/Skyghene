# container-hook / detail-page

When: a page that shows one record by the id in the URL and does not change it.

## Good

```ts
// src/features/todo/TodoDetail/TodoDetail.container.hook.ts
import { useQuery } from "@tanstack/react-query";
import type { Todo } from "@api/Todo.api";
import { todoQueries } from "@api/Todo.queries";
import { TypedStatusError } from "../../../lib/api-client";

export interface TodoDetailContainerParams {
  todoId: string;
}

export interface TodoDetailContainerState {
  detail: Todo | undefined;
  isPending: boolean;
  isRefetching: boolean;
  isNotFound: boolean;
}

export function useTodoDetailContainer({
  todoId,
}: TodoDetailContainerParams): TodoDetailContainerState {
  const { data, isPending, isRefetching, error } = useQuery(todoQueries.detail(todoId));

  return {
    detail: data,
    isPending,
    isRefetching,
    isNotFound: error instanceof TypedStatusError && error.status === 404,
  };
}
```

Why:

- `todoId` arrives as a param. The Container reads the URL; the hook never sees it. That
  is what lets the hook be called, and tested, without a router.
- `isNotFound` is built from a `TypedStatusError` with status 404. The API layer handles
  no errors, so turning an HTTP error into a domain flag is this hook's job.
- `TypedStatusError` is read as it is, not wrapped in an error type of our own. It is the
  standard error of the project-wide client.
- `detail` is returned as `Todo | undefined`. A single record has no default the way a
  list has `[]`. While it is `undefined`, the Component branches on `isPending` and
  `isNotFound`.
- The flags returned are `isPending` and `isRefetching`: the Skeleton, and the dimmed
  content during a refetch.

## Usage

The code that uses this hook, down to the line where each value is used.

```tsx
// TodoDetail.container.tsx — reads todoId from the URL, passes it in, splits the result into individual props
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

// TodoDetail.component.tsx — branches on the flags, then renders the body
export function TodoDetailComponent({
  detail,
  isPending,
  isRefetching,
  isNotFound,
}: TodoDetailContainerState) {
  if (isNotFound) return <NotFound />;
  if (isPending || detail === undefined) return <TodoDetailSkeleton />;
  return (
    <div className={isRefetching ? "opacity-50" : ""}>
      <TodoDetailBody detail={detail} />
    </div>
  );
}
```

## Bad: the hook reads the URL itself

```ts
export function useTodoDetailContainer(): TodoDetailContainerState {
  const { todoId } = useParams({ from: "/todos/$todoId" });
  const { data, isPending, isRefetching, error } = useQuery(todoQueries.detail(todoId));
```

Why: Calling it now needs a router, and so does testing it alone. Reading the URL is the
Container's job.

## Bad: `error` is returned as it is

```ts
  return {
    detail: data,
    isPending,
    isRefetching,
    error,
  };
```

Why: The Component would learn about HTTP statuses. It receives domain flags such as
`isNotFound`, nothing else.

## Bad: `isPending` on a query gated by `enabled`

```ts
  const { data, isPending, isRefetching, error } = useQuery({
    ...todoQueries.detail(todoId),
    enabled: todoId !== "",
  });
```

Why: A gated query stays `isPending`, so the Skeleton never goes away. If a query has to
be gated, return `isLoading`. On this page the id always arrives, so there is nothing to
gate.
