# container-hook / detail-with-update

When: a page that shows one record by the id in the URL and changes it in place.

## Good

```ts
// src/features/todo/TodoDetail/TodoDetail.container.hook.ts
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { todoApi, type Todo, type UpdateTodoInput } from "@api/Todo.api";
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
  updateTodo: (input: UpdateTodoInput) => Promise<void>;
}

export function useTodoDetailContainer({
  todoId,
}: TodoDetailContainerParams): TodoDetailContainerState {
  const queryClient = useQueryClient();
  const detailQuery = todoQueries.detail(todoId);
  const { data, isPending, isRefetching, error } = useQuery(detailQuery);

  const updateMutation = useMutation({
    mutationFn: (input: UpdateTodoInput) => todoApi.update(todoId, input),
    // the record stays on screen: write the change into the detail cache first
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: detailQuery.queryKey });
      const previous = queryClient.getQueryData<Todo>(detailQuery.queryKey);
      if (previous) {
        queryClient.setQueryData<Todo>(detailQuery.queryKey, { ...previous, ...input });
      }
      return { previous };
    },
    // on failure, restore the previous record
    onError: (_error, _input, context) => {
      queryClient.setQueryData(detailQuery.queryKey, context?.previous);
    },
    // the response is the authoritative record: keep it instead of refetching the detail
    onSuccess: (updated) => {
      queryClient.setQueryData(detailQuery.queryKey, updated);
    },
    // the list renders the changed field, so it is now wrong
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueries.list().queryKey });
    },
  });

  const updateTodo = useCallback(
    async (input: UpdateTodoInput) => {
      await updateMutation.mutateAsync(input);
    },
    [updateMutation.mutateAsync],
  );

  return {
    detail: data,
    isPending,
    isRefetching,
    isNotFound: error instanceof TypedStatusError && error.status === 404,
    updateTodo,
  };
}
```

Why:

- The update is optimistic. The record stays on screen and the user watches the field
  change, so the cache is written first and rolled back on error.
- The optimistic record is `{ ...previous, ...input }` and nothing else. The hook
  fabricates no field it does not have.
- On success the response replaces the detail cache through `setQueryData`. It is the
  authoritative record, so refetching the detail would only fetch what is already in hand.
- The list is invalidated on settle because it renders `completed`. A write reconciles
  every cache that mirrors the changed field, and `list()` and `detail(id)` are siblings
  in the key hierarchy, so each is named on its own.
- `updateTodo` returns `Promise<void>` and depends on `mutateAsync`. The Component gets
  an action function, not the mutation object.

## Usage

The code that uses this hook, down to the line where each value is used.

```tsx
// TodoDetail.container.tsx — reads todoId from the URL, splits the result into individual props
export function TodoDetailContainer() {
  const { todoId } = useParams({ from: "/todos/$todoId" });
  const { detail, isPending, isRefetching, isNotFound, updateTodo } = useTodoDetailContainer({ todoId });
  return (
    <TodoDetailComponent
      detail={detail}
      isPending={isPending}
      isRefetching={isRefetching}
      isNotFound={isNotFound}
      updateTodo={updateTodo}
    />
  );
}

// TodoDetail.component.tsx — branches on the flags, then hands detail and updateTodo to the body
export function TodoDetailComponent({
  detail,
  isPending,
  isRefetching,
  isNotFound,
  updateTodo,
}: TodoDetailContainerState) {
  if (isNotFound) return <NotFound />;
  if (isPending || detail === undefined) return <TodoDetailSkeleton />;
  return (
    <div className={isRefetching ? "opacity-50" : ""}>
      <TodoDetailBody detail={detail} updateTodo={updateTodo} />
    </div>
  );
}

// the private body calls the component hook, which turns updateTodo into a handler
const TodoDetailBody = memo(function TodoDetailBody({
  detail,
  updateTodo,
}: { detail: Todo; updateTodo: TodoDetailContainerState["updateTodo"] }) {
  const { row, toggleDone } = useTodoDetailComponent({ detail, updateTodo });
  return (
    <>
      <h1>{row.title}</h1>
      <button onClick={toggleDone}>{row.completed ? "Reopen" : "Done"}</button>
    </>
  );
});

// TodoDetail.component.hook.ts — updateTodo is called inside the handler
export function useTodoDetailComponent({
  detail,
  updateTodo,
}: TodoDetailComponentParams): TodoDetailComponentState {
  const row = useMemo(() => toTodoRow(detail), [detail]);
  const toggleDone = useCallback(
    () => updateTodo({ completed: !detail.completed }),
    [detail.completed, updateTodo],
  );
  return { row, toggleDone };
}
```

## Bad: the optimistic record fabricates a field

```ts
    onMutate: async (input) => {
      // ...
      queryClient.setQueryData<Todo>(detailQuery.queryKey, {
        ...previous,
        ...input,
        updatedAt: new Date().toISOString(),
      });
```

Why: `updatedAt` is the server's to decide. The optimistic record may only contain what
the hook has: the previous record and the input.

## Bad: the list is left alone

```ts
    onSuccess: (updated) => {
      queryClient.setQueryData(detailQuery.queryKey, updated);
    },
    // no onSettled
```

Why: The list renders `completed`, so it is now wrong. Going back to it shows the old
value until something else refetches it. A write reconciles every cache that mirrors the
changed field.

## Bad: the mutation object is returned

```ts
  return { detail: data, isPending, isRefetching, isNotFound, updateMutation };
```

Why: The Component now imports TanStack Query's types, and every story has to fake a
mutation object. The hook returns action functions and flags; how they are implemented
stays here.
