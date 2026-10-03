# search / detail-with-tab

When: a page for one record, found by the id in the URL path, whose open tab lives in the search and is never sent to the API.

## Good

```ts
// src/features/todo/TodoDetail/TodoDetail.search.ts
import { z } from "zod";
import { stripSearchParams } from "@tanstack/react-router";

// Written here: the API has never heard of a tab, which only picks the pane
// this page shows.
const TodoDetailTab = z.enum(["details", "comments"]);
type TodoDetailTab = z.infer<typeof TodoDetailTab>;

// Declared first: the schema reads it, and so does the strip middleware.
const todoDetailSearchDefaults = {
  tab: "details" as TodoDetailTab,
};

// A malformed tab falls back to the first pane instead of failing the route: a
// typo in a shared link should still show the todo.
const todoDetailSearchSchema = z.object({
  tab: TodoDetailTab
    .default(todoDetailSearchDefaults.tab)
    .catch(todoDetailSearchDefaults.tab),
});

export type TodoDetailSearch = z.infer<typeof todoDetailSearchSchema>;

export const todoDetailRouteOptions = {
  validateSearch: todoDetailSearchSchema,
  search: {
    middlewares: [stripSearchParams<TodoDetailSearch>(todoDetailSearchDefaults)],
  },
};
```

Why:

- `TodoDetailTab` lists its members right here. A tab only picks which pane the page shows
  and is never sent anywhere, so there is no generated enum to read them from. The value
  and the type share one name, the way the generated contract names its enums.
- There is no `satisfies` line. Nothing in this search reaches a request, so there is no
  endpoint's params type to pin it to.
- `tab` is the only field. The page declares what it shows and nothing of the list it was
  opened from, so `/todos/1?status=["done"]` shows the same todo as `/todos/1`, to anyone.
- `tab` takes `.default()`: some pane is always showing, so the tab always means something.
  The default comes from the object declared first, which the strip middleware reads too,
  so `/todos/1` and `/todos/1?tab=details` are one address. `"details"` carries
  `as TodoDetailTab`, since a bare literal widens to `string`.
- `.catch()` comes with the comment above the schema: what a malformed tab does is decided,
  and said, in the module. A typo in a link still shows the todo, on its first pane.
- Only `todoDetailRouteOptions` and `TodoDetailSearch` are exported. The schema and the
  defaults stay private, and the route and the test router spread the options whole.

## Usage

The code that uses this file's exports: the route spreads the options, the Container reads the parsed tab, and the Component's links write it back.

```tsx
// TodoDetail.route.ts — the spread is what types useSearch({ from: "/todos/$todoId" }) as TodoDetailSearch
export const todoDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos/$todoId",
  ...todoDetailRouteOptions,
  component: TodoDetailContainer,
});

// TodoDetail.container.tsx — search.tab always holds a pane; the hook learns only whether to load the comments
export function TodoDetailContainer() {
  const { todoId } = useParams({ from: "/todos/$todoId" });
  const search = useSearch({ from: "/todos/$todoId" });
  const { detail, comments, isTodoPending, isNotFound, isCommentsLoading } =
    useTodoDetailContainer({ todoId, withComments: search.tab === "comments" });
  return (
    <TodoDetailComponent
      detail={detail}
      comments={comments}
      isTodoPending={isTodoPending}
      isNotFound={isNotFound}
      isCommentsLoading={isCommentsLoading}
      search={search}
    />
  );
}

// TodoDetail.component.tsx — a tab link replaces the history entry and compares the search exactly
function TodoTabLinks({ todoId }: { todoId: string }) {
  return (
    <nav className="flex gap-2 border-b">
      <Link
        to="/todos/$todoId"
        params={{ todoId }}
        search={{ tab: "details" }}
        replace
        activeOptions={{ exact: true }}
        activeProps={{ className: "font-semibold" }}
      >
        Details
      </Link>
      <Link
        to="/todos/$todoId"
        params={{ todoId }}
        search={{ tab: "comments" }}
        replace
        activeOptions={{ exact: true }}
        activeProps={{ className: "font-semibold" }}
      >
        Comments
      </Link>
    </nav>
  );
}
```

## Bad: the list's filters ride along

```ts
const todoDetailSearchSchema = z.object({
  tab: TodoDetailTab
    .default(todoDetailSearchDefaults.tab)
    .catch(todoDetailSearchDefaults.tab),
  // The list's filters, kept so a link back can rebuild the list the reader came from
  status: z.array(z.enum(TODO_STATUSES)).optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
});
```

Why: The address now describes how the reader got here, so a shared link offers its
receiver a way back to a list only the sender ever saw. The page declares what it shows;
the way back is the browser's Back button.

## Bad: the tab has no default

```ts
const todoDetailSearchSchema = z.object({
  tab: TodoDetailTab.optional().catch(undefined),
});

// TodoDetail.component.tsx
      tab={search.tab ?? "details"}
```

Why: Which pane an absent tab shows is now decided in the Component, outside the contract,
and every other reader of `search.tab` has to decide it again. A pane is always showing, so
the tab always means something and takes `.default()`.

## Bad: the default pane is written twice

```ts
const todoDetailSearchSchema = z.object({
  tab: TodoDetailTab.default("details").catch("details"),
});

export type TodoDetailSearch = z.infer<typeof todoDetailSearchSchema>;

export const todoDetailRouteOptions = {
  validateSearch: todoDetailSearchSchema,
  search: {
    middlewares: [stripSearchParams<TodoDetailSearch>({ tab: "details" })],
  },
};
```

Why: Change the default pane in the schema alone and the middleware still strips
`tab=details`, so the Details link opens the new default pane instead. The defaults object
is declared once, and the schema and the middleware both read it.
