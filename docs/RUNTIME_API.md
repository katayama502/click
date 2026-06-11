# Runtime API (`lib/runtime.ts`)

アクション実行エンジン(ClickFlow相当)とデータバインディングの基盤レイヤー。
**ビルダーUI / プレビュー / 公開ページ**の3者が共通で利用する。
すべてSSR安全(localStorage/windowアクセスは `typeof window` ガード済み)。

```ts
import {
  runActions, type ActionContext,
  resolveValueSource,
  getAppUserSession, setAppUserSession, appUserLogin, getUsersTable,
  resolveBinding, resolveTemplate,
  getRecordValue, getFieldByName,
  resolveStartPage, fileToDataUrl,
} from '@/lib/runtime';
```

関連する型拡張(`lib/types.ts`):

- `DataBinding` に `titleFieldId / subtitleFieldId / imageFieldId / captionFieldId`(リスト表示用フィールドマッピング)
- `Action` に `successMessage?: string`(成功通知)と `navigateAfterPageId?: string`(成功後遷移)
- `Element` に `valueFieldId?: string`(入力エレメント→DBフィールド対応付け、任意)
- `AppUserSession`(アプリ利用者=エンドユーザーのセッション)

```ts
interface AppUserSession {
  userId: string;     // Usersテーブルの DBRecord.id
  email: string;
  name: string;
  loggedInAt: string; // ISO 8601
}
```

---

## 1. ValueSource 式(値ソース)

`Action.fieldMappings` は `Record<fieldId, ValueSource>`。ValueSource は文字列式:

| 式 | 解決結果 |
|---|---|
| `form:{elementId}` | フォーム入力値 `ctx.formValues[elementId]` |
| `static:{value}` | 固定値(`static:` 以降すべて。`:` を含んでもよい) |
| `user:email` / `user:name` / `user:id` | ログイン中アプリ利用者の属性(未ログインなら `undefined`) |
| `record:{fieldId}` | カレントレコード(`ctx.currentRecord`)のフィールド値 |
| `now` | 現在日時 ISO 8601 文字列 |
| 上記以外 | そのまま固定値として返す(後方互換) |

```ts
export function resolveValueSource(source: string, ctx: ActionContext): any
```

`login` / `register` アクションでは fieldMappings の**特殊キー** `email` / `password` / `name` が使える:

```ts
fieldMappings: { email: 'form:el_email', password: 'form:el_pw' }
```

---

## 2. ActionContext

呼び出し側(プレビュー / 公開ページ)が組み立てて `runActions` に渡す。storeへの依存はコールバック注入。

```ts
export interface ActionContext {
  appId: string;
  tables: DBTable[];                       // store.getTablesForApp(appId)
  formValues: Record<string, any>;         // elementId → 入力値
  currentRecord?: DBRecord | null;         // リスト項目タップ時のコンテキスト
  currentTable?: DBTable | null;
  appUser: AppUserSession | null;          // getAppUserSession(appId) の結果
  elements?: Element[];                    // 任意。login時のpassword-input自動検出に使用
  navigate: (pageId: string) => void;
  back: () => void;
  openUrl: (url: string, newTab?: boolean) => void;
  addRecord: (tableId: string, values: Record<string, any>) => DBRecord | void | Promise<any>;
  updateRecord: (tableId: string, recordId: string, values: Record<string, any>) => void;
  deleteRecord: (tableId: string, recordId: string) => void;
  setAppUser: (s: AppUserSession | null) => void;
  notify?: (msg: string, type?: 'success' | 'error') => void;
}
```

storeとの接続例(store側のシグネチャは `addRecord(appId, tableId, values)` なので appId を部分適用する):

```ts
const store = useStore.getState();
const ctx: ActionContext = {
  appId,
  tables: store.getTablesForApp(appId),
  formValues,
  appUser,
  navigate: (pageId) => setCurrentPageId(pageId),
  back: () => historyBack(),
  openUrl: (url, newTab) => (newTab ? window.open(url, '_blank') : (location.href = url)),
  addRecord: (tableId, values) => store.addRecord(appId, tableId, values),
  updateRecord: (tableId, recordId, values) => store.updateRecord(appId, tableId, recordId, values),
  deleteRecord: (tableId, recordId) => store.deleteRecord(appId, tableId, recordId),
  setAppUser: (s) => setAppUserState(s), // ReactのsetState等(localStorageはruntime側で管理済み)
  notify: (msg, type) => toast(msg, type),
};
```

