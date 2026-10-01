# component / url-list

When: a list whose filter, sort or page lives in the URL's search.

## Good

```tsx
// src/features/todo/TodoList/TodoList.component.tsx
import { memo, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { TodoListContainerState } from "./TodoList.container.hook";
import type { TodoListSearch } from "./TodoList.search";
import { useTodoListComponent } from "./TodoList.component.hook";
import { STATUS_FILTER_OPTIONS, type TodoListRow } from "./TodoList.view-model";

export interface TodoListComponentProps extends TodoListContainerState {
  search: TodoListSearch;
}

// Private memo'd body: a pure view over the finished rows
const TodoRows = memo(function TodoRows({ rows }: { rows: TodoListRow[] }) {
  return (
    <ul className="divide-y rounded border">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center gap-4 p-2">
          <Link to="/todos/$todoId" params={{ todoId: row.id }} className="flex-1 hover:underline">
            {row.title}
          </Link>
          <span className="text-sm">{row.statusLabel}</span>
          <span className="text-sm text-gray-600">{row.assignee}</span>
        </li>
      ))}
    </ul>
  );
});

// Private Skeleton: the same <ul>, with placeholder rows
function TodoRowsSkeleton() {
  return (
    <ul className="divide-y rounded border">
      {[0, 1, 2].map((i) => (
        <li key={i} className="p-2">
          <div className="h-5 w-64 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

export function TodoListComponent({
  todos,
  totalPages,
  isPending,
  isRefetching,
  search,
}: TodoListComponentProps) {
  const navigate = useNavigate();
  const applySearch = useCallback(
    (next: TodoListSearch) => navigate({ to: "/todos", search: next }),
    [navigate],
  );
  const { rows, toggleStatus, previousPageSearch, nextPageSearch } = useTodoListComponent({
    todos,
    totalPages,
    search,
    applySearch,
  });

  return (
    <section className="space-y-4">
      <fieldset className="flex gap-4">
        <legend className="sr-only">Status</legend>
        {STATUS_FILTER_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={search.status.includes(option.value)}
              onChange={() => toggleStatus(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <div className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
        {isPending ? <TodoRowsSkeleton /> : <TodoRows rows={rows} />}
      </div>
      <nav className="flex gap-4">
        {previousPageSearch && (
          <Link to="/todos" search={previousPageSearch}>
            Previous
          </Link>
        )}
        {nextPageSearch && (
          <Link to="/todos" search={nextPageSearch}>
            Next
          </Link>
        )}
      </nav>
    </section>
  );
}
```

Why:

- `TodoListComponentProps` extends the container state with `search`, the one prop that
  does not come from the hook. The Component renders the current filter and page from it and
  writes the next ones back, which is what earns URL state a prop.
- The checkboxes change the address the moment they are clicked, so `navigate` is wrapped as
  `applySearch` and handed to the hook. The pager is made of `<Link>`s, which have nothing to
  call, so they take the hook's `previousPageSearch` and `nextPageSearch` as values. Either
  way the hook decides the next search and the Component does the navigating.
- The hook is called in the exported Component, and `TodoRows` receives the finished `rows`.
  The body is a pure view over the view model; `rows` comes out of the hook's memo, so it
  keeps its reference while `todos` does and the `memo` skips a refetch that changed nothing.
- `TodoRowsSkeleton` stands in for the rows alone, so the filter and the pager stay on screen
  during the first load. A new filter needs nothing of its own: the previous rows stay while
  the new key loads, which is `isRefetching`, and the same overlay dims them.
- A row's link names the todo and carries no search. A row is the address of one todo, not a
  description of the list around it.

## Usage

The code that renders this Component: its Container, and the stories that pin a filtered page through `args`.

```tsx
// TodoList.container.tsx — reads the search once, hands it to the hook as params and to the Component as a prop
export function TodoListContainer() {
  const search = useSearch({ from: "/todos" });
  const { todos, totalPages, isPending, isRefetching } = useTodoListContainer({ params: search });
  return (
    <TodoListComponent
      todos={todos}
      totalPages={totalPages}
      isPending={isPending}
      isRefetching={isRefetching}
      search={search}
    />
  );
}

// TodoList.component.stories.tsx — the filter and the page are args; the router is there for the links and navigate
const meta = {
  title: "features/TodoList",
  component: TodoListComponent,
  decorators: [
    (Story) => (
      <TodoRouterHarness initialUrl="/todos">
        <Story />
      </TodoRouterHarness>
    ),
  ],
  args: {
    todos: [],
    totalPages: 1,
    isPending: false,
    isRefetching: false,
    search: { status: [], page: 1 },
  },
} satisfies Meta<typeof TodoListComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenOnlyPageTwo: Story = {
  args: {
    todos: [{ id: "1", title: "Buy milk", status: "open", assignee: null, dueAt: null }],
    totalPages: 3,
    search: { status: ["open"], page: 2 },
  },
};
export const Loading: Story = { args: { isPending: true } };
```

## Bad: the Component reads the search itself

```tsx
export function TodoListComponent({
  todos,
  totalPages,
  isPending,
  isRefetching,
}: TodoListContainerState) {
  const search = useSearch({ from: "/todos" });
  const navigate = useNavigate();
```

Why: A story can no longer pin a filtered list through `args`; only the router's URL can set
it. The Container reads the search once and passes it down as a prop.

## Bad: a row link keeps the list's search

```tsx
          <Link
            to="/todos/$todoId"
            params={{ todoId: row.id }}
            search={true}
            className="flex-1 hover:underline"
          >
```

Why: Every todo's address now carries the list's filters, so a shared link offers its reader
a list only the sender saw. A row link names the record and nothing about the list around it.

## Bad: the pager builds its search in the JSX

```tsx
        {search.page > 1 && (
          <Link to="/todos" search={{ ...search, page: search.page - 1 }}>
            Previous
          </Link>
        )}
        {search.page < totalPages && (
          <Link to="/todos" search={{ ...search, page: search.page + 1 }}>
            Next
          </Link>
        )}
```

Why: What carries over to the next page is now decided in the markup, while the filter's next
search is built in the hook. The hook derives every next search that carries the current one
over, and a link takes it as a value.
