# container-hook / list-page

When: 一覧を表示し、同じ画面のまま追加するページ。

## Good

```ts
// src/features/todo/Todo/Todo.container.hook.ts
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { todoApi, type CreateTodoInput, type Todo } from "@api/Todo.api";
import { todoQueries } from "@api/Todo.queries";

export interface TodoContainerState {
  todos: Todo[];
  isPending: boolean;
  isRefetching: boolean;
  addTodo: (input: CreateTodoInput) => Promise<void>;
}

export function useTodoContainer(): TodoContainerState {
  const queryClient = useQueryClient();
  const listQuery = todoQueries.list();
  const { data, isPending, isRefetching } = useQuery(listQuery);

  const addMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    // 進行中の取得を止め、直前の一覧を控え、キャッシュを先に書き換える
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listQuery.queryKey });
      const previous = queryClient.getQueryData<Todo[]>(listQuery.queryKey);
      queryClient.setQueryData<Todo[]>(listQuery.queryKey, (old) => [
        ...(old ?? []),
        { id: crypto.randomUUID(), title: input.title, completed: false },
      ]);
      return { previous };
    },
    // 失敗したら控えた一覧に戻す
    onError: (_error, _input, context) => {
      queryClient.setQueryData(listQuery.queryKey, context?.previous);
    },
    // 成否にかかわらずサーバーの値で取り直す
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listQuery.queryKey });
    },
  });

  const addTodo = useCallback(
    async (input: CreateTodoInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation.mutateAsync],
  );

  return { todos: data ?? [], isPending, isRefetching, addTodo };
}
```

Why:

- 追加は楽観的更新にする。一覧が画面に残り、ユーザーが書き込んだ結果をその場で見るから。
- キーは `listQuery.queryKey` から読む。`useQuery` と3つのコールバックが同じ定義を使うので、キーがずれない。
- `addTodo` の依存は `addMutation.mutateAsync`。安定した参照なので `addTodo` も安定し、Component の `memo` 化した body が再描画されない。
- `todos` は `data ?? []`。初回の取得が終わるまで `data` は `undefined` なので、Component に `undefined` を渡さない。
- 返すフラグは `isPending` と `isRefetching` だけ。このページが描画するのは Skeleton と、再取得中に一覧を薄くする表示の2つだから。

## 使い方

この hook を使う側のコード。値が使われる行まで。

```tsx
// Todo.container.tsx — 受け取って、個別の props に分けるだけ
export function TodoContainer() {
  const { todos, isPending, isRefetching, addTodo } = useTodoContainer();
  return (
    <TodoComponent
      todos={todos}
      isPending={isPending}
      isRefetching={isRefetching}
      addTodo={addTodo}
    />
  );
}

// Todo.component.tsx — フラグで Skeleton と薄い表示を切り替え、addTodo は component hook に渡す
export function TodoComponent({
  todos,
  isPending,
  isRefetching,
  addTodo,
}: TodoContainerState) {
  const { newTitle, setNewTitle, handleSubmit } = useTodoComponent({ addTodo });
  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <div className={isRefetching ? "opacity-50" : ""}>
        {isPending ? <TodoListSkeleton /> : <TodoList todos={todos} />}
      </div>
    </>
  );
}

// Todo.component.hook.ts — addTodo を params で受け取り、handleSubmit の中で呼ぶ
export function useTodoComponent({ addTodo }: TodoComponentParams): TodoComponentState {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed });
    setNewTitle("");
  }, [newTitle, addTodo]);

  return { newTitle, setNewTitle, handleSubmit };
}
```

## Bad: フォームの入力値を hook が持つ

```ts
export function useTodoContainer(): TodoContainerState {
  const [newTitle, setNewTitle] = useState("");
  // ...
  return { todos: data ?? [], isPending, isRefetching, addTodo, newTitle, setNewTitle };
}
```

Why: 入力値はローカル UI 状態で、component hook が持つ。ここに置くと、入力欄のテストにも QueryClient とモックサーバーが要る。

## Bad: `useCallback` が mutation オブジェクトに依存する

```ts
  const addTodo = useCallback(
    async (input: CreateTodoInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation],
  );
```

Why: `useMutation` の戻り値は毎レンダー新しいオブジェクト。`addTodo` も毎回変わり、Component の `memo` 化した body が refetch のたびに再描画される。

## Bad: キーを手書きする

```ts
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos", "list"] });
    },
```

Why: キーの定義が Queries と2箇所になる。Queries 側を変えても、ここは型エラーにならずに黙って外れる。
