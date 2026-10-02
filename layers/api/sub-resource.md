# api / sub-resource

When: a resource with another resource nested under each record, such as `/todos/{todoId}/comments`.

## Good

```ts
// src/api/Todo.api.ts
import { api } from "../lib/api-client";
import type {
  Comment as TodoComment,
  CreateCommentInput as CreateTodoCommentInput,
  get__api_todos,
  Todo,
  UpdateTodoInput,
} from "../lib/api.gen";

export type { Todo, UpdateTodoInput, TodoComment, CreateTodoCommentInput };

// A query-parameter type is generated onto the endpoint, not among the schemas.
export type TodoListParams = NonNullable<get__api_todos["parameters"]["query"]>;

export const todoApi = {
  getList: (params: TodoListParams): Promise<Todo[]> =>
    api.get("/api/todos", { query: params }),
  getDetail: (id: string): Promise<Todo> =>
    api.get("/api/todos/{todoId}", { path: { todoId: id } }),
  update: (id: string, input: UpdateTodoInput): Promise<Todo> =>
    api.patch("/api/todos/{todoId}", { path: { todoId: id }, body: input }),
  getComments: (id: string): Promise<TodoComment[]> =>
    api.get("/api/todos/{todoId}/comments", { path: { todoId: id } }),
  addComment: (id: string, input: CreateTodoCommentInput): Promise<TodoComment> =>
    api.post("/api/todos/{todoId}/comments", { path: { todoId: id }, body: input }),
};
```

Why:

- The contract's `Comment` is renamed `TodoComment` on the way in. `Comment` is also a DOM
  global, and a file that forgets the import binds to the global without a type error; the
  prefix keeps the two apart.
- `CreateCommentInput` takes the same prefix, so the nested resource's names read as one
  family wherever they are imported.
- The nested endpoints sit in the parent's facade, `todoApi.getComments` beside
  `todoApi.getDetail`. The parent id is the first argument, and the path keeps the
  contract's `{todoId}` literal, filled through `path`.
- Each function is a plain call on the generated client. No React and no error handling,
  so a missing todo's comments throw `TypedStatusError` to the caller like any other 404.
- This list takes query parameters, so `TodoListParams` is declared here off the generated
  endpoint and handed to the client as `query`. A list that takes none would be
  `getAll()` alone.

## Usage

The code that uses this facade, down to the line where each value is used.

```ts
// src/api/Todo.queries.ts — the comments key calls the nested fetcher
comments: (id: string) =>
  queryOptions({
    queryKey: [...todoQueries.all(), "comments", id],
    queryFn: () => todoApi.getComments(id),
  }),

// TodoDetail.view-model.ts — the renamed type is what a page imports
import type { TodoComment } from "@api/Todo.api";

export function toTodoDetailComment(comment: TodoComment): TodoDetailComment {
  return { id: comment.id, body: comment.body, author: comment.author ?? "Anonymous" };
}
```

## Bad: `Comment` is re-exported under its own name

```ts
import type { Comment, Todo, UpdateTodoInput } from "../lib/api.gen";

export type { Todo, UpdateTodoInput, Comment };
```

Why: In any file that forgets `import type { Comment } from "@api/Todo.api"`, `Comment`
silently means the DOM node type, and neither spelling is a type error. Prefix it with
the resource: `TodoComment`.

## Bad: the nested path is a template string

```ts
  getComments: (id: string): Promise<TodoComment[]> =>
    api.get(`/api/todos/${id}/comments`),
```

Why: The line no longer reads like the `openapi.yaml` entry it calls. Pass the contract's
literal and fill `{todoId}` through `path`.

## Bad: the facade exports a hook

```ts
import { useQuery } from "@tanstack/react-query";
// ...
export function useTodoComments(id: string) {
  return useQuery({ queryKey: ["todos", "comments", id], queryFn: () => todoApi.getComments(id) });
}
```

Why: The API layer is pure functions with no React, and this key bypasses the Queries
factory that invalidates it. Server state is read in the container hook through
`todoQueries.comments(id)`.
