# container-hook / detail-page

When: URL の id で1件を読むページ。

## Good

```ts
// src/features/todo/TodoDetail/TodoDetail.container.hook.ts
import { useQuery } from "@tanstack/react-query";
import type { Todo } from "@api/Todo.api";
import { todoQueries } from "@api/Todo.queries";
import { TypedStatusError } from "../../../lib/api-client";

export interface TodoDetailContainerParams {
  todoId: string;
}

export interface TodoDetailContainerState {
  detail: Todo | undefined;
  isPending: boolean;
  isRefetching: boolean;
  isNotFound: boolean;
}

export function useTodoDetailContainer({
  todoId,
}: TodoDetailContainerParams): TodoDetailContainerState {
  const { data, isPending, isRefetching, error } = useQuery(todoQueries.detail(todoId));

  return {
    detail: data,
    isPending,
    isRefetching,
    isNotFound: error instanceof TypedStatusError && error.status === 404,
  };
}
```

Why:

- `todoId` はパラメータで受け取る。URL を読むのは Container で、hook は URL を知らない。だからルーターなしで呼べて、テストできる。
- `isNotFound` は `TypedStatusError` の 404 から作る。API レイヤーはエラーを処理しないので、HTTP のエラーをドメインのフラグに変えるのはこの hook の仕事。
- `TypedStatusError` を独自のエラー型で包まない。プロジェクト共通のクライアントの標準エラーなので、そのまま読む。
- `detail` は `Todo | undefined` のまま返す。1件のデータには `[]` のような既定値がない。`undefined` の間は Component が `isPending` と `isNotFound` で分岐する。
- 返すフラグは `isPending` と `isRefetching`。Skeleton と、再取得中に内容を薄くする表示に使う。

## Bad: hook が自分で URL を読む

```ts
export function useTodoDetailContainer(): TodoDetailContainerState {
  const { todoId } = useParams({ from: "/todos/$todoId" });
  const { data, isPending, isRefetching, error } = useQuery(todoQueries.detail(todoId));
```

Why: 呼ぶだけでルーターが必要になり、hook 単体のテストにもルーターが要る。URL を読むのは Container の仕事。

## Bad: error をそのまま返す

```ts
  return {
    detail: data,
    isPending,
    isRefetching,
    error,
  };
```

Why: Component が HTTP ステータスを知ることになる。Component が受け取るのは `isNotFound` のようなドメインのフラグだけ。

## Bad: `enabled` で止めたクエリに `isPending` を使う

```ts
  const { data, isPending, isRefetching, error } = useQuery({
    ...todoQueries.detail(todoId),
    enabled: todoId !== "",
  });
```

Why: 止まっているクエリは `isPending` が true のまま。Skeleton が永久に出る。止めるなら `isLoading` を返す。このページでは id が必ず届くので、止める必要がそもそもない。
