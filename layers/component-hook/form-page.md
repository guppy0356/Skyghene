# component-hook / form-page

When: a form validated by the page's zod schema.

## Good

```ts
// src/features/todo/TodoForm/TodoForm.component.hook.ts
import { useCallback } from "react";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateTodoInput, Todo } from "@api/Todo.api";
import { todoFormSchema, type TodoFormValues } from "./TodoForm.schema";

export interface TodoFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

export interface TodoFormComponentParams {
  addTodo: (input: CreateTodoInput) => Promise<Todo>;
  onSaved: (todo: Todo) => void;
}

export interface TodoFormComponentState {
  titleField: TodoFormField;
  isValid: boolean;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
}

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
    defaultValues: { title: "" },
  });

  const title = useController({ name: "title", control });
  const titleField: TodoFormField = {
    value: title.field.value,
    onChange: (value) => title.field.onChange(value),
    onBlur: title.field.onBlur,
    error: title.fieldState.error?.message,
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
    isValid,
    isSubmitting,
    handleSubmit: rhfHandleSubmit(onSubmit),
  };
}
```

Why:

- `zodResolver(todoFormSchema)` runs in `mode: "onChange"`, so the schema checks every
  keystroke and `isValid` is the submit button's condition as the user types.
- `isSubmitting` comes from `formState`: the in-flight flag the library already keeps, so
  the hook holds no `useState` for it.
- `titleField` is a plain object of value, `onChange`, `onBlur` and the error message. The
  Component and `TodoFormComponentState` never import react-hook-form.
- `onSubmit` receives `TodoFormValues`, the schema's parsed output, so `title` arrives
  trimmed and goes to `addTodo` as it is. The schema's output is pinned to
  `CreateTodoInput`, which is why passing it on type-checks.
- `addTodo` and `onSaved` arrive as params. The hook saves through the Container's action
  and leaves the redirect to the Component, which wraps `navigate` as `onSaved`.

## Usage

The code that uses this hook, down to the line where each value is used.

```tsx
// TodoForm.component.tsx — wraps navigate as onSaved, and calls the hook in the exported Component, where the form lives
export function TodoFormComponent({ addTodo }: TodoFormContainerState) {
  const navigate = useNavigate();
  const onSaved = useCallback(
    (todo: Todo) => navigate({ to: "/todos/$todoId", params: { todoId: todo.id } }),
    [navigate],
  );
  const { titleField, isValid, isSubmitting, handleSubmit } = useTodoFormComponent({
    addTodo,
    onSaved,
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <input
        value={titleField.value}
        onChange={(e) => titleField.onChange(e.target.value)}
        onBlur={titleField.onBlur}
      />
      {titleField.error && <p>{titleField.error}</p>}
      <button type="submit" disabled={!isValid || isSubmitting}>
        Save
      </button>
    </form>
  );
}
```

## Bad: `control` is returned

```ts
export interface TodoFormComponentState {
  control: Control<TodoFormValues>;
  isValid: boolean;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
}
// ...
  return { control, isValid, isSubmitting, handleSubmit: rhfHandleSubmit(onSubmit) };
```

Why: The Component now calls `useController` itself, so react-hook-form reaches the JSX.
Fields cross the hook boundary as plain objects.

## Bad: the title is trimmed again

```ts
  const onSubmit = useCallback(
    async (values: TodoFormValues) => {
      const created = await addTodo({ ...values, title: values.title.trim() });
      onSaved(created);
    },
    [addTodo, onSaved],
  );
```

Why: `values` is the schema's parsed output, and its `.trim()` has already run. The
normalization now lives in two places that can drift apart.

## Bad: the hook navigates

```ts
export function useTodoFormComponent({ addTodo }: TodoFormComponentParams): TodoFormComponentState {
  const navigate = useNavigate();
  // ...
      const created = await addTodo(values);
      navigate({ to: "/todos/$todoId", params: { todoId: created.id } });
```

Why: A test of the hook now has to mount a router. The Component calls app-shell hooks such
as `useNavigate` and hands the hook a callback, `onSaved`.