---

## 3. アクション実行 — `runActions`

```ts
export async function runActions(actions: Action[] | undefined, ctx: ActionContext): Promise<void>
```

複数アクション(ClickFlow)を**順次**実行する。挙動:

- **conditions**: `Array<{ field, operator, value }>`。全条件を満たさないアクションはスキップ。
  `field` は currentRecord の fieldId → formValues の elementId → ValueSource式 の順で解決。
  `value` が文字列なら ValueSource として解決を試みる。
  operator: `=` `!=` `contains` `>` `<` `is-empty` `is-not-empty`
- **confirmMessage**: あれば `window.confirm`。キャンセルすると**フロー全体を停止**。
- **アクション種別**:
  - `navigate` → `ctx.navigate(targetPageId)`
  - `back` → `ctx.back()`
  - `external-link` → `ctx.openUrl(targetUrl, openInNewTab)`
  - `create-record` → `fieldMappings` を ValueSource 解決して `ctx.addRecord(tableId, values)`(await対応)
  - `update-record` / `delete-record` → `ctx.currentRecord` を対象(なければ console.warn + notifyエラー、スキップ)。tableId は `action.tableId ?? currentTable?.id ?? record.tableId`
  - `login` → email/password を fieldMappings特殊キー → `ctx.elements` の `password-input` / `@`を含む入力 → `formValues.email/password` の順で取得し、`appUserLogin` 実行。成功で `ctx.setAppUser(session)`
  - `register` → Usersテーブル(isSystem)に Email/Password/Name を書き込み(`ctx.addRecord` 経由、重複emailはエラー)、セッション保存+`ctx.setAppUser`。fieldMappings の追加 fieldId キーもレコードにマージされる
  - `logout` → セッション削除+`ctx.setAppUser(null)`
  - `custom` → no-op(将来拡張)
- **成功時**: `successMessage` があれば `ctx.notify(msg, 'success')`、`navigateAfterPageId` があれば遷移。
- login/create失敗等はそのアクションのみ失敗扱い(successMessage等は出ない)が、**後続アクションは継続**する(confirmキャンセルのみ全停止)。

### 使用例: ボタンの create-record(問い合わせフォーム)

```ts
const action: Action = {
  id: 'a1',
  type: 'create-record',
  tableId: contactTable.id,
  fieldMappings: {
    [nameField.id]: 'form:el_name_input',
    [emailField.id]: 'user:email',
    [createdField.id]: 'now',
    [statusField.id]: 'static:未対応',
  },
  successMessage: '送信しました',
  navigateAfterPageId: thanksPage.id,
};
await runActions([action], ctx);
```

---

## 4. アプリ利用者セッション(エンドユーザー認証)

ビルダー利用者(`store.currentUser`)とは**別物**。アプリごとに localStorage キー
`click_app_session_{appId}` で管理する。

```ts
export function getAppUserSession(appId: string): AppUserSession | null
export function setAppUserSession(appId: string, s: AppUserSession | null): void
export function getUsersTable(tables: DBTable[]): DBTable | undefined  // isSystem のテーブル
export function appUserLogin(
  appId: string, tables: DBTable[], email: string, password: string,
): { ok: boolean; error?: string; session?: AppUserSession }
```

- 認証対象は Users テーブル(`isSystem: true`)。フィールドは**名前**(`Email` / `Password` / `Name`、大文字小文字無視)で特定。
- パスワードは既存実装に合わせ **plain 比較**。email は trim + 小文字化して比較。
- `appUserLogin` 成功時はセッションを localStorage に保存して返す(Reactのstate反映は呼び出し側)。
- register はテーブルへのレコード追加が必要なため単独関数はなく、`runActions` の `register` アクション経由(`ctx.addRecord` 使用)。

### 使用例: 公開ページでの login

```ts
// マウント時にセッション復元
const [appUser, setAppUser] = useState<AppUserSession | null>(null);
useEffect(() => { setAppUser(getAppUserSession(appId)); }, [appId]);

// ログインボタンの actions: [{ id, type: 'login',
//   fieldMappings: { email: 'form:el_email', password: 'form:el_pw' } }]
await runActions(loginButton.actions, { ...ctx, formValues, appUser, setAppUser });

// スタートページ振り分け
const start = resolveStartPage(pages, appUser !== null);
```

---

