# container-hook / form-page

When: 保存したら別のページへ移動するページ。

## Good

```ts
// src/features/todo/TodoForm/TodoForm.container.hook.ts
import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { todoApi, type CreateTodoInput, type Todo } from "@api/Todo.api";
import { todoQueries } from "@api/Todo.queries";

export interface TodoFormContainerState {
  addTodo: (input: CreateTodoInput) => Promise<Todo>;
}

export function useTodoFormContainer(): TodoFormContainerState {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueries.list().queryKey });
    },
  });

  const addTodo = useCallback(
    (input: CreateTodoInput) => addMutation.mutateAsync(input),
    [addMutation.mutateAsync],
  );

  return { addTodo };
}
```

Why:

- 楽観的更新をせず、invalidate だけにする。保存後は別のページへ移動するので、書き換えた一覧を誰も見ないから。
- `useQuery` を呼ばない。一覧は別のページにあり、キャッシュはキーで引けるので、購読しなくても invalidate できる。
- invalidate するのは `todoQueries.list()` だけ。create で狂うのは一覧だけで、新しい id の detail キャッシュはまだない。
- `addTodo` は作成した `Todo` を返す。Component がその id を使って詳細ページへ移動する。
- mutation の `isPending` を返さない。送信中かどうかは component hook がフォームの `isSubmitting` で持つ。

## Bad: 誰も見ない一覧を楽観的更新する

```ts
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onMutate: (input) => {
      queryClient.setQueryData<Todo[]>(todoQueries.list().queryKey, (old) => [
        ...(old ?? []),
        { id: crypto.randomUUID(), title: input.title, completed: false },
      ]);
    },
```

Why: 保存後は別のページへ移動するので、書き換えた一覧を誰も見ない。サーバーが決める id を捏造するだけになる。

## Bad: hook が navigate する

```ts
  const navigate = useNavigate();
  const addMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onSuccess: (todo) => {
      navigate({ to: "/todos/$todoId", params: { todoId: todo.id } });
    },
```

Why: URL を変えるのは Component の仕事。hook が navigate すると、呼ぶだけでルーターが必要になる。

## Bad: `all()` で invalidate する

```ts
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueries.all() });
    },
```

Why: `invalidateQueries` は前方一致。`all()` はキャッシュ済みの detail まで全部取り直す。
