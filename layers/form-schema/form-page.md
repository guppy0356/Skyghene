# form-schema / form-page

When: a page with a form that checks its fields before sending them and shows a message under any that fail.

## Good

```ts
// src/features/todo/TodoForm/TodoForm.schema.ts
import { z } from "zod";
import { TODO_PRIORITIES, type CreateTodoInput } from "@api/Todo.api";

export const todoFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  priority: z.enum(TODO_PRIORITIES),
}) satisfies z.ZodType<CreateTodoInput>;

export type TodoFormValues = z.infer<typeof todoFormSchema>;
```

Why:

- `.trim()` runs before `.min(1, ...)`, so a title of spaces fails as empty and the parsed
  output already holds the trimmed title. Normalizing is the schema's job, and the submit
  handler that receives that output never does it again.
- "Title is required" is this page's wording. Validation rules and their messages are UI
  concerns of one page, so the file sits in `TodoForm/`, never in `src/api/`, which stays
  free of UI wording.
- `satisfies z.ZodType<CreateTodoInput>` pins the schema's output to the API input. A
  field the API renames, a wrong type or a dropped required field fails here, at the
  schema, not only at the submit call.
- `priority` reads its members from `TODO_PRIORITIES`, the generated enum's array as the
  API layer exports it, instead of typing them out a second time. `satisfies` would not
  notice the server adding a priority, since a narrower union is assignable to a wider
  one; with the members generated, there is no second list here to fall behind.
- `priority` is picked from radio buttons, not typed, and is a field of the schema all the
  same. Any input is a controlled field; the component hook hands the picked member to
  the controller's `onChange`.
- `TodoFormValues` is `z.infer` of the schema, not a named interface. Here the schema is
  the published contract, so its type is derived from it; the named-interface rule is for
  hook contracts.

## Usage

The code that uses this file's exports, down to the line where each value is used.

```ts
// TodoForm.component.hook.ts — validates every change through the schema, and saves the parsed output as it is
export function useTodoFormComponent({
  addTodo,
  onSaved,
}: TodoFormComponentParams): TodoFormComponentState {
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    mode: "onChange",
    defaultValues: { title: "", priority: "medium" },
  });

  const title = useController({ name: "title", control });
  const titleField: TodoFormField<string> = {
    value: title.field.value,
    onChange: (value) => title.field.onChange(value),
    onBlur: title.field.onBlur,
    error: title.fieldState.error?.message,
  };

  const priority = useController({ name: "priority", control });
  const priorityField: TodoFormField<TodoPriority> = {
    value: priority.field.value,
    onChange: (value) => priority.field.onChange(value),
    onBlur: priority.field.onBlur,
    error: priority.fieldState.error?.message,
  };

  const onSubmit = useCallback(
    async (values: TodoFormValues) => {
      const created = await addTodo(values);
      onSaved(created);
    },
    [addTodo, onSaved],
  );

  return {
    titleField,
    priorityField,
    isValid,
    isSubmitting,
    handleSubmit: rhfHandleSubmit(onSubmit),
  };
}
```

## Bad: the title is not trimmed in the schema

```ts
export const todoFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.enum(TODO_PRIORITIES),
}) satisfies z.ZodType<CreateTodoInput>;
```

Why: A title of three spaces now passes `.min(1)`, and every title is saved with whatever
spaces surround it. Normalizing belongs to the schema, so that the submit handler can pass
its output on untouched.

## Bad: the schema is put in `src/api/`

```ts
// src/api/Todo.schema.ts
import { z } from "zod";
import { TODO_PRIORITIES, type CreateTodoInput } from "./Todo.api";
```

Why: "Title is required" is one page's wording, and `src/api/` is shared by every page and
stays free of UI wording. The rules and their messages live beside the form that shows them.

## Bad: the output is not pinned to `CreateTodoInput`

```ts
export const todoFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  priority: z.enum(TODO_PRIORITIES),
});
```

Why: When the API renames `title`, the only error is now at `addTodo(values)` in the
component hook, away from the field that has to change. `satisfies` puts that error on the
schema.

## Bad: the form values get their own interface

```ts
export interface TodoFormValues {
  title: string;
  priority: TodoPriority;
}
```

Why: The values are now written down twice, and every field the schema gains has to be
added here by hand. The schema is the published contract, so its type is `z.infer` of it;
the named-interface rule is for hook contracts.
