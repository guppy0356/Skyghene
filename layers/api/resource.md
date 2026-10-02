# api / resource

When: a resource whose list endpoint takes no query parameters, with nothing nested under its records.

## Good

```ts
// src/api/Todo.api.ts
import { api } from "../lib/api-client";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "../lib/api.gen";

export type { Todo, CreateTodoInput, UpdateTodoInput };

export const todoApi = {
  getAll: (): Promise<Todo[]> => api.get("/api/todos"),
  getDetail: (id: string): Promise<Todo> =>
    api.get("/api/todos/{todoId}", { path: { todoId: id } }),
  create: (input: CreateTodoInput): Promise<Todo> =>
    api.post("/api/todos", { body: input }),
  update: (id: string, input: UpdateTodoInput): Promise<Todo> =>
    api.patch("/api/todos/{todoId}", { path: { todoId: id }, body: input }),
  delete: (id: string) =>
    api.delete("/api/todos/{todoId}", { path: { todoId: id } }),
};
```

Why:

- Every call goes through `api` from `src/lib/api-client`, the generated client. It parses
  and validates each success response against the contract, so the functions return the
  data itself with no `.json<T>()` cast.
- The types are imported from `src/lib/api.gen` and re-exported by name. This file is the
  only app code that imports the generated module; everything upstream takes `Todo` from
  `@api/Todo.api`.
- The paths are the contract's own literals, with `{todoId}` filled through `path`, so a
  line here and its `openapi.yaml` entry read the same.
- No `try`/`catch`. A 404 throws `TypedStatusError` out of here, and turning it into
  `isNotFound` is the container hook's job.
- A plain object of functions with no React import and no query keys. Keys and query
  options are the Queries layer's, which imports this file.

## Usage

The code that uses this facade, down to the line where each value is used.

```ts
// src/api/Todo.queries.ts — the queryFn of each definition is a todoApi function
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

// TodoList.container.hook.ts — writes call todoApi directly; the types come from @api
const addMutation = useMutation({
  mutationFn: (input: CreateTodoInput) => todoApi.create(input),
  onSettled: () => queryClient.invalidateQueries({ queryKey: todoQueries.list().queryKey }),
});
```

## Bad: the response is cast instead of validated

```ts
import ky from "ky";
// ...
  getAll: (): Promise<Todo[]> => ky.get("/api/todos").json<Todo[]>(),
```

Why: The cast checks nothing at runtime, so a field renamed on the server surfaces as
`undefined` in a render. Calls go through the generated `api` client, which validates the
response at this boundary.

## Bad: a 404 is caught here

```ts
  getDetail: async (id: string): Promise<Todo | undefined> => {
    try {
      return await api.get("/api/todos/{todoId}", { path: { todoId: id } });
    } catch {
      return undefined;
    }
  },
```

Why: The API layer handles no errors; the caller can no longer tell "not found" from "no
data yet". The container hook maps `TypedStatusError` to `isNotFound` itself.

## Bad: the facade carries the query keys

```ts
export const todoApi = {
  keys: { list: ["todos", "list"] as const },
  getAll: (): Promise<Todo[]> => api.get("/api/todos"),
```

Why: Keys now live in two layers and drift from the factory that invalidates them. Query
keys and TanStack Query options belong to `Todo.queries.ts` alone.
