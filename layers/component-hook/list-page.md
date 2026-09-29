# component-hook / list-page

When: a list with nothing in the URL, and a plain text box on it that adds a row, with no schema to validate it.

## Good

```ts
// src/features/todo/Todo/Todo.component.hook.ts
import { useCallback, useState } from "react";
import type { CreateTodoInput } from "@api/Todo.api";

export interface TodoComponentParams {
  addTodo: (input: CreateTodoInput) => Promise<void>;
}

export interface TodoComponentState {
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

export function useTodoComponent({ addTodo }: TodoComponentParams): TodoComponentState {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = useCallback(async () => {
    const title = newTitle.trim();
    if (!title) return;
    await addTodo({ title });
    setNewTitle("");
  }, [newTitle, addTodo]);

  return { newTitle, setNewTitle, handleSubmit };
}
```

Why:

- `newTitle` is `useState` here. What the user is typing is local UI state, and local UI
  state lives in the component hook, not in the Container or the container hook.
- `handleSubmit` turns the typed text into a `CreateTodoInput`. Building a write's input
  from what was typed is the hook's work, not the view model's, however pure it is.
- `addTodo` arrives as a param under `TodoComponentParams`. The hook never calls the
  container hook, so the Component that calls it still renders from props alone.
- The hook takes `addTodo` and nothing else. `todos` and `deleteTodo` go from the
  Component's props straight to the body; the hook returns only what it creates.
- The return type is the named `TodoComponentState`: the contract the Component
  destructures, written out rather than inferred.

## Usage

The code that uses this hook, down to the line where each value is used.

```tsx
// Todo.component.tsx — calls the hook in the exported Component, so the typed text survives the list's loading
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <div className={isRefetching ? "opacity-50" : ""}>
        {isPending ? <TodoListSkeleton /> : <TodoList todos={todos} deleteTodo={deleteTodo} />}
      </div>
    </>
  );
}
```

## Bad: `deleteTodo` goes through the hook

```ts
export interface TodoComponentParams {
  addTodo: (input: CreateTodoInput) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}
// ...
  return { newTitle, setNewTitle, handleSubmit, deleteTodo };
```

Why: The hook hands back an action it did not create. The body reads `deleteTodo`
straight from the Component's props.

## Bad: the hook calls the container hook

```ts
export function useTodoComponent(): TodoComponentState {
  const { addTodo } = useTodoContainer();
  const [newTitle, setNewTitle] = useState("");
```

Why: The Component now reaches the server through this hook, so every story and test of
it needs a QueryClient and a mock server. Actions arrive as params.

## Bad: the return type is inferred

```ts
export function useTodoComponent({ addTodo }: TodoComponentParams) {
  // ...
  return { newTitle, setNewTitle, handleSubmit };
}

export type TodoComponentState = ReturnType<typeof useTodoComponent>;
```

Why: Nothing states what the hook returns any more; the contract is whatever the body
happens to return. A hook publishes a named interface.
