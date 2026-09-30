# view-model / edit-form

When: a form that opens filled in from a record the server already has.

## Good

```ts
// src/features/todo/TodoForm/TodoForm.view-model.ts
import type { Todo, TodoStatus } from "@api/Todo.api";
import type { TodoFormValues } from "./TodoForm.schema";

const STATUS_LABELS: Record<TodoStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

export const STATUS_OPTIONS = (
  Object.entries(STATUS_LABELS) as [TodoStatus, string][]
).map(([value, label]) => ({ value, label }));

export function toTodoFormValues(todo: Todo): TodoFormValues {
  return {
    title: todo.title,
    description: todo.description ?? "",
    status: todo.status,
  };
}
```

Why:

- The file exists for `STATUS_LABELS`: what each status choice is called is a decision.
  `STATUS_OPTIONS` is built from the table's entries, so the choices come in the table's
  order, not openapi.yaml's.
- `STATUS_OPTIONS` is a plain constant. It depends on neither the record nor what the user
  has entered, so nothing memoizes it.
- `toTodoFormValues` builds the form's starting values from the record: from the contract
  toward the screen, which makes it this file's work. The values the form submits go the
  other way, and the component hook hands them to `updateTodo` as they are.
- It returns `TodoFormValues`, imported from the schema. The form-values type is `z.infer`
  of the schema, so this file declares no second one.
- `description ?? ""` opens a missing description as an empty box, an expression inside the
  record's function.
- `STATUS_LABELS` is this form's own, even though the detail page beside it names the same
  statuses.

## Usage

The code that uses this file's exports, down to the line where each value is used.

```tsx
// TodoForm.component.hook.ts — starts the form from the record; the form component calls it, drawn only once the record has loaded
export function useTodoFormComponent({
  detail,
  updateTodo,
  onSaved,
}: TodoFormComponentParams): TodoFormComponentState {
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    mode: "onChange",
    defaultValues: toTodoFormValues(detail),
  });

  // titleField, descriptionField and statusField: useController, each returned as a plain field object
  // ...

  const onSubmit = useCallback(
    async (values: TodoFormValues) => {
      await updateTodo(values);
      onSaved();
    },
    [updateTodo, onSaved],
  );

  return {
    titleField,
    descriptionField,
    statusField,
    isValid,
    isSubmitting,
    handleSubmit: rhfHandleSubmit(onSubmit),
  };
}

// TodoForm.component.tsx — the form component, drawn only once the record has loaded, with no memo; it offers the status choices straight from the constant
function TodoFormFields(props: TodoFormComponentParams) {
  const { titleField, descriptionField, statusField, isValid, isSubmitting, handleSubmit } =
    useTodoFormComponent(props);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      {/* the title and description inputs render titleField and descriptionField */}
      <fieldset>
        {STATUS_OPTIONS.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              checked={statusField.value === option.value}
              onChange={() => statusField.onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={!isValid || isSubmitting}>
        Save
      </button>
    </form>
  );
}
```

## Bad: `defaultValues` are written in the hook

```ts
// TodoForm.component.hook.ts
  useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    mode: "onChange",
    defaultValues: {
      title: detail.title,
      description: detail.description ?? "",
      status: detail.status,
    },
  });
```

Why: Building the starting values from the record runs from the contract toward the screen,
which is this file's work however small it is. The hook passes `toTodoFormValues(detail)`
to `useForm`.

## Bad: the form values get an interface here

```ts
export interface TodoFormValues {
  title: string;
  description: string;
  status: TodoStatus;
}

export function toTodoFormValues(todo: Todo): TodoFormValues {
```

Why: The form's values are now described twice, here and by the schema, and nothing keeps
the two in step. The form-values type is `z.infer` of the schema, imported from it.

## Bad: the labels come from the detail page

```ts
import type { Todo, TodoStatus } from "@api/Todo.api";
import { STATUS_LABELS } from "../TodoDetail/TodoDetail.view-model";
import type { TodoFormValues } from "./TodoForm.schema";
```

Why: The form's choices now read whatever the detail's heading says, and a word changed for
one page changes the other. Each page keeps its own exhaustive table.
