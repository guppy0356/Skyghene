# queries / sub-resource

When: a resource with another resource nested under each record, such as `/todos/{todoId}/comments`.

## Good

```ts
// src/api/Todo.queries.ts
import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { todoApi, type TodoListParams } from "./Todo.api";

export const todoQueries = {
  all: () => ["todos"] as const,
  // prefix: every combination of filter, sort and page
  lists: () => [...todoQueries.all(), "list"] as const,
  // leaf: one combination
  list: (params: TodoListParams) =>
    queryOptions({
      queryKey: [...todoQueries.lists(), params],
      queryFn: () => todoApi.getList(params),
      placeholderData: keepPreviousData,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...todoQueries.all(), "detail", id],
      queryFn: () => todoApi.getDetail(id),
      retry: false,
    }),
  // a sibling of "detail", not a child of it
  comments: (id: string) =>
    queryOptions({
      queryKey: [...todoQueries.all(), "comments", id],
      queryFn: () => todoApi.getComments(id),
    }),
};
```

Why:

- `comments(id)` sits beside `detail(id)` under `all()`, not inside it. Keys exist for
  invalidation, not for taxonomy: invalidating a todo after it changes leaves its comments
  alone.
- The comments start from the todo's own `all()`, so `invalidateQueries(todoQueries.all())`
  still reaches everything about todos, the comments included. The `id` in the key gives
  each todo's thread an entry of its own.
- `queryFn` is `todoApi.getComments`, the API layer's function for the nested endpoint.
  The path and its params are written there, as for every other request.
- No `enabled`. The detail page waits for its comments tab, but that wait is one page's
  decision and goes on that page's call.
- This list takes params, so `list(params)` carries them and `lists()` above it is the
  prefix a create invalidates at; a list that takes none has `list()` alone, as both query
  and prefix. Nothing invalidates every detail, so there is no `details()`.

## Usage

The code that uses this factory, down to the line where each value is used.

```ts
// TodoDetail.container.hook.ts — detail and comments side by side; the wait for the tab is this page's, added at the call
export function useTodoDetailContainer({
  todoId,
  withComments,
}: TodoDetailContainerParams): TodoDetailContainerState {
  const todoQuery = useQuery(todoQueries.detail(todoId));
  const commentsQuery = useQuery({ ...todoQueries.comments(todoId), enabled: withComments });
  return {
    detail: todoQuery.data,
    comments: commentsQuery.data ?? [],
    isTodoPending: todoQuery.isPending,
    isTodoRefetching: todoQuery.isRefetching,
    isNotFound: todoQuery.error instanceof TypedStatusError && todoQuery.error.status === 404,
    isCommentsLoading: commentsQuery.isLoading,
  };
}
```

## Bad: the comments are nested under the detail

```ts
  comments: (id: string) =>
    queryOptions({
      queryKey: [...todoQueries.detail(id).queryKey, "comments"],
      queryFn: () => todoApi.getComments(id),
    }),
```

Why: Every `invalidateQueries` on `detail(id)` now prefix-matches the comments and
refetches them too, so a change to the todo reloads its whole thread. Nest only when a
write actually wants that sweep.

## Bad: the tab's wait is part of the definition

```ts
  comments: (id: string, enabled: boolean) =>
    queryOptions({
      queryKey: [...todoQueries.all(), "comments", id],
      queryFn: () => todoApi.getComments(id),
      enabled,
    }),
```

Why: Every caller now has to answer the detail page's question of whether its tab is
open. An option that differs by call site goes on the container hook's call, not in the
definition.

## Bad: the `queryFn` builds the request

```ts
import { api } from "../lib/api-client";
// ...
  comments: (id: string) =>
    queryOptions({
      queryKey: [...todoQueries.all(), "comments", id],
      queryFn: () => api.get("/api/todos/{todoId}/comments", { path: { todoId: id } }),
    }),
```

Why: A request is now built outside the API layer, and the comments come back under the
generated module's type instead of the facade's `TodoComment`. The `queryFn` calls a
`todoApi` function; only the API layer builds requests and names the contract's types.
