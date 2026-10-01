# component / detail-page

When: a page for one record, found by the id in the URL path, with nothing in the search and no form filled in from it.

## Good

```tsx
// src/features/todo/TodoDetail/TodoDetail.component.tsx
import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { Todo, TodoStatus } from "@api/Todo.api";
import type { TodoDetailContainerState } from "./TodoDetail.container.hook";
import { useTodoDetailComponent } from "./TodoDetail.component.hook";

const STATUS_TONES: Record<TodoStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-gray-100 text-gray-600",
};

// Private memo'd body: gets the loaded record, derives through the hook, reads the rest raw
const TodoOverview = memo(function TodoOverview({ detail }: { detail: Todo }) {
  const { headline } = useTodoDetailComponent({ detail });
  return (
    <article className="space-y-2">
      <h1 className="text-xl font-semibold">{detail.title}</h1>
      <span className={`rounded px-2 py-0.5 text-sm ${STATUS_TONES[headline.status]}`}>
        {headline.statusLabel}
      </span>
      <p>{headline.assignee}</p>
      <p>{headline.due}</p>
    </article>
  );
});

// Private Skeleton: page-level, standing in for the whole record
function TodoDetailSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-7 w-64 animate-pulse rounded bg-gray-200" />
      <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
      <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export function TodoDetailComponent({
  detail,
  isPending,
  isRefetching,
  isNotFound,
}: TodoDetailContainerState) {
  return (
    <div className="space-y-4">
      <Link to="/todos" className="text-sm text-blue-600 hover:underline">
        All todos
      </Link>
      {isNotFound ? (
        <p>No todo has this id.</p>
      ) : isPending || detail === undefined ? (
        <TodoDetailSkeleton />
      ) : (
        <div className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
          <TodoOverview detail={detail} />
        </div>
      )}
    </div>
  );
}
```

Why:

- `TodoOverview` receives the record and calls `useTodoDetailComponent` itself. It needs the
  raw `detail.title` as well as the headline the hook derives, and inside it `detail` is a
  `Todo`, never `undefined`.
- Not-found and loading are handled before the body is rendered, and neither branch calls the
  hook. The 404 screen is drawn from the `isNotFound` prop alone, so a story reaches it through
  `args`.
- `TodoDetailSkeleton` takes no props and stands in for the whole record. A detail page cannot
  be laid out before its record arrives, so the placeholder is page-level rather than per row.
- The body is `memo`'d and gets `detail` and nothing else. Structural sharing keeps `detail`'s
  reference across a refetch that changed nothing, and `isRefetching` dims the body from
  outside.
- `STATUS_TONES` is keyed by the raw `status` that rides beside `statusLabel`, next to the JSX
  it styles. The view model supplies the words; the classNames are the Component's.
- The link to the list says where it goes, "All todos", and carries no search. A reader who
  arrived by a shared link has no list to go back to.

## Usage

The code that renders this Component: its Container, and the stories that reach each state through `args`.

```tsx
// TodoDetail.container.tsx — reads the id from the path; every field of the hook's state as its own prop
export function TodoDetailContainer() {
  const { todoId } = useParams({ from: "/todos/$todoId" });
  const { detail, isPending, isRefetching, isNotFound } = useTodoDetailContainer({ todoId });
  return (
    <TodoDetailComponent
      detail={detail}
      isPending={isPending}
      isRefetching={isRefetching}
      isNotFound={isNotFound}
    />
  );
}

// TodoDetail.component.stories.tsx — has-data, loading and 404 are one set of args each; the router is for the link
const meta = {
  title: "features/TodoDetail",
  component: TodoDetailComponent,
  decorators: [
    (Story) => (
      <TodoRouterHarness initialUrl="/todos/1">
        <Story />
      </TodoRouterHarness>
    ),
  ],
  args: { detail: undefined, isPending: false, isRefetching: false, isNotFound: false },
} satisfies Meta<typeof TodoDetailComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { detail: { id: "1", title: "Buy milk", status: "open", assignee: null, dueAt: null } },
};
export const Loading: Story = { args: { isPending: true } };
export const NotFound: Story = { args: { isNotFound: true } };
```

## Bad: the hook is called in the exported Component

```tsx
export function TodoDetailComponent({
  detail,
  isPending,
  isRefetching,
  isNotFound,
}: TodoDetailContainerState) {
  const { headline } = useTodoDetailComponent({ detail });
```

Why: The hook now runs while the record is loading and on the 404 screen, so it must take
`undefined`, and so must everything it returns. A body that needs the raw record gets it as a
prop and calls the hook itself, after the branches.

## Bad: a Back button

```tsx
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        Back
      </button>
```

Why: A reader who opened this page from a shared link has no list behind it, so Back leaves
the app. A link out names where it goes and carries no search.

## Bad: the badge is styled by its label

```tsx
const LABEL_TONES: Record<string, string> = {
  Open: "bg-blue-100 text-blue-800",
  "In progress": "bg-amber-100 text-amber-800",
  Done: "bg-gray-100 text-gray-600",
};

// ...
      <span className={`rounded px-2 py-0.5 text-sm ${LABEL_TONES[headline.statusLabel]}`}>
```

Why: Rewording a status in the view model now drops its color, and a new status gets none
without the build noticing. The Component keys its styling from the raw member beside the
label.
