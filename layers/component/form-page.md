# component / form-page

When: a page that is a form for a new record, validated by the page's zod schema.

## Good

```tsx
// src/features/todo/TodoForm/TodoForm.component.tsx
import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Todo } from "@api/Todo.api";
import type { TodoFormContainerState } from "./TodoForm.container.hook";
import { useTodoFormComponent } from "./TodoForm.component.hook";

// Private Skeleton: page-level, since the form's choices wait on the member list
function TodoFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 animate-pulse rounded bg-gray-200" />
      <div className="h-24 animate-pulse rounded bg-gray-200" />
      <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export function TodoFormComponent({ members, isPending, addTodo }: TodoFormContainerState) {
  const navigate = useNavigate();
  const onSaved = useCallback(
    (todo: Todo) => navigate({ to: "/todos/$todoId", params: { todoId: todo.id } }),
    [navigate],
  );
  const { titleField, assigneeField, isValid, isSubmitting, handleSubmit } = useTodoFormComponent({
    addTodo,
    onSaved,
  });

  if (isPending) return <TodoFormSkeleton />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm font-medium">Title</span>
        <input
          type="text"
          value={titleField.value}
          onChange={(e) => titleField.onChange(e.target.value)}
          onBlur={titleField.onBlur}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      {titleField.error && <p className="text-sm text-red-600">{titleField.error}</p>}
      <fieldset>
        <legend className="text-sm font-medium">Assignee</legend>
        {members.map((member) => (
          <label key={member.id} className="flex items-center gap-2">
            <input
              type="radio"
              name="assignee"
              checked={assigneeField.value === member.id}
              onChange={() => assigneeField.onChange(member.id)}
              onBlur={assigneeField.onBlur}
            />
            {member.name}
          </label>
        ))}
      </fieldset>
      {assigneeField.error && <p className="text-sm text-red-600">{assigneeField.error}</p>}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        Save
      </button>
    </form>
  );
}
```

Why:

- `useTodoFormComponent` is called in the exported Component, above the loading branch. It
  holds the form's values, and the exported Component stays mounted while the Skeleton shows,
  so a loading toggle resets nothing.
- `navigate` is wrapped as `onSaved` and handed to the hook. The Component calls the router,
  and the hook only says when the save is done, so changing the address stays in one layer.
- `TodoFormSkeleton` has no props and stands in for the whole form. This is not a list, and
  the assignee choices cannot be laid out before the members arrive.
- The inputs render from plain field objects: a value, `onChange`, `onBlur` and an error.
  Nothing in this file imports react-hook-form; `useForm` and its controllers stay in the hook.
- The button is disabled by `!isValid || isSubmitting`. The schema's verdict says whether the
  form may be sent, and the form's own in-flight flag says it is being sent.
- There is no `memo`'d body. The form's props would be its field objects, which carry the value
  being typed and change with every keystroke, so a `memo` would never skip.

## Usage

The code that renders this Component: its Container, and the stories that pin the option source through `args`.

```tsx
// TodoForm.container.tsx — the option source, its flag and the action, each as its own prop
export function TodoFormContainer() {
  const { members, isPending, addTodo } = useTodoFormContainer();
  return <TodoFormComponent members={members} isPending={isPending} addTodo={addTodo} />;
}

// TodoForm.component.stories.tsx — default and loading option sources; validation errors and submitting live in the form's state, so tests cover them
const meta = {
  title: "features/TodoForm",
  component: TodoFormComponent,
  decorators: [
    (Story) => (
      <TodoRouterHarness initialUrl="/todos/new">
        <Story />
      </TodoRouterHarness>
    ),
  ],
  args: {
    members: [
      { id: "m1", name: "Kai" },
      { id: "m2", name: "Robin" },
    ],
    isPending: false,
    addTodo: fn(),
  },
} satisfies Meta<typeof TodoFormComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoMembers: Story = { args: { members: [] } };
export const LoadingMembers: Story = { args: { isPending: true } };
```

## Bad: `navigate` is handed to the hook

```tsx
export function TodoFormComponent({ members, isPending, addTodo }: TodoFormContainerState) {
  const navigate = useNavigate();
  const { titleField, assigneeField, isValid, isSubmitting, handleSubmit } = useTodoFormComponent({
    addTodo,
    navigate,
  });
```

Why: The hook now decides where the page goes after saving, while links can only ever live in
the Component, so changing the address is split across two layers. The Component wraps
`navigate` as `onSaved`, and the hook only says when.

## Bad: the title is trimmed on every keystroke

```tsx
        <input
          type="text"
          value={titleField.value}
          onChange={(e) => titleField.onChange(e.target.value.trim())}
          onBlur={titleField.onBlur}
```

Why: A space typed after a word is removed at once, so "Buy milk" cannot be typed. The
schema's `.trim()` normalizes the value the form submits, once.

## Bad: the button ignores `isSubmitting`

```tsx
      <button
        type="submit"
        disabled={!isValid}
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
```

Why: A second click while the first save is in flight creates the todo twice. `isValid` says
the form may be sent; `isSubmitting` says it is being sent.
