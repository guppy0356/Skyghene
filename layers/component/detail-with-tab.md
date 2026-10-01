# component / detail-with-tab

When: a page for one record, found by the id in the URL path, whose open tab lives in the search.

## Good

```tsx
// src/features/todo/TodoDetail/TodoDetail.component.tsx
import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { Todo, TodoComment } from "@api/Todo.api";
import type { TodoDetailContainerState } from "./TodoDetail.container.hook";
import type { TodoDetailSearch } from "./TodoDetail.search";
import { useTodoDetailComponent } from "./TodoDetail.component.hook";

export interface TodoDetailComponentProps extends TodoDetailContainerState {
  search: TodoDetailSearch;
}

// Placeholder for the comments pane alone: the record and the tabs stay on screen
function TodoCommentsSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1].map((i) => (
        <li key={i} className="rounded border p-2">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

// Private memo'd body: owns the tabs, so the comments' own loading flag comes in here
const TodoTabs = memo(function TodoTabs({
  detail,
  comments,
  isCommentsLoading,
  tab,
}: {
  detail: Todo;
  comments: TodoComment[];
  isCommentsLoading: boolean;
  tab: TodoDetailSearch["tab"];
}) {
  const { headline, commentItems } = useTodoDetailComponent({ detail, comments });
  return (
    <article className="space-y-4">
      <h1 className="text-xl font-semibold">{detail.title}</h1>
      <nav className="flex gap-2 border-b">
        <Link
          to="/todos/$todoId"
          params={{ todoId: detail.id }}
          search={{ tab: "details" }}
          replace
          activeOptions={{ exact: true }}
          activeProps={{ className: "border-b-2 border-blue-500 font-semibold" }}
          className="px-3 py-2"
        >
          Details
        </Link>
        <Link
          to="/todos/$todoId"
          params={{ todoId: detail.id }}
          search={{ tab: "comments" }}
          replace
          activeOptions={{ exact: true }}
          activeProps={{ className: "border-b-2 border-blue-500 font-semibold" }}
          className="px-3 py-2"
        >
          Comments
        </Link>
      </nav>
      {tab === "details" ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-gray-600">Assignee</dt>
          <dd>{headline.assignee}</dd>
          <dt className="text-gray-600">Due</dt>
          <dd>{headline.due}</dd>
        </dl>
      ) : isCommentsLoading ? (
        <TodoCommentsSkeleton />
      ) : (
        <ul className="space-y-2">
          {commentItems.map((comment) => (
            <li key={comment.id} className="rounded border p-2">
              <p className="text-sm text-gray-600">
                {comment.author} · {comment.postedAt}
              </p>
              <p>{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
});

// Private Skeleton: page-level, standing in for the whole record
function TodoDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-64 animate-pulse rounded bg-gray-200" />
      <div className="h-9 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-16 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export function TodoDetailComponent({
  detail,
  comments,
  isTodoPending,
  isTodoRefetching,
  isNotFound,
  isCommentsLoading,
  search,
}: TodoDetailComponentProps) {
  if (isNotFound) return <p>No todo has this id.</p>;
  if (isTodoPending || detail === undefined) return <TodoDetailSkeleton />;
  return (
    <div className={`transition-opacity ${isTodoRefetching ? "opacity-50" : ""}`}>
      <TodoTabs
        detail={detail}
        comments={comments}
        isCommentsLoading={isCommentsLoading}
        tab={search.tab}
      />
    </div>
  );
}
```

Why:

- `isCommentsLoading` is passed into `TodoTabs`. The body owns the tabs and calls the hook,
  so it is the only place the comments pane is drawn, and the flag changes only when the
  comments load, never on a background refetch.
- `isTodoRefetching` stays in the exported Component, which dims the whole body from outside.
  It flips on every background refetch, and the body's `memo` would never skip if it came in.
- The tab links navigate with `replace`. A pane is not a destination: switching tabs adds
  nothing to the history, so the list stays one Back away whichever tab is showing.
- Both tab links set `activeOptions={{ exact: true }}`. The Details link carries no `tab` once
  the default is stripped, and a partial comparison would mark it current on every tab.
- `TodoDetailComponentProps` extends the container state with `search`, and the body gets
  `tab={search.tab}`. URL state is the one prop from outside the hook, and the body takes only
  the string it renders.

## Usage

The code that renders this Component: its Container, the one caller in the app.

```tsx
// TodoDetail.container.tsx — two reads of the address and one hook call; search also goes down as its own prop
export function TodoDetailContainer() {
  const { todoId } = useParams({ from: "/todos/$todoId" });
  const search = useSearch({ from: "/todos/$todoId" });
  const { detail, comments, isTodoPending, isTodoRefetching, isNotFound, isCommentsLoading } =
    useTodoDetailContainer({ todoId, withComments: search.tab === "comments" });
  return (
    <TodoDetailComponent
      detail={detail}
      comments={comments}
      isTodoPending={isTodoPending}
      isTodoRefetching={isTodoRefetching}
      isNotFound={isNotFound}
      isCommentsLoading={isCommentsLoading}
      search={search}
    />
  );
}
```

## Bad: the page's Skeleton waits for the comments

```tsx
  if (isNotFound) return <p>No todo has this id.</p>;
  if (isTodoPending || isCommentsLoading || detail === undefined) return <TodoDetailSkeleton />;
  return (
    <div className={`transition-opacity ${isTodoRefetching ? "opacity-50" : ""}`}>
      <TodoTabs detail={detail} comments={comments} tab={search.tab} />
    </div>
  );
```

Why: Opening the comments tab now blanks the whole record, tabs included, until the comments
arrive. A flag that only the body's own pane toggles goes to the body that draws the pane.

## Bad: the tabs push history

```tsx
        <Link
          to="/todos/$todoId"
          params={{ todoId: detail.id }}
          search={{ tab: "comments" }}
          activeOptions={{ exact: true }}
          activeProps={{ className: "border-b-2 border-blue-500 font-semibold" }}
          className="px-3 py-2"
        >
          Comments
        </Link>
```

Why: Every tab switch is now a history entry, so Back steps through the tabs before it reaches
the list. A pane is not a destination, and switching it replaces the current entry.

## Bad: the tabs compare the search partially

```tsx
        <Link
          to="/todos/$todoId"
          params={{ todoId: detail.id }}
          search={{ tab: "details" }}
          replace
          activeProps={{ className: "border-b-2 border-blue-500 font-semibold" }}
          className="px-3 py-2"
        >
          Details
        </Link>
```

Why: On the comments tab both links are now marked current, `aria-current` included, because
the Details link carries no `tab` once the default is stripped. Links that differ only by a
search parameter compare it exactly.
