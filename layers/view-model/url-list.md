# view-model / url-list

When: a list with a filter or sort control that offers a fixed set of choices, such as one per status.

## Good

```ts
// src/features/todo/TodoList/TodoList.view-model.ts
import type { Todo, TodoSort, TodoStatus } from "@api/Todo.api";

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

export const STATUS_FILTER_OPTIONS = (
  Object.entries(STATUS_LABELS) as [TodoStatus, string][]
).map(([value, label]) => ({ value, label }));

const SORT_LABELS: Record<TodoSort, string> = {
  "-createdAt": "Newest first",
  createdAt: "Oldest first",
  dueAt: "Due soonest",
};

export const SORT_OPTIONS = (
  Object.entries(SORT_LABELS) as [TodoSort, string][]
).map(([value, label]) => ({ value, label }));

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

- `STATUS_FILTER_OPTIONS` and `SORT_OPTIONS` are plain constants. They depend on neither the
  server's data nor the current search, so they are built once here, not in a memo with an
  empty dependency array.
- Each option list is built from its label table's entries, so the controls offer their
  choices in the table's order, and the page's default sort, newest first, comes first. The
  generated `TODO_SORTS` answers only which sorts exist, in openapi.yaml's order.
- The rows' `statusLabel` and the filter's labels read the same `STATUS_LABELS`. Within one
  page a status has one name, so the filter and the rows cannot disagree.
- `STATUS_LABELS` and `SORT_LABELS` are hand-written `Record`s over the contract types, so a
  status or a sort added to the API stops the build until it has a word.
- `status` rides beside `statusLabel` in `TodoListRow`. This file supplies the words; the
  Component keys its badge styles from the raw member, beside the JSX.

## Usage

The code that uses this file's exports, down to the line where each value is used.

```tsx
// TodoList.component.hook.ts — memoizes the rows and builds the next search; the option constants need no memo
export function useTodoListComponent({
  todos,
  search,
  applySearch,
}: TodoListComponentParams): TodoListComponentState {
  const rows = useMemo(() => todos.map(toTodoListRow), [todos]);

  const toggleStatus = useCallback(
    (status: TodoStatus) => {
      const next = search.status.includes(status)
        ? search.status.filter((s) => s !== status)
        : [...search.status, status];
      applySearch({ ...search, status: next, page: 1 });
    },
    [search, applySearch],
  );

  const changeSort = useCallback(
    (sort: TodoSort) => applySearch({ ...search, sort, page: 1 }),
    [search, applySearch],
  );

  return { rows, toggleStatus, changeSort };
}

// TodoList.component.tsx — renders each control's choices straight from the constants, checked against the search
export function TodoListComponent({
  todos,
  isPending,
  isRefetching,
  search,
}: TodoListComponentProps) {
  const navigate = useNavigate();
  const applySearch = useCallback(
    (next: TodoListSearch) => navigate({ to: "/todos", search: next }),
    [navigate],
  );
  const { rows, toggleStatus, changeSort } = useTodoListComponent({ todos, search, applySearch });
  return (
    <>
      <fieldset>
        {STATUS_FILTER_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="checkbox"
              checked={search.status.includes(option.value)}
              onChange={() => toggleStatus(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        {SORT_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              checked={search.sort === option.value}
              onChange={() => changeSort(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <div className={isRefetching ? "opacity-50" : ""}>
        {isPending ? <TodoRowsSkeleton /> : <TodoRows rows={rows} />}
      </div>
    </>
  );
}
```

## Bad: the sort options are a memo in the hook

```ts
// TodoList.view-model.ts
export const SORT_LABELS: Record<TodoSort, string> = {
  "-createdAt": "Newest first",
  createdAt: "Oldest first",
  dueAt: "Due soonest",
};

// TodoList.component.hook.ts
  const sortOptions = useMemo(
    () =>
      (Object.entries(SORT_LABELS) as [TodoSort, string][]).map(([value, label]) => ({
        value,
        label,
      })),
    [],
  );
```

Why: The options depend on neither the server's data nor the search, yet they are built
inside React behind an empty dependency array. Something that depends on nothing is a plain
constant in this file.

## Bad: the sort options follow the generated array

```ts
import { TODO_SORTS, type Todo, type TodoSort, type TodoStatus } from "@api/Todo.api";

// ...

export const SORT_OPTIONS = TODO_SORTS.map((value) => ({ value, label: SORT_LABELS[value] }));
```

Why: The control now lists the sorts in openapi.yaml's order, which nobody chose for this
screen. The generated array says which sorts exist; the label table says in what order
they are offered.

## Bad: the next search is built here

```ts
import type { TodoListSearch } from "./TodoList.search";

// ...

export function toggleStatus(search: TodoListSearch, status: TodoStatus): TodoListSearch {
  const next = search.status.includes(status)
    ? search.status.filter((s) => s !== status)
    : [...search.status, status];
  return { ...search, status: next, page: 1 };
}
```

Why: This builds toward the URL, and that direction is the component hook's, however pure
the function is. This file builds only from the contract toward the screen.
