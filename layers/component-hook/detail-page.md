# component-hook / detail-page

When: a page that shows one record by the id in the URL, with no text box and nothing in the search.

## Good

```ts
// src/features/todo/TodoDetail/TodoDetail.component.hook.ts
import { useCallback, useMemo } from "react";
import type { Todo, UpdateTodoInput } from "@api/Todo.api";
import { toTodoDetailHeadline, type TodoDetailHeadline } from "./TodoDetail.view-model";

export interface TodoDetailComponentParams {
  detail: Todo;
  updateTodo: (input: UpdateTodoInput) => Promise<void>;
}

export interface TodoDetailComponentState {
  headline: TodoDetailHeadline;
  toggleCompleted: () => Promise<void>;
}

export function useTodoDetailComponent({
  detail,
  updateTodo,
}: TodoDetailComponentParams): TodoDetailComponentState {
  const headline = useMemo(() => toTodoDetailHeadline(detail), [detail]);

  const toggleCompleted = useCallback(
    () => updateTodo({ completed: !detail.completed }),
    [detail.completed, updateTodo],
  );

  return { headline, toggleCompleted };
}
```

Why:

- `detail` is `Todo`, never `undefined`. The hook runs inside the private body, and the
  Component renders that body only after it has dealt with `isPending` and `isNotFound`.
- `headline` is derived here because only the body shows it. The loading and not-found
  branches never call the hook; a derivation they needed too would be a plain function
  beside the contract it reads, called from both.
- `toTodoDetailHeadline` builds the labels in the view model; the hook only memoizes the
  result.
- `toggleCompleted` builds `{ completed: !detail.completed }` from the record on screen.
  A write's input is built toward the wire, so it is the hook's and not the view model's.
- No `useState`. Nothing here is the user's own to hold; a memo and a handler are the
  whole hook, and a hook with no state is fine.
- `detail` is not returned. The body already has it as a prop and reads `detail.title`
  from there.

## Usage

The code that uses this hook, down to the line where each value is used.

```tsx
// TodoDetail.component.tsx — deals with loading and not-found first, so the body that calls the hook always has a record
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

// the private body calls the hook, renders what it returns, and reads the title straight from detail
const TodoDetailBody = memo(function TodoDetailBody({
  detail,
  updateTodo,
}: {
  detail: Todo;
  updateTodo: TodoDetailContainerState["updateTodo"];
}) {
  const { headline, toggleCompleted } = useTodoDetailComponent({ detail, updateTodo });
  return (
    <>
      <h1>{detail.title}</h1>
      <p>{headline.statusLabel}</p>
      <button onClick={toggleCompleted}>{headline.toggleLabel}</button>
    </>
  );
});
```

## Bad: the hook takes a record that may not have loaded

```ts
export interface TodoDetailComponentParams {
  detail: Todo | undefined;
  updateTodo: (input: UpdateTodoInput) => Promise<void>;
}
// ...
  const headline = useMemo(
    () => (detail === undefined ? undefined : toTodoDetailHeadline(detail)),
    [detail],
  );
```

Why: The loading case now runs through the hook, and every value it returns can be
`undefined`. The Component handles loading before it renders the body that calls the hook.

## Bad: `completed` is copied into state

```ts
  const [completed, setCompleted] = useState(detail.completed);
  const headline = useMemo(
    () => toTodoDetailHeadline({ ...detail, completed }),
    [detail, completed],
  );

  const toggleCompleted = useCallback(async () => {
    setCompleted(!completed);
    await updateTodo({ completed: !completed });
  }, [completed, updateTodo]);
```

Why: `completed` now has two homes, the cache and this state, and the copy keeps its first
value when a refetch brings a new one. Server data lives in the container hook's cache.

## Bad: `detail` is returned

```ts
export interface TodoDetailComponentState {
  detail: Todo;
  headline: TodoDetailHeadline;
  toggleCompleted: () => Promise<void>;
}
// ...
  return { detail, headline, toggleCompleted };
```

Why: The hook hands back data it did not create. The body already has `detail` as a prop.
