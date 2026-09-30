# view-model / detail-page

When: a page that shows one record by the id in the URL, with no form filled in from it.

## Good

```ts
// src/features/todo/TodoDetail/TodoDetail.view-model.ts
import type { Todo, TodoComment, TodoStatus } from "@api/Todo.api";

export interface TodoDetailHeadline {
  status: TodoStatus;
  statusLabel: string;
  assignee: string;
  due: string;
}

export interface TodoDetailComment {
  id: string;
  author: string;
  body: string;
  postedAt: string;
}

const STATUS_LABELS: Record<TodoStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

const toDisplayInstant = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;

export function toTodoDetailHeadline(todo: Todo): TodoDetailHeadline {
  return {
    status: todo.status,
    statusLabel: STATUS_LABELS[todo.status],
    assignee: todo.assignee === null ? "Nobody is assigned yet" : `Assigned to ${todo.assignee}`,
    due: todo.dueAt === null ? "No due date" : `Due ${toDisplayInstant(todo.dueAt)}`,
  };
}

export function toTodoDetailComment(comment: TodoComment): TodoDetailComment {
  return {
    id: comment.id,
    author: comment.author,
    body: comment.body,
    postedAt: toDisplayInstant(comment.postedAt),
  };
}
```

Why:

- `STATUS_LABELS` is this page's own table, although the list page over the same todos
  names the same statuses. Each page owns its wording, and each copy is exhaustive over
  `TodoStatus`, so a new status stops the build in both.
- The shapes are `TodoDetailHeadline` and `TodoDetailComment`, named for this page. A
  list's row and a detail's headline are different shapes, and the names keep either from
  being read as the contract type imported beside it.
- One pure function per record: `toTodoDetailHeadline` for the todo, `toTodoDetailComment`
  for each of its comments.
- `toDisplayInstant` is a function of its own because both record functions need it. The
  words for a missing assignee or due date stay expressions inside the headline's function.
- `assignee` and `due` are whole phrases composed here (`Assigned to …`, `Due …`), with no
  `Intl`, so the page's behavior test asserts on exactly what the user reads.
- `status` rides beside `statusLabel`, so the Component keys its badge styles from the raw
  member, beside the JSX.

## Usage

The code that uses this file's exports, down to the line where each value is used.

```tsx
// TodoDetail.component.hook.ts — memoizes the headline and the comments; the body calls it once the record has loaded
export function useTodoDetailComponent({
  detail,
  comments,
}: TodoDetailComponentParams): TodoDetailComponentState {
  const headline = useMemo(() => toTodoDetailHeadline(detail), [detail]);
  const commentItems = useMemo(() => comments.map(toTodoDetailComment), [comments]);
  return { headline, commentItems };
}

// TodoDetail.component.tsx — the body renders what the hook returns, and keys the badge's className from the raw status
const STATUS_TONES: Record<TodoStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-gray-100 text-gray-600",
};

const TodoDetailBody = memo(function TodoDetailBody({
  detail,
  comments,
}: {
  detail: Todo;
  comments: TodoComment[];
}) {
  const { headline, commentItems } = useTodoDetailComponent({ detail, comments });
  return (
    <article>
      <h1>{detail.title}</h1>
      <span className={STATUS_TONES[headline.status]}>{headline.statusLabel}</span>
      <p>{headline.assignee}</p>
      <p>{headline.due}</p>
      <ul>
        {commentItems.map((comment) => (
          <li key={comment.id}>
            <p>
              {comment.author} · {comment.postedAt}
            </p>
            <p>{comment.body}</p>
          </li>
        ))}
      </ul>
    </article>
  );
});
```

## Bad: the wording comes from the list page

```ts
import type { Todo, TodoComment, TodoStatus } from "@api/Todo.api";
import { STATUS_LABELS } from "../TodoList/TodoList.view-model";
```

Why: The heading now says whatever the list chose for its cramped cells, and a word changed
for one page changes the other. Each page keeps its own exhaustive table.

## Bad: the time format is written into each function

```ts
export function toTodoDetailHeadline(todo: Todo): TodoDetailHeadline {
  return {
    // ...
    due:
      todo.dueAt === null
        ? "No due date"
        : `Due ${todo.dueAt.slice(0, 10)} ${todo.dueAt.slice(11, 16)} UTC`,
  };
}

export function toTodoDetailComment(comment: TodoComment): TodoDetailComment {
  return {
    // ...
    postedAt: `${comment.postedAt.slice(0, 10)} ${comment.postedAt.slice(11, 16)} UTC`,
  };
}
```

Why: One format is now written twice, and the heading and the comments can drift apart. A
conversion that a second record function needs becomes a function of its own.

## Bad: the headline drops the raw status

```ts
export interface TodoDetailHeadline {
  statusLabel: string;
  assignee: string;
  due: string;
}
```

Why: The Component can style the badge only by matching label text, so rewording a status
breaks its style. The raw member rides beside its label.
