# container-hook / url-list

When: a list whose filter, sort and page live in the URL, and whose filter needs a second
resource for its options. Here `Todo` has an `assigneeId`, `Member` is the second resource,
and Queries is the parameterized shape: a `lists()` prefix over a `list(params)` leaf.

## Good

```ts
// src/features/todo/TodoList/TodoList.container.hook.ts
import { useQuery } from "@tanstack/react-query";
import type { Todo, TodoListParams } from "@api/Todo.api";
import { todoQueries } from "@api/Todo.queries";
import type { Member } from "@api/Member.api";
import { memberQueries } from "@api/Member.queries";

export interface TodoListContainerParams {
  params: TodoListParams;
}

export interface TodoListContainerState {
  todos: Todo[];
  total: number;
  members: Member[];
  isTodosPending: boolean;
  isTodosRefetching: boolean;
  isMembersPending: boolean;
}

export function useTodoListContainer({
  params,
}: TodoListContainerParams): TodoListContainerState {
  const todosQuery = useQuery(todoQueries.list(params));
  const membersQuery = useQuery(memberQueries.list());

  return {
    todos: todosQuery.data?.items ?? [],
    total: todosQuery.data?.total ?? 0,
    members: membersQuery.data ?? [],
    isTodosPending: todosQuery.isPending,
    isTodosRefetching: todosQuery.isRefetching,
    isMembersPending: membersQuery.isPending,
  };
}
```

Why:

- `params` arrives as one object typed as `TodoListParams`, the API layer's type. The
  Container passes the parsed search as it is; nothing reshapes it between the Container
  and the wire.
- `todoQueries.list(params)` puts the params in the key, so every filter and page is its
  own cache entry. With `placeholderData: keepPreviousData` in the Queries definition, a
  key change keeps the old rows on screen and shows as `isTodosRefetching`.
- Two queries, so every flag names its resource. `isTodosPending` draws the row Skeleton
  and `isMembersPending` disables the filter; neither waits for the other.
- The second resource comes from `@api/Member.queries` the same way as the first. The
  cache is central, so reading another resource never reaches into another feature's
  directory.
- `total` is returned beside `todos` because the pager renders it. What the page does not
  render, the hook does not return.

## Usage

The code that uses this hook, down to the line where each value is used.

```tsx
// TodoList.container.tsx — reads the search once, passes it to the hook as params and to the Component as a prop
export function TodoListContainer() {
  const search = useSearch({ from: "/todos" });
  const {
    todos,
    total,
    members,
    isTodosPending,
    isTodosRefetching,
    isMembersPending,
  } = useTodoListContainer({ params: search });
  return (
    <TodoListComponent
      todos={todos}
      total={total}
      members={members}
      isTodosPending={isTodosPending}
      isTodosRefetching={isTodosRefetching}
      isMembersPending={isMembersPending}
      search={search}
    />
  );
}

// TodoList.component.tsx — the rows wait on the todos flags, the filter on the members flag; search renders the current controls
export function TodoListComponent({
  todos,
  total,
  members,
  isTodosPending,
  isTodosRefetching,
  isMembersPending,
  search,
}: TodoListComponentProps) {
  const navigate = useNavigate();
  const applySearch = useCallback(
    (next: TodoListSearch) => navigate({ to: "/todos", search: next }),
    [navigate],
  );
  const { onAssigneeChange, onPageChange } = useTodoListComponent({ search, applySearch });
  return (
    <>
      <select value={search.assigneeId ?? ""} disabled={isMembersPending} onChange={onAssigneeChange}>
        <option value="">Everyone</option>
        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <div className={isTodosRefetching ? "opacity-50" : ""}>
        {isTodosPending ? <TodoRowsSkeleton /> : <TodoRows todos={todos} />}
      </div>
      <Pager page={search.page} total={total} onPageChange={onPageChange} />
    </>
  );
}
```

## Bad: one flag for two queries

```ts
  return {
    todos: todosQuery.data?.items ?? [],
    members: membersQuery.data ?? [],
    isPending: todosQuery.isPending || membersQuery.isPending,
  };
```

Why: The rows now wait for the member list, and the Component cannot say which of the
two its Skeleton stands in for. Two or more queries put the resource in front of every
flag.

## Bad: the filter lives in `useState`

```ts
export function useTodoListContainer(): TodoListContainerState {
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const todosQuery = useQuery(todoQueries.list({ assigneeId, page: 1 }));
```

Why: A list's filter should survive a reload and be shareable, so it belongs in the URL.
Held here it is gone on reload and cannot be linked to. `useState` in a container hook is
for query input deliberately kept out of the URL, such as a typeahead keyword.

## Bad: `params` is returned

```ts
  return {
    todos: todosQuery.data?.items ?? [],
    // ...
    params,
  };
```

Why: The Container already has the search and passes it to the Component as its own
prop. Read once, injected twice, never round-tripped through the hook's return.
