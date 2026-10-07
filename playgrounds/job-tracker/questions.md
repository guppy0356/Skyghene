# Questions

job-tracker を `architecture.md` と `layers/` だけで作ったときに、ガイドで決められず人に聞いたことの記録。

## 1. `@api` エイリアスが scaffold に無い

- 書いていたファイル: `src/features/application/ApplicationList/ApplicationList.container.hook.ts`(以降のページのファイルすべて)
- 読んだパターンファイル: `layers/container-hook/url-list.md`
- ガイドが言っていること: Good も Usage も `@api/Todo.api`、`@api/Todo.queries` のように `@api` エイリアスで import する。scaffold の `tsconfig.json` と `vite.config.ts` にはこのエイリアスが無い。どちらも、直してよいと言われた4ファイル(`main.tsx`、`root.route.tsx`、`router.ts`、`api-client.ts`)に入っていない。
- 答え: エイリアスを足す。`tsconfig.json` に `paths: { "@api/*": ["./src/api/*"] }`、`vite.config.ts` に `resolve: { tsconfigPaths: true }`。
- どのページにも当てはまるか: 当てはまる。ページではなく scaffold の欠けで、どのプレイグラウンドのどのページも `@api` から import する。`scripts/new-playground.mjs` が最初から入れておくもの。

## 2. URL に状態を持つ一覧で、行を書き換える mutation

- 書いていたファイル: `src/features/application/ApplicationList/ApplicationList.container.hook.ts`
- 読んだパターンファイル: `layers/container-hook/url-list.md`(答えを受けて `layers/container-hook/list-page.md` も)
- ガイドが言っていること: When に当たるのは url-list だけ(filter・sort・page が URL にある)。その Good はクエリだけで、mutation が無い。mutation を持つ list-page は When が「a list with nothing in the URL ...」なので外れる。仕様では、行の select で status を変え(PATCH)、Delete で消す。どちらも一覧から離れない。
- 答え: list-page.md も読み、その mutation 部分を url-list の hook に足す。楽観更新(cancel → snapshot → setQueryData)、onError で戻す、onSettled で invalidate、削除は onSuccess で detail を removeQueries。
- 当てはめるときに決めたこと: 楽観更新を書くのは画面に出ているキー `list(params)`。onSettled の invalidate は `lists()` にした(行はどの filter・page にもいるため。queries の「create invalidates `lists()`」と同じ理由)。status 変更は list-page に無いので、削除と同じ3段にし、onSuccess で `detail(id)` を invalidate した(レコードは残るので remove ではない)。
- どのページにも当てはまるか: 当てはまる。URL に filter・sort・page を持ち、その場で行を書き換える一覧なら、どのページでも同じ組み合わせになる。url-list と list-page の When は、「状態が URL にあるか」と「一覧に書き込むか」を別々にしか見ていない。

## 3. フォームの中の typeahead(会社検索)

- 書いていたファイル: `src/features/application/ApplicationForm/ApplicationForm.container.hook.ts`
- 読んだパターンファイル: `layers/container-hook/form-page.md`
- ガイドが言っていること: form-page の Good は create の mutation だけで、Why に「No `useQuery`」とある。仕様の Company 欄は `GET /api/companies?q=` で候補を引き、検索語は URL に残さない。url-list の Bad には「`useState` here is for query input deliberately kept out of the URL, such as a typeahead keyword」とあるが、form-page には何も無い。
- 答え: container hook が検索語を `useState` で持ち、`companyQueries.list({ q })` を `enabled: q !== ""` で引く。`companies`・`isCompaniesLoading`・`setCompanyQuery` を返し、Container 経由で Component に渡す。
- どのページにも当てはまるか: 当てはまる。URL に出さないサーバー検索の入力は、どのページでも container hook の `useState` に置ける。form-page に限らない。

## 4. typeahead が読む一覧の `keepPreviousData`

- 書いていたファイル: `src/features/application/ApplicationForm/ApplicationForm.container.hook.ts`(直したのは `src/api/Company.queries.ts`)
- 読んだパターンファイル: `layers/queries/parameterized-list.md`(`Company.queries.ts` を書いたとき)、`layers/container-hook/form-page.md`
- ガイドが言っていること: parameterized-list の Good は `placeholderData: keepPreviousData` を定義に入れる。Why は「every page reading the list wants it: on a key change the previous rows stay on screen as `isRefetching` instead of dropping to the Skeleton」と「An option every consumer wants the same way belongs in the definition」。会社検索を読むのは typeahead だけで、仕様は「検索中は Searching…」。`keepPreviousData` があると、2文字目からは前の候補が残り、`isLoading` が false のままになる。
- 答え: `Company.queries.ts` の定義から `keepPreviousData` を外す。container hook は `isCompaniesLoading: isLoading` を返す。
- どのページにも当てはまるか: 当てはまる。キーが変わるたびに「探している」と見せたい一覧(typeahead の候補)は、どのページでも `keepPreviousData` を持たない。parameterized-list の When は、ページ送りの一覧と検索候補を区別していない。

