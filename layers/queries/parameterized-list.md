# queries / parameterized-list

When: a resource whose list endpoint takes query parameters (filter, sort, page), with nothing nested under its records.

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
};
```

Why:

- `list(params)` carries the whole params object in its key. Each combination of filter,
  sort and page is its own cache entry, and changing any one of them is a new key and a
  new fetch.
- `lists()` is a bare key, not a query: the prefix every variant starts with. A new todo
  can belong on any filtered page, so a create invalidates `lists()` and catches them all.
  A resource nothing writes to has `list(params)` alone.
- `params` is `TodoListParams`, imported from `Todo.api.ts`, where it is declared beside
  the fetcher that takes it. The Container, the hook, this key and the request pass one
  shape, and none of them reshapes it.
- `placeholderData: keepPreviousData` is in the definition because every page reading the
  list wants it: on a key change the previous rows stay on screen as `isRefetching`
  instead of dropping to the Skeleton.
- `detail(id)` starts from `all()` with no `details()` above it. A detail is invalidated or
  removed by its own id, so there is no level to invalidate at.

## Usage

The code that uses this factory, down to the line where each value is used.

```ts
// TodoList.container.hook.ts — the parsed search arrives as params and becomes the key
export function useTodoListContainer({
  params,
}: TodoListContainerParams): TodoListContainerState {
  const { data, isPending, isRefetching } = useQuery(todoQueries.list(params));
  return { todos: data ?? [], isPending, isRefetching };
}

// TodoForm.container.hook.ts — a create invalidates at the prefix, which matches every cached filter and page
export function useTodoFormContainer(): TodoFormContainerState {
  const queryClient = useQueryClient();
  const addMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueries.lists() });
    },
  });
  const addTodo = useCallback(
    (input: CreateTodoInput) => addMutation.mutateAsync(input),
    [addMutation.mutateAsync],
  );
  return { addTodo };
}
```

## Bad: the params are not in the key

```ts
  list: (params: TodoListParams) =>
    queryOptions({
      queryKey: todoQueries.lists(),
      queryFn: () => todoApi.getList(params),
      placeholderData: keepPreviousData,
    }),
```

Why: Every filter and page now share one cache entry, so changing the filter changes no
key: nothing refetches and the first filter's rows stay. A list that takes parameters
carries them in the key of `list(params)`.

## Bad: a `details()` prefix to match `lists()`

```ts
  details: () => [...todoQueries.all(), "detail"] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...todoQueries.details(), id],
      queryFn: () => todoApi.getDetail(id),
      retry: false,
    }),
```

Why: No write invalidates every detail at once; each names the one todo it changed, so
`details()` is a level nothing calls. A prefix goes only where something invalidates at
it, never for symmetry.

## Bad: `keepPreviousData` is left to each page

```ts
  list: (params: TodoListParams) =>
    queryOptions({
      queryKey: [...todoQueries.lists(), params],
      queryFn: () => todoApi.getList(params),
    }),
```

Why: Every page reading the list now has to add it at its own call, and one that forgets
drops to the Skeleton on each filter change. An option every consumer wants the same way
belongs in the definition.
