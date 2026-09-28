# container / list-page

When: a page whose URL is nothing but a fixed path, such as a plain list or a create form.

## Good

```tsx
// src/features/todo/Todo/Todo.container.tsx
import { useTodoContainer } from "./Todo.container.hook";
import { TodoComponent } from "./Todo.component";

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
```

Why:

- No `useParams` and no `useSearch`. Nothing in this page's address varies, so the
  Container calls the hook and nothing else.
- `useTodoContainer()` is called here and in no other file. That keeps the QueryClient
  out of the Component: its stories set every state through `args`, and its tests pass
  plain props.
- Each field is destructured by name and passed as its own prop. What the Component
  receives is written here, one line per field.
- The return is the Component and nothing else: no wrapper, no heading, no loading
  branch. Design and the Skeleton are the Component's.
- No `useState` and no `useNavigate`. The Container holds nothing and only reads the
  address; an input's value is the component hook's, and a redirect after saving is the
  Component's.
- With no state and no branch there is nothing to exercise, so the file gets no test and
  no story.

## Usage

The code that uses this Container: the page's route, the only place it is rendered.

```ts
// src/features/todo/Todo/Todo.route.ts
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { TodoContainer } from "./Todo.container";

export const todoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos",
  // attached last, once this Container exists
  component: TodoContainer,
});
```

## Bad: the Component calls the hook itself

```tsx
// Todo.route.ts
  component: TodoComponent,

// Todo.component.tsx
export function TodoComponent() {
  const { todos, isPending, isRefetching, addTodo, deleteTodo } = useTodoContainer();
```

Why: Every story and test of the page now needs a QueryClient and a mock server; an
empty list is no longer just `args: { todos: [] }`.

## Bad: the state is spread

```tsx
export function TodoContainer() {
  const state = useTodoContainer();
  return <TodoComponent {...state} />;
}
```

Why: What reaches the Component is no longer written anywhere. Discrete props keep the
wiring visible.

## Bad: the Container holds the input's value

```tsx
export function TodoContainer() {
  const [newTitle, setNewTitle] = useState("");
  const { todos, isPending, isRefetching, addTodo, deleteTodo } = useTodoContainer();
  return (
    <TodoComponent
      newTitle={newTitle}
      setNewTitle={setNewTitle}
      todos={todos}
```

Why: The Container holds nothing. An input's value is local UI state, which the
component hook keeps.
