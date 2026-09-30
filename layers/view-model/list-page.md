# view-model / list-page

When: a list with no filter or sort control that offers a fixed set of choices.

## Good

```ts
// src/features/todo/TodoList/TodoList.view-model.ts
import type { Todo, TodoStatus } from "@api/Todo.api";

export interface TodoListRow {
  id: string;
  title: string;
  status: TodoStatus;
  statusLabel: string;
  assignee: string;
  due: string;
}

const STATUS_LABELS: Record<TodoStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

const toDisplayInstant = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;

export function toTodoListRow(todo: Todo): TodoListRow {
  return {
    id: todo.id,
    title: todo.title,
    status: todo.status,
    statusLabel: STATUS_LABELS[todo.status],
    assignee: todo.assignee ?? "Unassigned",
    due: todo.dueAt === null ? "No due date" : toDisplayInstant(todo.dueAt),
  };
}
```

Why:

- The file exists because the rows carry decisions: a word for each status, `"Unassigned"`
  for a missing assignee, and a due time written out as text. A list that showed contract
  values as they arrive would have no view model.
- `STATUS_LABELS` is a hand-written `Record<TodoStatus, string>`. It is exhaustive over the
  contract type, so a status added to the API stops the build here until it has a name.
- `status` rides beside `statusLabel` in `TodoListRow`, and no className appears. This file
  supplies the words; the Component keys its badge styles from the raw member, beside the
  JSX.
- `toTodoListRow` is one pure function for one record, and each field's conversion is an
  expression inside it. Only `toDisplayInstant` is a function of its own, because the
  time's format is a decision of its own.
- `toDisplayInstant` slices the ISO string instead of calling `Intl`, so the text a test
  asserts on is the same on every machine.
- The only import is types from `@api/Todo.api`. No React, no hooks, no state: one glance
  at the imports says no React reached the mapping.

## Usage

The code that uses this file's exports, down to the line where each value is used.

```tsx
// TodoList.component.hook.ts — builds the rows in a memo and adds nothing else
export function useTodoListComponent({ todos }: TodoListComponentParams): TodoListComponentState {
  const rows = useMemo(() => todos.map(toTodoListRow), [todos]);
  return { rows };
}

// TodoList.component.tsx — the badge's className table sits beside the JSX, keyed by the raw status
const STATUS_TONES: Record<TodoStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-gray-100 text-gray-600",
};

const TodoRows = memo(function TodoRows({ rows }: { rows: TodoListRow[] }) {
  return (
    <ul>
      {rows.map((row) => (
        <li key={row.id}>
          <span className={STATUS_TONES[row.status]}>{row.statusLabel}</span>
          <span>{row.title}</span>
          <span>{row.assignee}</span>
          <span>{row.due}</span>
        </li>
      ))}
    </ul>
  );
});

export function TodoListComponent({ todos, isPending, isRefetching }: TodoListContainerState) {
  const { rows } = useTodoListComponent({ todos });
  return (
    <div className={isRefetching ? "opacity-50" : ""}>
      {isPending ? <TodoRowsSkeleton /> : <TodoRows rows={rows} />}
    </div>
  );
}
```

## Bad: the badge's className is decided here

```ts
const STATUS_TONES: Record<TodoStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-gray-100 text-gray-600",
};

export function toTodoListRow(todo: Todo): TodoListRow {
  return {
    // ...
    statusLabel: STATUS_LABELS[todo.status],
    statusClassName: STATUS_TONES[todo.status],
```

Why: Styling now lives in a file with no JSX, away from the markup it styles. This file
supplies the words; the Component keys its own className table from `status`.

## Bad: the due time goes through `toLocaleString`

```ts
    due: todo.dueAt === null ? "No due date" : new Date(todo.dueAt).toLocaleString(),
```

Why: The text now depends on the locale and ICU build of whichever machine runs the test,
so an assertion on it passes on one machine and fails on the next. The string is built by
hand.

## Bad: the labels are made from the enum's members

```ts
import { TODO_STATUSES, type Todo, type TodoStatus } from "@api/Todo.api";

const STATUS_LABELS = Object.fromEntries(
  TODO_STATUSES.map((status) => [status, status[0].toUpperCase() + status.slice(1).replace("_", " ")]),
) as Record<TodoStatus, string>;
```

Why: A status added to the contract now gets a name nobody chose, and the build carries on.
A hand-written `Record<TodoStatus, string>` stops the build until someone names it.

## Bad: the rows are memoized here

```ts
import { useMemo } from "react";
import type { Todo, TodoStatus } from "@api/Todo.api";

// ...

export function useTodoListRows(todos: Todo[]): TodoListRow[] {
  return useMemo(() => todos.map(toTodoListRow), [todos]);
}
```

Why: The imports no longer show at a glance that no React reached the mapping. The building
lives in this file and the memo in the component hook.
