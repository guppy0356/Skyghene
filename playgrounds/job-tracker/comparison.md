# job-tracker 比較: Tolone のガイドと Skyghene のガイドで、同じアプリがどう違ったか

Tolone の `playgrounds/job-tracker`(79f7684)と Skyghene の `playgrounds/job-tracker`(3d2434f)を、Tolone のガイド ac57aca 版を物差しにして比べた。読んだ量の比較と、ガイドに戻す候補まで含む。

## 結論

Skyghene の job-tracker は、Tolone のガイドの規則に照らして Tolone 版とほぼ同じ品質になった。ただし「ほぼ同じ」の半分は人の答えが作ったもので、ガイドだけが運んだのではない。

3 ページとも層の構成、ファイルの並び、URL の扱い、読み込み表示、フォームの配線が同じ形で、typecheck も両方通る。Tolone のガイドから規則を約 90 項目拾って両側を照合したところ、外れていたのは Skyghene 側 9 件(高 1、中 4、低 4)、Tolone 側 4 件(中 1、低 3)。それ以外は両方が守っているか、規則の範囲内で別の形を選んでいる。

仕様にわざと書かなかった 7 点で見ると、ガイドだけで Skyghene が Tolone と同じ形に辿り着いたのは、面接の遅延取得、URL の細部、フォームの検証タイミング、読み込み中・再取得中の表示(検索中の表示を除く)の 4 点。楽観的更新、会社検索語の置き場所、検索中フラグ、`@api` エイリアスと react-hook-form の入れ方は、8 問の答えで決まった。答えで決まった所はガイドの手柄にしないという前提に立つと、ガイドが単独で運べたのは半分強になる。

ガイドが人の答えなしに Skyghene を誤らせた差は 1 件だけで、日付整形関数が一覧と詳細に複製されたこと。Tolone には `helpers/` に出す規則があるが、Skyghene のガイドにはその規則が無く、view-model の Good 例が複製を手本として示していた。

読んだ量は、行数では Skyghene の builder の方が多く(3,822 行と 2,586 行)、文字数では同じ(118k と 116k)。中身は違い、Skyghene の builder が読んだ地の文は Tolone の 6 割(52k と 90k)で、その分をコードで読んでいる。ガイド全体も同じ形で、行数は Tolone 本体の 2 倍、文字数は 1.4 倍、地の文は 8 割。「地の文を減らす」は守られているが、読む総量は減っていない。

主要数値:

| | Tolone | Skyghene |
|---|---|---|
| Tolone ガイドの規則から外れた件数 | 4(中 1、低 3) | 9(高 1、中 4、低 4) |
| 仕様に無い 7 点のうちガイドだけで再現 | (仕様を自分で決めたので対象外) | 4 点 |
| 同 7 点のうち人の答えで決定 | 0 | 3 点と「検索中」表示 |
| 人への質問 | 0 問 | 8 問 |
| ガイドの大きさ(行 / 文字 / 地の文の文字) | 2,656 行 / 120k / 94k(本体)。ADR を足すと 4,022 行 / 189k / 162k | 5,651 行 / 172k / 74k |
| builder が読んだガイド(重複を除く行 / 文字 / 地の文の文字) | 2,586 行 / 116k / 90k | 3,822 行 / 118k / 52k |

先に断っておく数字の癖: Skyghene 側の 9 件のうち 5 件は人の答えどおりに書いた結果で、builder がガイドを読み違えたものではない。逆に Tolone 側の 4 件は、builder が読んだ規則から外れたもの。「件数」だけを見ると Skyghene が劣るように見えるが、ガイドの出来を測るなら、答えで決まった 5 件はガイドの穴(答えが要った場所)として読むのが正しい。

## 前提と交絡

| | Tolone | Skyghene |
|---|---|---|
| 比較したコード | `playgrounds/job-tracker`(79f7684。HEAD と差分なし) | `playgrounds/job-tracker`(3d2434f) |
| builder が読めたもの | `docs/architecture/`(ac57aca 版)、`docs/adr/`、CLAUDE.md | README.md、architecture.md、layers/ |
| builder のモデル | Fable 5.1 | Opus 5.5 |
| 仕様の出どころ | builder 自身が「最新のドキュメントをまんべんなく使うアプリ」として設計 | Tolone のコードから書き起こした仕様を渡された |
| stories・テスト | 書いた | 書かない指示 |
| 人への質問 | なし | 8 問(questions.md。人はすべて builder の推奨案を選んだ) |

比べないもの: `*.stories.tsx`、`*.test.tsx`、`src/test/`、`src/openapi.yaml`、`src/mocks/`、`src/lib/api.gen*`、`public/mockServiceWorker.js`。Tailwind のクラスや余白、コメントの文言も、Tolone のガイドに規則が無い限り数えない。

交絡として重いのは 2 つ。Tolone の builder は仕様を自分で決めたので、楽観更新や `enabled` やタブの `replace` は「仕様に入れた」のではなく「ガイドを使うために選んだ」。Tolone 側の一致は構造上ほぼ保証されている。もう 1 つは Skyghene の 8 問で、答えたのは Tolone のガイドを知っている人なので、答えで決まった所の一致は Skyghene のガイドの力ではない。この文書では原因欄に「答えで決定(Q 番号)」と書いて区別する。