## 5. データバインディング — `resolveBinding`

```ts
export function resolveBinding(
  binding: DataBinding | undefined,
  tables: DBTable[],
  opts?: { appUser?: AppUserSession | null },
): { table: DBTable | null; records: DBRecord[] }
```

- `binding.tableId` でテーブルを特定(なければ `{ table: null, records: [] }`)。
- **filter** → **sort** → **limit** の順に適用。
  - `filter.field`: DBField.id 優先、フィールド名でもフォールバック解決。
  - operator: `=` `!=` `contains` `>` `<` `is-empty` `is-not-empty`
  - `filter.value` が文字列なら ValueSource として解決(例: `"user:id"` で「自分のレコードのみ」フィルタ。`opts.appUser` を渡すこと)。
  - `>` / `<` は数値比較を優先、非数値はISO日付等を想定した文字列比較。
- sort は `sortField`(fieldId) + `sortOrder`('asc' | 'desc')。数値優先、文字列は `localeCompare(…, 'ja')`。

### 使用例: リストエレメントのバインド解決と描画

```ts
const { table, records } = resolveBinding(listElement.dataBinding, tables, { appUser });
const b = listElement.dataBinding;
records.map((record) => ({
  title: getRecordValue(record, table, b?.titleFieldId),
  subtitle: getRecordValue(record, table, b?.subtitleFieldId),
  imageUrl: getRecordValue(record, table, b?.imageFieldId),  // image型はURL/dataURL文字列
  caption: getRecordValue(record, table, b?.captionFieldId),
  // 項目タップ → 詳細ページへ。遷移先で ctx.currentRecord = record / currentTable = table
  onClick: () => runActions(listElement.actions, { ...ctx, currentRecord: record, currentTable: table }),
}));
```

---

## 6. テンプレート解決 — `resolveTemplate`

```ts
export function resolveTemplate(
  text: string | undefined,
  record: DBRecord | null | undefined,
  table: DBTable | null | undefined,
): string
```

`"{{フィールド名}}"`(fieldIdも可、名前は大文字小文字無視、`{{ Name }}` のような空白OK)をレコード値で置換。
record/table が無ければ**原文をそのまま返す**。一致フィールドが無いプレースホルダーは原文のまま。
値が null/undefined のフィールドは空文字。image型はURL文字列がそのまま入る。

```ts
resolveTemplate('こんにちは {{Name}} さん', record, table); // → "こんにちは 田中 さん"
```

---

## 7. ヘルパー

```ts
// record.values[fieldId] を取得。fieldId が見つからなければフィールド名としても解決
export function getRecordValue(record: DBRecord | null | undefined, table: DBTable | null | undefined, fieldId: string | undefined): any

// フィールド名(大文字小文字無視)で DBField を取得
export function getFieldByName(table: DBTable | null | undefined, name: string): DBField | undefined

// ログイン状態に応じたスタートページ。フラグ該当なしは order 順の先頭(modalは除外)
export function resolveStartPage(pages: Page[], loggedIn: boolean): Page | undefined
```

---

## 8. 画像アップロード基盤 — `fileToDataUrl`

```ts
export function fileToDataUrl(file: File, maxSizeKB = 200): Promise<string>
```

- 画像ファイルは canvas で縮小(最大辺1280px)+ JPEG品質を段階的に下げ、**約 maxSizeKB 以下**の dataURL に圧縮。
- 画像以外のファイルはそのまま dataURL 化(サイズ制限なし)。
- ブラウザ専用。SSRで呼ぶと reject。デコード不能な画像は無加工 dataURL にフォールバック。

```ts
// image-input エレメントの onChange
const dataUrl = await fileToDataUrl(e.target.files[0]);
setFormValues((v) => ({ ...v, [element.id]: dataUrl })); // create-record 時に "form:{elementId}" で参照
```

---

## 備考(後続エージェント向け)

- **store.ts は変更不要だった**: `addRecord(appId, tableId, values?)` は元から values を受け取り `DBRecord` を返す。ActionContext へは appId を部分適用して接続する(上記 §2 の例)。
- `Element.valueFieldId` は「この入力エレメントはこのDBフィールドに対応する」という任意メタ情報。ビルダーUIで設定し、fieldMappings の自動生成等に使える(runtime自体は fieldMappings ベースで動作)。
- 通知UI(`ctx.notify`)・ページ履歴(`ctx.back`)の実装は呼び出し側の責務。
