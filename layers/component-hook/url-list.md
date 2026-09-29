# component-hook / url-list

When: a list whose filter, sort and page live in the URL.

## Good

```ts
// src/features/todo/TodoList/TodoList.component.hook.ts
import { useCallback, useMemo } from "react";
import type { Member } from "@api/Member.api";
import type { Todo } from "@api/Todo.api";
import type { TodoListSearch } from "./TodoList.search";
import { toTodoListRow, type TodoListRow } from "./TodoList.view-model";

export interface TodoListAssigneeOption {
  id: string;
  name: string;
  checked: boolean;
}

export interface TodoListComponentParams {
  todos: Todo[];
  members: Member[];
  totalPages: number;
  search: TodoListSearch;
  applySearch: (next: TodoListSearch) => void;
}

export interface TodoListComponentState {
  rows: TodoListRow[];
  assigneeOptions: TodoListAssigneeOption[];
  toggleAssignee: (memberId: string) => void;
  previousPageSearch: TodoListSearch | undefined;
  nextPageSearch: TodoListSearch | undefined;
}

export function useTodoListComponent({
  todos,
  members,
  totalPages,
  search,
  applySearch,
}: TodoListComponentParams): TodoListComponentState {
  const rows = useMemo(() => todos.map(toTodoListRow), [todos]);

  const assigneeOptions = useMemo(
    () =>
      members.map((member) => ({
        id: member.id,
        name: member.name,
        checked: search.assigneeIds.includes(member.id),
      })),
    [members, search.assigneeIds],
  );

  const toggleAssignee = useCallback(
    (memberId: string) => {
      const assigneeIds = search.assigneeIds.includes(memberId)
        ? search.assigneeIds.filter((id) => id !== memberId)
        : [...search.assigneeIds, memberId];
      applySearch({ ...search, assigneeIds, page: 1 });
    },
    [search, applySearch],
  );

  const previousPageSearch = useMemo(
    () => (search.page > 1 ? { ...search, page: search.page - 1 } : undefined),
    [search],
  );
  const nextPageSearch = useMemo(
    () => (search.page < totalPages ? { ...search, page: search.page + 1 } : undefined),
    [search, totalPages],
  );

  return { rows, assigneeOptions, toggleAssignee, previousPageSearch, nextPageSearch };
}
```

Why:

- `toggleAssignee` ends in `applySearch(next)`. A checkbox changes the address the moment
  it is clicked, so the Component passes the navigating callback in, and the hook decides
  only what `next` is.
- `previousPageSearch` and `nextPageSearch` are values, not handlers. The pager is made of
  `<Link>`s, and a link has nothing to call: it needs the search it points at.
- Every next search spreads the current `search`, the parsed value with every defaulted
  field present. The other filters carry over, and `next` is a whole `TodoListSearch`.
- A toggled assignee sets `page: 1`; the pager changes `page` and nothing else. Which
  control sends the list back to its first page is decided here, and since `1` is the
  default, the route strips it and the address carries no `page` at all.
- `assigneeOptions` merges the server's members with the selection in `search`. It is a
  lookup with no display decision in it, so it stays in a memo here.
- `rows` is `todos.map(toTodoListRow)` in a memo. The wording is built in the view model;
  the hook only memoizes it.

## Usage

The code that uses this hook, down to the line where each value is used.

```tsx
// TodoList.component.tsx — wraps navigate as applySearch, and calls the hook here, where the filter stays mounted while the rows load
export function TodoListComponent({
  todos,
  members,
  totalPages,
  isTodosPending,
  isTodosRefetching,
  search,
}: TodoListComponentProps) {
  const navigate = useNavigate();
  const applySearch = useCallback(
    (next: TodoListSearch) => navigate({ to: "/todos", search: next }),
    [navigate],
  );
  const { rows, assigneeOptions, toggleAssignee, previousPageSearch, nextPageSearch } =
    useTodoListComponent({ todos, members, totalPages, search, applySearch });
  return (
    <>
      <fieldset>
        {assigneeOptions.map((option) => (
          <label key={option.id}>
            <input
              type="checkbox"
              checked={option.checked}
              onChange={() => toggleAssignee(option.id)}
            />
            {option.name}
          </label>
        ))}
      </fieldset>
      <div className={isTodosRefetching ? "opacity-50" : ""}>
        {isTodosPending ? <TodoRowsSkeleton /> : <TodoRows rows={rows} />}
      </div>
      <nav>
        {previousPageSearch && <Link to="/todos" search={previousPageSearch}>Previous</Link>}
        {nextPageSearch && <Link to="/todos" search={nextPageSearch}>Next</Link>}
      </nav>
    </>
  );
}
```

## Bad: the hook navigates

```ts
export function useTodoListComponent({
  todos,
  members,
  totalPages,
  search,
}: TodoListComponentParams): TodoListComponentState {
  const navigate = useNavigate();
  // ...
      navigate({ to: "/todos", search: { ...search, assigneeIds, page: 1 } });
```

Why: Changing the address is now split between the hook's `navigate` and the Component's
`<Link>`s. The Component owns both and hands the hook `applySearch`.

## Bad: the pager gets handlers

```ts
  const goToNextPage = useCallback(
    () => applySearch({ ...search, page: search.page + 1 }),
    [search, applySearch],
  );
```

Why: The pager can no longer be a `<Link>`, which has nothing to call and needs the search
it points at. For a link, the hook returns the value.

## Bad: the rows are worded in the hook

```ts
  const rows = useMemo(
    () =>
      todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        statusLabel: todo.completed ? "Done" : "Open",
      })),
    [todos],
  );
```

Why: A word for a status is a display decision, and display decisions are built in the
view model as plain functions. The hook memoizes what they build.