dev サーバー(5173 / 5174)はこのセッションのブラウザから接続できなかった。動作は見ておらず、比較はコードとセッション記録の静的な読みだけによる。

## 仕様に書かなかった 7 点: ガイドが運んだのは 4 点、答えで決まったのが 3 点と半分

| 点 | Tolone | Skyghene | 一致 | Skyghene に運んだもの |
|---|---|---|---|---|
| (1) 行の status 変更・削除の楽観的更新 | `ApplicationList.container.hook.ts:34-85` cancel → snapshot → setQueryData、onError で戻す、onSettled で `lists()` を invalidate、削除は detail を `removeQueries` | `ApplicationList.container.hook.ts:32-79` 同じ 3 段 | 同じ | **答えで決定(Q2)**。`container-hook/url-list.md` の Good に mutation が無く、`list-page.md` の When は「nothing in the URL」で外れる。人が「両方読んで足す」と答えた |
| (2) 面接はタブを開いたときだけ取る | `ApplicationDetail.container.hook.ts:27-30` `enabled: withInterviews`、Container で `search.tab === "interviews"` に翻訳 | `:25-29` と `container.tsx:17` 同じ | 同じ | ガイド。`queries/sub-resource.md:48-49, 57-66`(Usage に `enabled: withComments`)、`container/detail-with-tab.md:23, 42-44` |
| (3) 読み込み中・再取得中の表示 | 一覧は li 単位の Skeleton、再取得は opacity、面接ペインは `isLoading` を memo 本体へ | 同じ | 同じ | ガイド。`component/url-list.md:37-48, 84-86, 116-118`、`component/detail-with-tab.md:20-44, 135-139`、`container-hook/detail-page.md:114-124`(Bad「gated に isPending」) |
| (3') 検索中の「Searching…」 | `isFetching`(`ApplicationForm.container.hook.ts:27, 51`) | `isLoading` を `isCompaniesLoading` として返す(`:42`) | 違う(後述の S4) | **答えで決定(Q3, Q4)**。ガイドに `isFetching` は一度も出てこない |
| (4) URL の細部(既定値を消す、不正な値は既定に戻す、タブは replace、タブリンクは exact) | `ApplicationList.search.ts:13-49`、`ApplicationDetail.search.ts:5-28`、`ApplicationDetail.component.tsx:55-68` | `:14-46`、`:6-29`、`:63-84` | 同じ | ガイド。`search/url-list.md:20-24, 68-82`、`search/detail-with-tab.md:12-20, 86-100`、`component/detail-with-tab.md:50-71, 140-143, 188-223` |
| (5) 会社検索語の置き場所 | container hook の `useState`。値と setter を返す(`ApplicationForm.container.hook.ts:25, 49-50`) | container hook の `useState` だが setter しか返さず、component hook が同じ値をもう一度持つ(`container.hook.ts:22, 43`、`component.hook.ts:88, 113-116`) | 半分違う(S2) | **答えで決定(Q3, Q8)**。`container-hook/form-page.md:41` は「No `useQuery`」と言い、typeahead は `container-hook/url-list.md:143-145`(Bad の Why)に一言あるだけ |
| (6) フォームの検証タイミング | `zodResolver` + `mode: "onChange"`、`isValid` で送信可、`isSubmitting` で「Saving…」、schema で trim | 同じ(`component.hook.ts:48-56`、`schema.ts:4-9`) | 同じ | ガイド。`component-hook/form-page.md:38-46, 75-83`、`form-schema/form-page.md:5-30` |
| (7) `@api` エイリアスと react-hook-form の入れ方 | tsconfig + vite.config + vitest.config の 3 ファイル、依存は最初のフォームで追加 | tsconfig + vite.config の 2 ファイル(vitest.config には無い)、依存は Q7 で追加 | 半分違う(S5) | **答えで決定(Q1, Q7)**。ガイドには scaffold に無いものの記述が無い |

ガイドが運んだ 4 点に共通するのは、Skyghene のパターンファイルの Good か Bad の中に、そのページとほぼ同じ形で書かれていたこと。答えが要った 3 点に共通するのは、パターンの格子に「その組み合わせ」の升が無かったこと。URL に状態を持つ一覧が行を書き換える、フォームが別資源を検索する、scaffold の外側を直す、の 3 つで、When 行がどれも当たらないか、当たった Good が必要な部品を持っていなかった。

## 差の一覧: Skyghene 側 9 件、Tolone 側 4 件、規則の範囲内の違い 13 件

重さの定義: 高は規則が要求するファイルや構造が無い、中は明文の規則から外れるが動作はほぼ同じ、低は規則の範囲内に収まる選択か文言の違い。

原因の語彙: 「ガイドに無い」は Skyghene の README・architecture.md・layers/ のどこにも規則が無い。「あるが When が導かない」はパターンに書かれているが、このページの builder がそのファイルに行き着かない。「ガイドの矛盾」はパターン同士、または Good と Why が食い違う。「答えで決定」は questions.md の答えで決まった(ガイドに有無にかかわらず、ガイドの手柄にも責任にもしない)。「builder のミス」は読んだファイルに規則があるのに外した。「仕様の穴」は仕様もガイドも決めておらず、両 builder が別の選択をした。

### Skyghene 側が Tolone の規則から外れた 9 件

**S1(高)日付整形関数が一覧と詳細の view-model に複製されている。**
Tolone: `src/features/application/helpers/date.ts:1-9` を `ApplicationList.view-model.ts:2` と `ApplicationDetail.view-model.ts:8` が import。Skyghene: `ApplicationList.view-model.ts:34-38` と `ApplicationDetail.view-model.ts:36-40` に同じ `MONTHS` と `toDisplayDate` が 2 回。
Tolone の規則: `conventions/directory-structure.md` "Feature-root modules"。「What moves one up to the feature root is a second page actually calling it: a `toDisplayInstant` written for one page stays there until a sibling needs the same conversion」。`helpers/` は 2 ページ目が呼んだ瞬間に現れる。
原因: **ガイドに無い**。Skyghene の architecture.md:33-34 は「The rest live in `src/features/{feature}/{Page}/` and belong to that page」と言い切り、`helpers/` の行が層の表に無い。さらに `view-model/url-list.md:40` と `view-model/detail-page.md:31` の Good が、同じ todo 資源の一覧と詳細にそれぞれ private な `toDisplayInstant` を置いていて、複製を手本として示している。builder は両ファイルを全文読み、その形を写した。質問には出ていない。
これが、人の答えなしにガイドが Skyghene を誤らせた唯一の差。

**S2(中)会社検索語が container hook に閉じず、component hook にも同じ値がある。**
Tolone: `ApplicationForm.container.hook.ts:25-30, 47-53` が `companyKeyword` と `setCompanyKeyword` を返し、`CompanyPicker` はそれを描く。Skyghene: `ApplicationForm.container.hook.ts:22-26, 40-45` は `setCompanyQuery` だけ返し、`ApplicationForm.component.hook.ts:88, 113-116` が `companySearch` を別に持って両方に書く。
Tolone の規則: `conventions/state-placement.md` の表。「Hook-scoped query input … `useState` in the container hook, exposing the value and its setter」。1 つの状態に 1 つの置き場所。
原因: **答えで決定(Q3, Q8)**。Q3 の答えが「`companies`・`isCompaniesLoading`・`setCompanyQuery` を返す」と値を外し、Q8 の答えが「検索欄の値は component hook の `useState`」と二重化を指示した。ガイド側にも規則は無く、`container-hook/url-list.md:143-145` の Bad の Why に「typeahead keyword は useState」とあるだけで、値を返すとは書いていない。

**S3(中)会社ピッカーが `components/` に出ておらず、外側クリックの ref と effect が component hook にある。**
Tolone: `ApplicationForm/components/CompanyPicker.component.tsx:4-19`(自前の props 契約、`memo`)、`:31-40` が ref と `pointerdown` の effect を持つ。`ApplicationForm.component.hook.ts:74-76` は開閉状態だけ。Skyghene: `ApplicationForm.component.tsx:44-87` にインライン、`ApplicationForm.component.hook.ts:16-17, 86, 97-108` が `RefObject` を hook の戻り値に含める。
Tolone の規則: `layers/component.md` "Sub-components"。「Larger pieces with a distinct concern (own props contract, own behavior) become `{Page}/components/{Sub}.component.tsx`」、「A sub-component may own purely-local UI mechanics — refs and effects for DOM behavior like click-outside, as in `TeamMemberPicker` — without routing them through a component hook」。
原因: **答えで決定(Q8)**。答えが「ページの component hook に全部持たせる。外側クリックは ref と useEffect で拾う。Component は描くだけ」と設計を決めた。ガイド側には `components/{Sub}.component.tsx` の升そのものが無く(architecture.md の層表、layers/ の全ファイルを grep しても出てこない)、`useRef` も `pointerdown` も一度も出てこない。ref を hook 境界に通すのは Tolone の規則が「may」で許す範囲の外側ぎりぎりなので低、切り出しの欠落は中。

**S4(中)検索中の表示が `isFetching` ではなく `isLoading` で、1 クエリの hook なのに資源名が付いている。**
Tolone: `ApplicationForm.container.hook.ts:16, 27, 51` が `isFetching`。Skyghene: `:14, 42` が `isCompaniesLoading: companiesQuery.isLoading`。
Tolone の規則: `conventions/loading-state.md` の表。「a search picker just `isFetching`」、「`isFetching` | any fetch, the initial one included | inline indicator that should also show on first load」、「Two or more → flags carry the resource name … One → plain」。
原因: **答えで決定(Q3, Q4)**。Q3 の答えがフラグ名を `isCompaniesLoading` と決め、Q4 の答えが `isLoading` と `keepPreviousData` の除去を決めた。ガイド側に `isFetching` は無く、`isLoading` は gated なクエリの Skeleton 用として `container-hook/detail-page.md:114-124` の Bad にあるだけなので、builder がそこへ寄ったのは自然。「1 つなら plain」も Skyghene には書かれておらず、`container-hook/url-list.md:53, 132-133` が「2 つ以上なら資源名」と片側だけ言う。
動作の差: `isLoading` は `isPending && isFetching` なので、一度引いた語をもう一度打つと再取得中に「Searching…」が出ず前の候補が残る。Tolone は出る。仕様の「検索中は Searching…」はどちらとも読める。

**S5(中)`@api` エイリアスが vitest.config.ts に無い。**
Tolone: `tsconfig.json:4-6`、`vite.config.ts:12-14`、`vitest.config.ts:26-27` の 3 ファイル。Skyghene: `tsconfig.json:4-6` と `vite.config.ts:8`(`resolve: { tsconfigPaths: true }`)の 2 ファイル。
Tolone の規則: `setup.md` Decisions。「Add the alias in **three** files before writing that import」、表に「`tsconfig.json` `paths` + `vite.config.ts` and `vitest.config.ts` `resolve.alias`」。
原因: **答えで決定(Q1)**。答えが 2 ファイルを名指しした。ガイドには scaffold に無いものの一覧が無い。テストを書かない指示だったので今は何も壊れていないが、最初の `*.test.tsx` で `@api` が解決できずに止まる。

**S6(低)ページ数を container hook で導出している。**
Tolone: `ApplicationList.container.hook.ts:16-24` が `total` と `pageSize` を返し、`ApplicationList.component.hook.ts:34` で `pageCount = max(1, ceil(total / pageSize))`。Skyghene: `ApplicationList.container.hook.ts:16-23, 97-98` が `totalPages` を計算して返す。
Tolone の規則: `layers/component-hook.md` Rules「Derive display values from container data」、`state-placement.md` の「Derived / view model → component hook」。
原因: **答えで決定(Q5)**、背景に**ガイドの矛盾**。`container-hook/url-list.md:21, 58` は `total` を返し「the pager renders it」と言うのに、`component/url-list.md:52` と `component-hook/url-list.md:24` は `totalPages` を受け取る。`pageSize` はガイドのどこにも出てこないので、Tolone の形(hook 側で割る)にはガイドからは辿り着けない。

**S7(低)`Company.queries` に `all()` が無く、キーを `["companies", "list", params]` と直書きしている。**
Tolone: `src/api/Company.queries.ts:4-9` に `all()`。Skyghene: `src/api/Company.queries.ts:6-11`。
Tolone の規則: `layers/queries.md` Rules「Use a hierarchical key factory: an `all()` root key plus nested `list()` / `detail(id)`」。ただし同じファイルの :95-98 が「A resource nothing writes to needs no `lists()` either — `list(params)` alone is the whole shape … the prefix produces the same key it would have inlined」と直書きを容認している。
原因: **ガイドの矛盾**(Good と Why)。`queries/parameterized-list.md` の Good :13 は `all()` を持つが、Why :39「A resource nothing writes to has `list(params)` alone」を builder は文字どおり読んで `all()` も落とした(`:4` のコメントがその文を引いている)。`all()` の存在理由は `queries/resource.md:87-107` の Bad にしか無く、その When(クエリパラメータを取らない資源)はこのファイルへ導かない。キーの値は同じで動作は変わらない。

**S8(低)`Interview` を `ApplicationInterview` に改名した。**
Tolone: `src/api/Application.api.ts:10, 22, 42` は生成名のまま。Skyghene: `:10, 22, 43`。
Tolone の規則: `layers/api.md` "Renaming on collision"。接頭辞は DOM グローバル(`Comment`, `Range`, `Selection`, `Event`)との衝突にだけ付ける。改名自体は禁じていないので規則の範囲内。
原因: Skyghene の `api/sub-resource.md:42-43` が「`CreateCommentInput` takes the same prefix, so the nested resource's names read as one family」と、Tolone に無い「家族ぞろいで接頭辞」規則を教えている。builder は「`Interview` は DOM のグローバル名ではない」と承知のうえでこれに従った。ガイドが Tolone より多く言っている例。

**S9(低)面接行の view model が raw の `kind` を落とし、ラベルを `kind` と名付けている。**
Tolone: `ApplicationDetail.view-model.ts:19-25` に `kind: InterviewKind` と `kindLabel`。Skyghene: `:16-20, 56` は `kind: string` にラベルを入れる。
Tolone の規則: `layers/view-model.md`「keeps the raw member beside its label in the shape so the Component has the key to style by」。条件は「Component がそれでスタイルする」場合で、どちらの Component も `kind` でスタイルしないため規則の範囲内。
原因: builder が読んだ `view-model/detail-page.md:66-67, 154-165` は `status` についてこの規則を述べ、Skyghene も見出しの `status` は守っている。面接行にだけ適用しなかった。フィールド名がラベルを指すので、将来スタイルを付けるときに迷う程度。

### Tolone 側が自分のガイドから外れた 4 件

**T1(中)`Company.api` が params 型を宣言せず、`search(q: string)` が `{ query: { q } }` を手で組む。**
Tolone: `src/api/Company.api.ts:6-8`。Skyghene: `src/api/Company.api.ts:6-11` が `CompanyListParams = NonNullable<get_SearchCompanies["parameters"]["query"]>` を宣言して `getList(params)` に渡す。
Tolone の規則: `layers/api.md` Decisions「Does this endpoint take parameters? | Declare its params type here, beside the response types」。
原因: Tolone builder のミス。同じ builder が `Application.api.ts:35` では `ApplicationListParams` を宣言している。この結果 `Company.queries.ts:7-12` のキーも文字列 `q` になり、`list(params)` という名前の形(`queries.md:17`)からも外れる。Skyghene は `api/parameterized-list.md:21-24` の Good どおり。

**T2(低)詳細ページのフラグ接頭辞が資源名ではなく「Detail」。**
Tolone: `ApplicationDetail.container.hook.ts:15-16` の `isDetailPending` / `isDetailRefetching`。隣の `isInterviewsLoading` は資源名。Skyghene: `:14-15` の `isApplicationPending` / `isApplicationRefetching`。
Tolone の規則: `conventions/loading-state.md` Naming「The resource name goes in **front** of the flag」。ガイドの例はすべて資源名(`isIncidentsPending`, `isCommentsLoading`)。
原因: Tolone builder の選択。Skyghene は `container/detail-with-tab.md:19-20` の `isTodoPending` を写した。

**T3(低)private な本体の名前が構造語の `ApplicationDetailBody`。**
Tolone: `ApplicationDetail.component.tsx:32`。Skyghene: `:38` の `ApplicationTabs`。
Tolone の規則: `layers/component.md` Sub-components「Name a sub-component for its **concern** (`ReportChart`), never a generic structural word … do not promote it to a public `{Page}Body`」。private なので禁止の本体には触れていない。
原因: Tolone builder の選択。Skyghene は `component/detail-with-tab.md:34` の `TodoTabs` を写した。

**T4(低)`ApplicationDetail.search.ts` がタブの配列と型も輸出している。**
Tolone: `ApplicationDetail.search.ts:5-6` の `APPLICATION_DETAIL_TABS` と `ApplicationDetailTab`。配列は search.ts の外では使われていない。Skyghene: `:6-7` は private に保ち、Component は `ApplicationDetailSearch["tab"]` で型付け。
Tolone の規則: `url-state.md`「Export the route options, not the schema and defaults」。輸出するのは route options と parsed type だけ。
原因: Tolone builder の選択。Tolone のガイドにはタブ検索の Good コードが無く、Skyghene の `search/detail-with-tab.md:12-20` にはある。Skyghene の方が規則に忠実。

### 規則の範囲内で形が違う 13 件(どちらも正しい、または仕様の穴)

| 違い | Tolone | Skyghene | 位置づけ |
|---|---|---|---|
| status 更新後の detail キャッシュ | レスポンスを `setQueryData`(`ApplicationList.container.hook.ts:54-57`) | `invalidateQueries(detail(id))`(`:48-51`) | `container-hook.md` の表は両方を認める。Skyghene 側は Q2 の答え |
| 削除後の detail `removeQueries` | `onSettled`(`:80-84`。失敗時も消す) | `onSuccess`(`:72-75`) | 規則は操作を言い、コールバックは言わない。Skyghene 側は Q2 の答え |
| 削除の楽観更新で `total` | 減らす(`:68-74`) | 触らない(`:64-66`) | 仕様の穴。再取得まで「Page x of y」が古いだけ |
| 更新アクションの粒度 | `updateStatus(id, status)` | `updateApplication(id, input)` | 仕様の穴。`UpdateApplicationInput` は `status` のみ |
| 行の「{会社名} · applied {日付}」 | JSX で合成(`ApplicationList.component.tsx:50-52`) | view model で `byline` に合成(`view-model.ts:44`) | `view-model.md` は合成文字列を view model の仕事と言うので Skyghene 寄りだが、どちらも可 |
| 見出しの「Applied …」「Salary: …」 | JSX 側に接頭辞 | view model で合成(`ApplicationDetail.view-model.ts:47-48`) | 同上 |
| タブの文言 | view model の `TAB_LABELS` / `TAB_OPTIONS`(`:42-49`) | JSX 直書き(`component.tsx:63-84`) | Tolone の規則はどちらも強制しない。Skyghene は `component/detail-with-tab.md` の形 |
| `Company.queries` の共有オプション | `staleTime: 60_000`、`keepPreviousData` 無し | どちらも無し(`keepPreviousData` は Q4 で外した。ガイドの Good/Bad は入れろと言う) | `queries.md:20` は置き場所だけを決める |
| `interviews(id)` の `retry: false` | あり | なし | 仕様の穴 |
| 検索語の trim | trim して空なら引かない(`ApplicationForm.container.hook.ts:26-29`) | `" "` でも引く(`:24-25`) | 仕様の穴 |
| 保存後の `reset` | `reset(EMPTY_VALUES)` してから遷移(`component.hook.ts:97-105`) | 遷移のみ | 遷移するので差は出ない。Skyghene の `component-hook/form-page.md` にも reset は無い |
| `handleSubmit` とピッカーのハンドラ | `useCallback` | 毎 render 生成(`rhfHandleSubmit(onSubmit)`) | Skyghene のパターンどおり。規則はない |
| アクセシブル名 | 行ごとの `aria-label`、`nav` と `listbox` のロール | `aria-label="Status"` が全行同じ、Delete と nav は無名 | Tolone のガイドにも仕様にも規則が無い。Tolone 側はテスト由来 |

このほか、詳細ページの component hook は両側同じ形(`useMemo` で view model の関数を包むだけ)だが、Skyghene 側は Q6 の答えで書いた。`component-hook/detail-page.md` の When「nothing in the search」がタブ付きの詳細を弾いたため、component-hook 層のファイルを 1 本も読まずに `component/detail-with-tab.md:45` と `view-model/detail-page.md:73-81` の Usage から組んだ。

## 読んだ量: 行数では Skyghene が 1.5 倍、文字数では同じ、地の文だけなら 6 割

分量は測り方で答えが変わるので、行・文字・地の文の 3 つで示す。文字数は空白を除いた字数で、地の文はコードブロックの外側。

ガイドの大きさ:

| | Tolone 本体(`docs/architecture/`) | Tolone 本体 + ADR | Skyghene(README + architecture.md + layers/) |
|---|---|---|---|
| ファイル | 24 | 38 | 40 |
| 行 | 2,656 | 4,022 | 5,651 |
| 文字 | 120k | 189k | 172k |
| 地の文の文字 | 94k(語数 14.8k) | 162k(語数 25.6k) | 74k(語数 13.0k) |
| コードの文字 | 27k | 27k | 98k |

行数では Skyghene が Tolone 本体の 2 倍、ADR を足した全体より多い。しかし行数が膨らんでいるのはコードで、コードは 1 行が短い。文字数で見ると Skyghene は Tolone 本体の 1.4 倍、ADR を足した全体の 0.9 倍。地の文だけなら Tolone 本体の 8 割、ADR を足した全体の半分弱で、「地の文を減らす」という方針は守られている。減った地の文の分だけコードが増え(3.6 倍)、総量は Tolone 本体より増えている。

builder が実際に読んだ量(セッション記録から集計):

| | Tolone builder | Skyghene builder |
|---|---|---|
| 開いたガイドのファイル | `docs/architecture/` 24 ファイル全部(21 本は全文、routing・directory-structure・loading-state は一部)。`docs/adr/` は README の表 21 行だけで、ADR 本文は 0 行 | README、architecture.md、パターンファイル 25 本(38 本中)の全文。残りは When 行だけ |
| 重複を除いた行数 | 2,586 行(本体の 97%) | 3,822 行(全体の 68%) |
| 重複を除いた文字数 | 116k(地の文 90k、コード 27k) | 118k(地の文 52k、コード 66k) |
| 再読を含めてモデルに渡った行数 | 約 3,000 行(20 回の読み出し) | 約 3,900 行(32 回の読み出し) |
| 読み方 | 最初に `overview.md` の索引からほぼ全部をまとめて読み、書きながら部分を読み直した | README の Method どおり、層ごとに When 行を見て 1 本を選んだ |

セッション全体の規模は、ガイド以外の作業(テスト、ブラウザ確認、質問の往復)が混ざるので読んだ量の比較には使えないが、参考に挙げる。Tolone builder はアシスタントのターン 123、出力 225k トークン、キャッシュ読み出し 16.4M。Skyghene builder はターン 245、出力 565k、キャッシュ読み出し 56.3M。Skyghene 側が多いのは 8 問の往復、dev サーバーでの全ページ確認、ファイルごとの Write が入っているため。

builder の報告と記録の食い違いが 1 つある。Skyghene の builder は最終報告で読んだ 26 本に `container/url-list` を数えているが、記録では `head -5` で When 行を見ただけで本文は開いていない。Container の形は `container-hook/url-list.md:66-88` と `component/url-list.md:127-139` の Usage に出ていたので結果は変わらなかったが、「層ごとに 1 本読む」という README の読み方からは外れている。

builder が読んだ量は、文字数では両側ほぼ同じ(116k と 118k)。中身が違う。Tolone の builder は地の文 90k にコード 27k、Skyghene の builder は地の文 52k にコード 66k で、地の文は 6 割に減り、その分をコードで読んでいる。「地の文を減らす」は builder の読む量でも成り立っているが、「読む量を減らす」にはなっていない。

総量が減らない理由は 2 つ。パターンファイルが Good に加えて Usage(隣の層のコード)と 3〜4 個の Bad を持つので、1 本が 100〜230 行になること。もう 1 つは、1 ページに対して層ごとに 1 本ずつ、合計 7〜9 本を読む必要があり、Usage が隣の層を重ねて見せるので同じコードを 2〜3 回読むこと。Tolone 側の builder が ADR を 1 本も開かなかったことも記しておく。「なぜ」を運ぶ ADR は、少なくとも今回の build では使われていない。

## 方法

1. Tolone のガイドは ac57aca 版を `git archive` で取り出して使った(HEAD では `url-state.md`、`layers/api.md`、`layers/form-schema.md` が変わり、ADR 0014 が増えている)。Tolone の playground は HEAD と 79f7684 に差分が無いことを確認した。
2. 両側のソース 33 ファイル(除外分を除く)をファイル単位で diff し、全文を読んだ。
3. 8 つの観点(API と Queries、一覧、詳細、フォーム、シェルと構造、仕様に無い 7 点、慣習の規則の網羅、層の規則の網羅)で監査し、差 79 件を抽出した。各件を 2 つの観点で反証した。1 つは規則の引用と file:line が正しいか、もう 1 つは原因の分類が Skyghene のパターンファイルと questions.md に照らして正しいか。反証で落ちた件は無く、17 件で行番号や重さが訂正された。最後に抜け漏れの批評を 1 回かけ、3 件を足した。
4. 79 件を重複で併合し(同じ差を複数の観点が報告したものが 19 組)、この文書の 26 件にした。批評が指摘した 6 件の判定不一致は、筆者が規則の原文を読み直して決めた(S7 と S9 と Tolone の `toDisplayInstant` は「規則の範囲内」、S3 の原因は「答えで決定」)。
5. 読んだ量は両セッション記録(`66863944-…jsonl`、`b1e06d55-…jsonl`)からツール呼び出しとその結果を抜き、ガイドのファイルを読んだ呼び出しだけを集計した。重複を除いた行数は、Tolone は `sed` の範囲から、Skyghene は開いたファイルの行数から数えた。

## 限界

- 動作は見ていない。dev サーバーに接続できなかったので、楽観更新の見え方や「Searching…」の出方は、コードから読んだ挙動。
- 規則の数「約 85」は Tolone のガイドの Decisions 表と Rules の箇条書きを数えたもので、数え方で前後する。両側が守っている規則の一覧は長いのでこの文書には載せていない。
- 重さ(高・中・低)は筆者の定義。Skyghene 側の 9 件のうち動作に差が出るのは S4 だけで、残りは構造か名前の違い。
- builder のモデルが違うので、同じガイドでも結果は揺れる。1 回ずつの比較で、再現性は確かめていない。

## ガイドに戻す候補

答えが要った 8 問と、Skyghene 側の 9 件を見ると、戻すべきものは「規則」より「升」に集中している。パターンの格子に無い組み合わせが 3 つあり、そこで 8 問中 6 問(Q1, Q2, Q3, Q4, Q7, Q8)と 9 件中 4 件(S2〜S5)が起きている。残りは層の表の欠け(S1)、When の書き方(Q5, Q6, S6)、Why の文言(S7, S8)に分かれる。優先順に挙げる。

1. **`helpers/` の規則を戻す(S1)**。architecture.md の層の表に `features/{feature}/helpers/{subject}.ts` の行を足し、「2 ページ目が呼んだ瞬間に作る純関数。文言表は動かさない」と 1 行書く。`view-model/detail-page.md` の Good は `toDisplayInstant` を `../helpers/instant` から import する形に変え、Bad「一覧の整形関数をここにもう一度書く」を足す。今の Good は規則の逆を手本にしているので、規則を足すだけでは足りない。Tolone の `directory-structure.md` "Wired or called" の理由(契約はそれを配線するファイルの隣、呼ぶだけの純関数は feature の根)は、Skyghene の方針で言えば ADR 側に置く種類の判断。
2. **フォーム内の typeahead のパターンを 1 組足す(S2, S3, S4, Q3, Q4, Q8)**。`container-hook/form-with-picker.md`: `useState` の検索語を値と setter で返す、`enabled: keyword !== ""`、1 クエリなので plain な `isFetching`、`keepPreviousData` を外す理由。Bad は「検索語を component hook にも持つ」と「`isLoading` を返す」。`component/form-with-picker.md`: `components/CompanyPicker.component.tsx` に ref と `pointerdown` を置き、開閉だけを component hook に残す。これで architecture.md に `components/{Sub}.component.tsx` の行も要る。
3. **URL 一覧に行の mutation を足す(Q2)**。`container-hook/url-list.md` の Good に update と delete の楽観更新(画面のキー `list(params)` に書き、`onSettled` で `lists()`、delete は `removeQueries(detail(id))`)を入れるか、`list-page.md` の When から「nothing in the URL」を外して「URL にあるかどうかによらず、画面に残ったまま書き換える一覧」にする。When が「状態が URL にあるか」と「一覧に書き込むか」を別々にしか見ていないのが原因。
4. **url-list 3 ファイルの `total` / `totalPages` の矛盾を直す(S6, Q5)**。Tolone の形に揃えるなら container hook は `total` と `pageSize` を返し、component hook が `pageCount` を割り出す。`pageSize` が今のガイドに一度も出てこないので、契約の形も含めて書き直す。
5. **scaffold の外側を 1 行で書く(S5, Q1, Q7)**。architecture.md の層表の下に「`@api` は scaffold に無い。tsconfig の `paths` と vite・vitest 両方の `resolve` に足す。react-hook-form と `@hookform/resolvers` は最初のフォームで依存に足す」。または `scripts/new-playground.mjs` に最初から入れる。Tolone の `setup.md` "What the scaffold leaves for you" の表に相当する。
6. **`component-hook/detail-page.md` の When から「nothing in the search」を外す(Q6)**。タブは Container で `withInterviews` に変わり、component hook には届かない。
7. 文言の小直し。`queries/parameterized-list.md:39` の「`list(params)` alone」を「落とすのは `lists()` だけ」に(S7)。`api/sub-resource.md:42-43` の家族ぞろい接頭辞は Tolone に無い規則なので、DOM 衝突だけに戻す(S8)。`container-hook/url-list.md:132-133` の Bad の Why に「1 つなら plain」を足す(S4 の片側)。

逆に、戻さなくてよかったものも書いておく。URL の細部(既定値の strip、`.catch`、`replace`、`exact`)、面接の `enabled` と `isLoading`、li 単位の Skeleton と opacity、フォームの `zodResolver` と `isValid`、Container の翻訳、route を最後に付ける順序は、Tolone の地の文 300 行分(`url-state.md`)を含めて Good と Bad だけで運べている。Skyghene の方が Tolone の規則に忠実だった箇所も 4 つある(T1〜T4)。例が完全だと、builder は例のとおりに書く。問題は例が無い升と、例が規則の逆を示している所に限られる。

## Good / Bad の形式が買っているもの: 読む量ではなく、レビューのしやすさ

読んだ量は減らなかった。それでもこの形式には別の価値があり、今回の比較でそれが見える。Good / Bad が買っているのは「書く側が楽になる」ことより「見る側が照合できる」ことだと見ている。これは筆者の見立てで、計測したのは下の数字だけ。

証拠は 3 つある。1 つ目は、Skyghene 側の差分 79 件すべてに「ガイドのどの行がそう言っているか」を付けられたこと。`component/detail-with-tab.md:135-137` のように Good・Why・Bad の行で指せる。Tolone 側の規則は「`loading-state.md` の Decisions 表の 1 行目」という指し方になり、レビューする人はまず表を読んで規則を組み立て直すことになる。2 つ目は、Bad が読む側の lint として働いていること。「gated なクエリに `isPending`」「行リンクが search を引き継ぐ」「タブが履歴を積む」は、コードを Bad と見比べれば判定できる。規則を解釈しなくてよいのは、書く側より見る側に効く。3 つ目は、builder が自分の判断箇所を指せたこと。Skyghene の builder は最終報告で「質問にせず Why から判断した点」を 5 つ、根拠の Why つきで挙げて確認を求めた。Tolone の builder はそういう一覧を出していない。

Bad が要らないという話ではない。むしろ Bad が「見る側」の半分を担っている。Skyghene が守った規則のうち運び手を特定できた 72 件で、運び手として名前が挙がった回数は Why 24 回、Bad 13 回、Good 12 回(1 件で複数挙がることがある)。Bad にしか書かれていない規則が 6 件あり、「1 ページ 1 container hook」「gated なクエリは `isLoading`」「Container で spread しない」「`details()` を対称性で足さない」がそれにあたる。Good を見ても気づかない規則を Bad が止めている。逆に Skyghene が外した所は該当する Bad が無い所で、S1(隣のページの整形関数をもう一度書く)、S2(検索語を component hook にも持つ)、S4(ピッカーに `isLoading`)、S7(`all()` を落としてキーを直書き)のどれにも対応する Bad が無い。ガイドに戻す案 43 件のうち 19 件が新しい Bad を足すか直すもので、26 件が升(パターンファイル、When、層の表の行)を足すものになる(重複あり)。

但し書きは 2 つ。1 つ目は、レビューできるのが「ガイドどおりか」であって「アーキテクチャどおりか」ではないこと。S1 の複製は Good と見比べれば合格に見える。Good 自身が複製を示しているからで、升が無い組み合わせも照合する Good が無いので「レビューしやすさ」が働かない。Tolone の地の文が運ぶ「なぜ」は、ガイド自体が外れている時に気づく手がかりだった。2 つ目は、Bad が 1 つのパターンファイルに付くので、When がそのファイルへ導かない builder には見えないこと。typeahead の検索語を `useState` に置く規則は `container-hook/url-list.md:143-145` の Bad の Why にしかなく、フォームを書く人は `form-page.md` しか開かないので届かなかった。ファイルをまたぐ規則(`helpers/`、状態の置き場所は 1 つ)も、1 ファイルの Bad では表しにくい。Tolone の overview の「By rule」表は、この種の規則の点検表になっていた。

この見立てから出る提案は 3 つ。Bad は残し、足りない Bad(S1、S2、S4、S7)を足す。ファイルをまたぐ規則だけは、architecture.md の表か Tolone の By rule 表のような別の置き場所を用意する。そして README の仮説の測り方を「読んだ量」から「レビューで指せるか」に変える。次の実験は、ガイドだけを持った人かモデルに両方のコードをレビューさせ、今回の 13 件の逸脱のうちいくつ拾えるか、どれだけ時間がかかるかを数えること。
