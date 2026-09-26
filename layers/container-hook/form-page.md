# container-hook / form-page

When: a form that navigates to another page once it has saved.

## Good

```ts
// src/features/todo/TodoForm/TodoForm.container.hook.ts
import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { todoApi, type CreateTodoInput, type Todo } from "@api/Todo.api";
import { todoQueries } from "@api/Todo.queries";

export interface TodoFormContainerState {
  addTodo: (input: CreateTodoInput) => Promise<Todo>;
}

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

Why:

- No optimistic update, invalidate only. The page navigates away on save, so nobody is
  looking at the rewritten list.
- No `useQuery`. The list lives on another page, and the cache is reachable by key, so it
  can be invalidated without being subscribed to.
- Only `todoQueries.list()` is invalidated. A create makes only the list wrong; there is
  no detail cache for the new id yet.
- `addTodo` returns the created `Todo`. The Component uses its id to navigate to the
  detail page.
- The mutation's `isPending` is not returned. Whether a submit is in flight is the
  component hook's, as the form's `isSubmitting`.

## Usage

The code that uses this hook, down to the line where each value is used.

```tsx
// TodoForm.container.tsx — calls the hook and passes addTodo as a prop, nothing else
export function TodoFormContainer() {
  const { addTodo } = useTodoFormContainer();
  return <TodoFormComponent addTodo={addTodo} />;
}

// TodoForm.component.tsx — wraps navigate in a callback for the hook; the created Todo's id leads to the detail page
export function TodoFormComponent({ addTodo }: TodoFormContainerState) {
  const navigate = useNavigate();
  const onSaved = useCallback(
    (todo: Todo) => navigate({ to: "/todos/$todoId", params: { todoId: todo.id } }),
    [navigate],
  );
  const { titleField, isValid, isSubmitting, handleSubmit } = useTodoFormComponent({ addTodo, onSaved });
  // ...
}

// TodoForm.component.hook.ts — calls addTodo and hands the returned Todo to onSaved
export function useTodoFormComponent({
  addTodo,
  onSaved,
}: TodoFormComponentParams): TodoFormComponentState {
  // ... useForm and the field objects
  const onSubmit = useCallback(
    async (data: TodoFormValues) => {
      const created = await addTodo(data);
      onSaved(created);
    },
    [addTodo, onSaved],
  );
  // ...
}
```

## Bad: an optimistic update on a list nobody sees

```ts
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onMutate: (input) => {
      queryClient.setQueryData<Todo[]>(todoQueries.list().queryKey, (old) => [
        ...(old ?? []),
        { id: crypto.randomUUID(), title: input.title, completed: false },
      ]);
    },
```

Why: The page navigates away on save, so nobody sees the rewritten list. All it does is
fabricate an id the server decides.

## Bad: the hook navigates

```ts
  const navigate = useNavigate();
  const addMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onSuccess: (todo) => {
      navigate({ to: "/todos/$todoId", params: { todoId: todo.id } });
    },
```

Why: Changing the URL is the Component's job. A hook that navigates needs a router just
to be called.

## Bad: invalidating with `all()`

```ts
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueries.all() });
    },
```

Why: `invalidateQueries` matches by prefix. `all()` refetches every cached detail as
well.