## 5. ページ数は `total` か `totalPages` か

- 書いていたファイル: `src/features/application/ApplicationList/ApplicationList.component.tsx`(直したのは `ApplicationList.container.hook.ts` と `ApplicationList.container.tsx`)
- 読んだパターンファイル: `layers/component/url-list.md`(container hook を書いたときは `layers/container-hook/url-list.md`)
- ガイドが言っていること: container-hook/url-list の Good は `total` を返し、Why は「`total` is returned beside `todos` because the pager renders it」。component/url-list と component-hook/url-list の Good は、container state から `totalPages` を受け取る。パターン同士が食い違っている。契約 `ApplicationPage` が返すのは `total` と `pageSize`。
- 答え: container hook が `totalPages`(`max(1, ceil(total / pageSize))`)を返す。`total` と `pageSize` は返さない。Component と component hook は Good どおり `totalPages` を受け取る。
- どのページにも当てはまるか: 当てはまる。ページ送りのある一覧はどれも、pager が描くのはページ数。直すのはガイドの側で、container-hook/url-list の Good を `totalPages` に揃えるもの。

## 6. タブを持つ詳細ページの component hook

- 書いていたファイル: `src/features/application/ApplicationDetail/ApplicationDetail.component.hook.ts`
- 読んだパターンファイル: なし(component-hook の When がどれも当たらない)。手がかりは `layers/component/detail-with-tab.md` と `layers/view-model/detail-page.md`
- ガイドが言っていること: component-hook/detail-page の When は「a page that shows one record by the id in the URL, with no text box and nothing in the search」で、tab を search に持つこのページは外れる。他の3つ(form-page、list-page、url-list)も当たらない。一方、component/detail-with-tab の Good は `useTodoDetailComponent({ detail, comments })` を呼んで `{ headline, commentItems }` を受け取り、view-model/detail-page の Usage にはその hook の中身(view model の関数を `useMemo` で包むだけ)がある。
- 答え: 他のファイルは読まず、読んだ範囲で書く。`useApplicationDetailComponent({ detail, interviews })` → `{ headline, interviewItems }`。
- どのページにも当てはまるか: 当てはまる。tab は Container で `withInterviews` に変わり、Component の本体には `tab` の文字列として渡るだけで、component hook までは届かない。タブがあっても component hook は detail-page と同じ形になる。component-hook/detail-page の When から「nothing in the search」を外せば、タブを持つ詳細ページにも当たる。

## 7. react-hook-form が依存に無い

- 書いていたファイル: `src/features/application/ApplicationForm/ApplicationForm.component.hook.ts`
- 読んだパターンファイル: `layers/component-hook/form-page.md`
- ガイドが言っていること: Good は `react-hook-form` の `useForm` と `useController`、`@hookform/resolvers/zod` の `zodResolver` を使う。どちらも `pnpm-workspace.yaml` の catalog にはあるが、scaffold が作った `package.json` の dependencies には無く、インストールもされていない。
- 答え: `package.json` の dependencies に `react-hook-form: catalog:` と `@hookform/resolvers: catalog:` を足し、`pnpm install` する。
- どのページにも当てはまるか: 当てはまる。フォームのあるプレイグラウンドはどれも要る。`scripts/new-playground.mjs` が最初から dependencies に入れておくもの。

## 8. 会社の選択欄(ボタンで開く検索付き候補リスト)

- 書いていたファイル: `src/features/application/ApplicationForm/ApplicationForm.component.hook.ts` と `ApplicationForm.component.tsx`
- 読んだパターンファイル: `layers/component-hook/form-page.md`、`layers/component/form-page.md`
- ガイドが言っていること: Good の field は text input と radio だけで、ポップアップする選択欄は無い。要るのは、開閉状態、検索欄の値、選んだ社名(フォームの値は `companyId` だけ)、外側クリックで閉じる処理。list-page の Bad に「The input value is local UI state and belongs to the component hook」とある。
- 答え: ページの component hook(`useApplicationFormComponent`)に全部持たせる。開閉・検索欄の値・社名は `useState`。検索欄が変わったら container hook の `setCompanyQuery` も呼び、閉じるときは両方を空にする。外側クリックは ref と `useEffect` の document `pointerdown` で拾う。Component は描くだけ。
- どのページにも当てはまるか: 当てはまる。検索付きの選択欄は、どのフォームでも同じ分け方になる。サーバーへの検索語は container hook、画面の開閉と入力中の文字は component hook。
