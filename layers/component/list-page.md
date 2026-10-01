# component / list-page

When: a list with nothing in the URL's search.

## Good

```tsx
// src/features/todo/Todo/Todo.component.tsx
import { memo } from "react";
import type { Todo } from "@api/Todo.api";
import type { TodoContainerState } from "./Todo.container.hook";
import { useTodoComponent } from "./Todo.component.hook";

// Private memo'd body: the rows, and nothing that has to survive loading
const TodoList = memo(function TodoList({
  todos,
  deleteTodo,
}: {
  todos: Todo[];
  deleteTodo: TodoContainerState["deleteTodo"];
}) {
  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <li key={todo.id} className="flex items-center justify-between rounded border p-2">
          <span>{todo.title}</span>
          <button
            type="button"
            onClick={() => deleteTodo(todo.id)}
            className="text-sm text-red-600 hover:underline"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
});

// Private Skeleton: the same <ul>, with placeholder rows
function TodoListSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2].map((i) => (
        <li key={i} className="rounded border p-2">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

export function TodoComponent({
  todos,
  isPending,
  isRefetching,
  addTodo,
  deleteTodo,
}: TodoContainerState) {
  const { newTitle, setNewTitle, handleSubmit } = useTodoComponent({ addTodo });

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Todos</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 rounded border px-3 py-2"
        />
        <button type="submit" className="rounded bg-blue-500 px-4 py-2 text-white">
          Add
        </button>
      </form>
      <div className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
        {isPending ? <TodoListSkeleton /> : <TodoList todos={todos} deleteTodo={deleteTodo} />}
      </div>
    </section>
  );
}
```

Why:

- `useTodoComponent` is called in the exported Component, not in `TodoList`. It holds what
  the user is typing, and the form does not depend on the todos, so it stays mounted while
  they load and keeps its value.
- `TodoListSkeleton` replaces only the `<ul>`. The heading and the add form stay rendered on
  first load, so the frame does not flash; only the rows become placeholders.
- `TodoList` is `memo`'d and receives `todos` and `deleteTodo`, nothing else. `todos` keeps
  its reference through TanStack Query's structural sharing and `deleteTodo` through the
  container hook's `useCallback`, so a background refetch re-renders the exported Component
  and skips the rows.
- `isPending` and `isRefetching` stop at the exported Component, and the overlay dims the
  body from outside. That is also why the exported Component has no `memo`: it receives a
  flag that flips on every background refetch.
- The props are `TodoContainerState` itself, because the Component renders every field the
  hook returns. A Component that rendered a strict subset would take a `Pick` of it.

## Usage

The code that renders this Component: its Container, and the stories that set each state through `args`.

```tsx
// Todo.container.tsx — the one caller in the app: every field of the hook's state as its own prop
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

// Todo.component.stories.tsx — each catalog state is one set of args, with no QueryClient and no server
const meta = {
  title: "features/Todo",
  component: TodoComponent,
  args: { todos: [], isPending: false, isRefetching: false, addTodo: fn(), deleteTodo: fn() },
} satisfies Meta<typeof TodoComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { todos: [{ id: "1", title: "Buy milk", completed: false }] },
};
export const Empty: Story = {};
export const Loading: Story = { args: { isPending: true } };
```

## Bad: the component hook is called in the body

```tsx
const TodoList = memo(function TodoList({
  todos,
  addTodo,
  deleteTodo,
}: {
  todos: Todo[];
  addTodo: TodoContainerState["addTodo"];
  deleteTodo: TodoContainerState["deleteTodo"];
}) {
  const { newTitle, setNewTitle, handleSubmit } = useTodoComponent({ addTodo });
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* the input and the Add button */}
      </form>
      <ul className="space-y-2">
```

Why: The add form now unmounts whenever the rows give way to the Skeleton, and anything
typed goes with it. A hook that holds input is called in the exported Component, which
stays mounted.

## Bad: the body dims itself

```tsx
const TodoList = memo(function TodoList({
  todos,
  isRefetching,
  deleteTodo,
}: {
  todos: Todo[];
  isRefetching: boolean;
  deleteTodo: TodoContainerState["deleteTodo"];
}) {
  return (
    <ul className={`space-y-2 transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
```

Why: `isRefetching` flips on every background refetch, so the `memo` never skips and every
row re-renders each time. The exported Component dims the body from outside.

## Bad: the Skeleton stands in for the whole page

```tsx
function TodoPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-24 animate-pulse rounded bg-gray-200" />
      <div className="h-10 animate-pulse rounded bg-gray-200" />
      <div className="h-32 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

// ...
  const { newTitle, setNewTitle, handleSubmit } = useTodoComponent({ addTodo });
  if (isPending) return <TodoPageSkeleton />;
```

Why: On first load the heading and the add form are gray blocks that then turn into the
real thing, so the frame flashes. On a list page only the rows become placeholders.
