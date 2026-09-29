# container-hook / list-page

When: a list with nothing in the URL that stays on screen while the user adds to it and removes from it.

## Good

```ts
// src/features/todo/Todo/Todo.container.hook.ts
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { todoApi, type CreateTodoInput, type Todo } from "@api/Todo.api";
import { todoQueries } from "@api/Todo.queries";

export interface TodoContainerState {
  todos: Todo[];
  isPending: boolean;
  isRefetching: boolean;
  addTodo: (input: CreateTodoInput) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

export function useTodoContainer(): TodoContainerState {
  const queryClient = useQueryClient();
  const listQuery = todoQueries.list();
  const { data, isPending, isRefetching } = useQuery(listQuery);

  const addMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    // cancel in-flight fetches, keep the previous list, write the cache first
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listQuery.queryKey });
      const previous = queryClient.getQueryData<Todo[]>(listQuery.queryKey);
      queryClient.setQueryData<Todo[]>(listQuery.queryKey, (old) => [
        ...(old ?? []),
        { id: crypto.randomUUID(), title: input.title, completed: false },
      ]);
      return { previous };
    },
    // on failure, restore the previous list
    onError: (_error, _input, context) => {
      queryClient.setQueryData(listQuery.queryKey, context?.previous);
    },
    // either way, refetch from the server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listQuery.queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => todoApi.delete(id),
    // the same three steps: cancel, snapshot, drop the row from the cache
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listQuery.queryKey });
      const previous = queryClient.getQueryData<Todo[]>(listQuery.queryKey);
      queryClient.setQueryData<Todo[]>(listQuery.queryKey, (old) =>
        (old ?? []).filter((todo) => todo.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(listQuery.queryKey, context?.previous);
    },
    // the record is gone: drop its detail cache instead of refetching it
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: todoQueries.detail(id).queryKey });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listQuery.queryKey });
    },
  });

  const addTodo = useCallback(
    async (input: CreateTodoInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation.mutateAsync],
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation.mutateAsync],
  );

  return { todos: data ?? [], isPending, isRefetching, addTodo, deleteTodo };
}
```

Why:

- Adding and deleting are optimistic updates. The list stays on screen, so the user sees
  each write right away.
- The optimistic row is the input plus a temporary `id` from `crypto.randomUUID()` and the
  `completed` default: the least a `Todo` needs to render. The refetch in `onSettled`
  replaces it with the server's row.
- A delete removes `detail(id)` with `removeQueries` instead of invalidating it. The
  record no longer exists, so there is nothing to refetch.
- Keys are read from `listQuery.queryKey`. `useQuery` and every mutation callback use
  one definition, so the key cannot drift.
- `addTodo` and `deleteTodo` depend on `mutateAsync`. It is a stable reference, so both
  are stable too and the Component's `memo`'d body does not re-render.
- `todos` is `data ?? []`. `data` is `undefined` until the first fetch completes, and the
  Component must not receive `undefined`.
- Only `isPending` and `isRefetching` are returned. This page renders exactly two things
  from them: the Skeleton, and the dimmed list during a refetch.

## Usage

The code that uses this hook, down to the line where each value is used.

```tsx
// Todo.container.tsx — takes the result and splits it into individual props
export function TodoContainer() {
  const { todos, isPending, isRefetching, addTodo, deleteTodo } = useTodoContainer();
  return (
    <TodoComponent
      todos={todos}
      isPending={isPending}
      isRefetching={isRefetching}
      addTodo={addTodo}
      deleteTodo={deleteTodo}
    />
  );
}

// Todo.component.tsx — switches between Skeleton and dimmed list on the flags; hands addTodo to the component hook and deleteTodo to the rows
export function TodoComponent({
  todos,
  isPending,
  isRefetching,
  addTodo,
  deleteTodo,
}: TodoContainerState) {
  const { newTitle, setNewTitle, handleSubmit } = useTodoComponent({ addTodo });
  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <div className={isRefetching ? "opacity-50" : ""}>
        {isPending ? <TodoListSkeleton /> : <TodoList todos={todos} deleteTodo={deleteTodo} />}
      </div>
    </>
  );
}

// the private body calls deleteTodo with the row's id
const TodoList = memo(function TodoList({
  todos,
  deleteTodo,
}: { todos: Todo[]; deleteTodo: TodoContainerState["deleteTodo"] }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          {todo.title} <button onClick={() => deleteTodo(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
});

// Todo.component.hook.ts — takes addTodo as a param and calls it inside handleSubmit
export function useTodoComponent({ addTodo }: TodoComponentParams): TodoComponentState {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed });
    setNewTitle("");
  }, [newTitle, addTodo]);

  return { newTitle, setNewTitle, handleSubmit };
}
```

## Bad: the hook holds the form input

```ts
export function useTodoContainer(): TodoContainerState {
  const [newTitle, setNewTitle] = useState("");
  // ...
  return { todos: data ?? [], isPending, isRefetching, addTodo, newTitle, setNewTitle };
}
```

Why: The input value is local UI state and belongs to the component hook. Held here,
even a test of the input field needs a QueryClient and a mock server.

## Bad: `useCallback` depends on the mutation object

```ts
  const addTodo = useCallback(
    async (input: CreateTodoInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation],
  );
```

Why: `useMutation` returns a new object on every render. `addTodo` changes with it, and
the Component's `memo`'d body re-renders on every refetch.

## Bad: the key is written by hand

```ts
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", "list"] });
    },
```

Why: The key is now defined in two places, here and in Queries. Change the Queries side
and this one silently stops matching; nothing fails to typecheck.

## Bad: a delete invalidates the detail

```ts
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: todoQueries.detail(id).queryKey });
    },
```

Why: `invalidateQueries` keeps the stale record and refetches it, asking the server for
something that no longer exists and getting a 404. `removeQueries` drops the entry.
