# queries / resource

When: a resource whose list endpoint takes no query parameters, with nothing nested under its records.

## Good

```ts
// src/api/Todo.queries.ts
import { queryOptions } from "@tanstack/react-query";
import { todoApi } from "./Todo.api";

export const todoQueries = {
  all: () => ["todos"] as const,
  list: () =>
    queryOptions({
      queryKey: [...todoQueries.all(), "list"],
      queryFn: todoApi.getAll,
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

- `list()` and `detail(id)` both start from `all()`, so `["todos", "list"]` and
  `["todos", "detail", id]` are siblings. Invalidating the list leaves every cached detail
  alone, and `todoQueries.all()` still reaches both at once.
- `list()` takes no params because the endpoint takes none. Its key is both the query and
  the prefix a create invalidates, so nothing is needed above it.
- There is no `details()` level. A write touches one todo and names its `detail(id)`;
  nothing invalidates every detail at once.
- Each entry is a `queryOptions()` call. It does nothing at runtime: it checks the options
  where they are written and tags each key with its data type, so
  `getQueryData(todoQueries.detail(id).queryKey)` is typed `Todo | undefined`.
- `queryFn` calls `todoApi`. The request is built in the API layer; this file imports that
  layer and is never imported by it.
- `retry: false` is in the definition because every page that reads one todo wants it: a
  404 is the answer, and retrying only holds the Skeleton longer before `isNotFound`.
  `enabled` differs by page, so it is left to the container hook's call.

## Usage

The code that uses this factory, down to the line where each value is used.

```ts
// TodoList.container.hook.ts — list() as the query the page reads
export function useTodoListContainer(): TodoListContainerState {
  const { data, isPending, isRefetching } = useQuery(todoQueries.list());
  return { todos: data ?? [], isPending, isRefetching };
}

// TodoDetail.container.hook.ts — detail(id) for the id the Container read from the URL; a 404 arrives without retries
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

// TodoForm.container.hook.ts — list() again, this time as the key a create invalidates
export function useTodoFormContainer(): TodoFormContainerState {
  const queryClient = useQueryClient();
  const addMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueries.list().queryKey });
    },
  });
  const addTodo = useCallback(
    (input: CreateTodoInput) => addMutation.mutateAsync(input),
    [addMutation.mutateAsync],
  );
  return { addTodo };
}
```

## Bad: the list's key is the bare resource name

```ts
export const todoQueries = {
  list: () =>
    queryOptions({
      queryKey: ["todos"],
      queryFn: todoApi.getAll,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ["todos", id],
      queryFn: () => todoApi.getDetail(id),
      retry: false,
    }),
};
```

Why: `["todos"]` is a prefix of every detail key, so each create that invalidates the
list invalidates every cached todo with it. The `all()` root exists to sit above both, so
that neither is the other's prefix.

## Bad: an entry is a plain object

```ts
  detail: (id: string) => ({
    queryKey: [...todoQueries.all(), "detail", id],
    queryFn: () => todoApi.getDetail(id),
    retry: false,
  }),
```

Why: A misspelled option now compiles, and the key no longer carries `Todo`, so
`getQueryData` on it returns `unknown`. `queryOptions()` adds nothing at runtime; its
compile-time check is the reason to write it.

## Bad: a hook beside the definitions

```ts
import { queryOptions, useQuery } from "@tanstack/react-query";
import { todoApi } from "./Todo.api";

export const todoQueries = {
  // ...
};

export function useTodoList() {
  return useQuery(todoQueries.list());
}
```

Why: The Queries layer is a plain object with no React in it; `useQuery` is called in each
page's container hook. Two pages reading `todoQueries.list()` already share one cache
entry, so a shared hook shares nothing the cache does not.
