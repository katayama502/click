// ============================================================
// Click Clone — Runtime Engine (アクション実行 + データバインディング基盤)
// ============================================================
// プレビュー画面・公開ページの両方から利用される共通レイヤー。
// SSR安全: localStorage / window へのアクセスは必ず typeof window ガード。
//
// 利用側(ビルダーUI / プレビュー / 公開ページ)は ActionContext を組み立てて
// runActions() を呼ぶだけでよい。store への依存はコールバック経由で注入する。
// ============================================================

import type {
  Action,
  AppUserSession,
  DataBinding,
  DBField,
  DBRecord,
  DBTable,
  Element,
  Page,
} from './types';

// ============================================================
// ActionContext — アクション実行に必要な依存をまとめたコンテキスト
// ============================================================
export interface ActionContext {
  appId: string;
  tables: DBTable[];
  /** elementId → 入力値(フォーム系エレメントの現在値) */
  formValues: Record<string, any>;
  /** リスト項目タップ等のカレントレコード(詳細ページコンテキスト) */
  currentRecord?: DBRecord | null;
  currentTable?: DBTable | null;
  /** ログイン中のアプリ利用者(エンドユーザー) */
  appUser: AppUserSession | null;
  /** ページ内エレメント(任意)。login時のpassword-input自動検出などに利用 */
  elements?: Element[];
  navigate: (pageId: string) => void;
  back: () => void;
  openUrl: (url: string, newTab?: boolean) => void;
  addRecord: (tableId: string, values: Record<string, any>) => DBRecord | void | Promise<any>;
  updateRecord: (tableId: string, recordId: string, values: Record<string, any>) => void;
  deleteRecord: (tableId: string, recordId: string) => void;
  setAppUser: (s: AppUserSession | null) => void;
  notify?: (msg: string, type?: 'success' | 'error') => void;
}

// ============================================================
// 値ソース式 (ValueSource)
// ============================================================
// fieldMappings: Record<fieldId, ValueSource>
// ValueSource は文字列形式:
//   "form:{elementId}"  → フォーム入力値 (ctx.formValues[elementId])
//   "static:{value}"    → 固定値(先頭の "static:" 以降すべてが値)
//   "user:email" | "user:name" | "user:id" → ログイン中アプリ利用者の属性
//   "record:{fieldId}"  → カレントレコードのフィールド値
//   "now"               → 現在日時 ISO 8601 文字列
// 上記いずれにも一致しない文字列は、そのまま固定値として返す(後方互換)。

export function resolveValueSource(source: string, ctx: ActionContext): any {
  if (source == null) return undefined;
  if (source === 'now') return new Date().toISOString();

  if (source.startsWith('form:')) {
    const elementId = source.slice('form:'.length);
    return ctx.formValues[elementId];
  }
  if (source.startsWith('static:')) {
    return source.slice('static:'.length);
  }
  if (source.startsWith('user:')) {
    const key = source.slice('user:'.length);
    if (!ctx.appUser) return undefined;
    if (key === 'email') return ctx.appUser.email;
    if (key === 'name') return ctx.appUser.name;
    if (key === 'id') return ctx.appUser.userId;
    return undefined;
  }
  if (source.startsWith('record:')) {
    const fieldId = source.slice('record:'.length);
    return ctx.currentRecord?.values?.[fieldId];
  }
  // 未知の形式 → そのまま固定値として扱う
  return source;
}

// ============================================================
// アプリ利用者セッション (アプリごと / localStorage)
// key: click_app_session_{appId}
// ============================================================

function sessionKey(appId: string): string {
  return `click_app_session_${appId}`;
}

export function getAppUserSession(appId: string): AppUserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(sessionKey(appId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string') return parsed as AppUserSession;
    return null;
  } catch {
    return null;
  }
}

export function setAppUserSession(appId: string, s: AppUserSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (s) {
      window.localStorage.setItem(sessionKey(appId), JSON.stringify(s));
    } else {
      window.localStorage.removeItem(sessionKey(appId));
    }
  } catch {
    /* storage full / private mode — ignore */
  }
}

/** Usersテーブル(isSystem)を取得 */
export function getUsersTable(tables: DBTable[]): DBTable | undefined {
  return tables.find((t) => t.isSystem) ?? tables.find((t) => t.name === 'Users');
}

/**
 * Usersテーブルに対するアプリ利用者ログイン。
 * パスワードは既存実装(store.tsローカル認証)に合わせて plain 比較。
 * 成功時はセッションを localStorage に保存して返す。
 */
export function appUserLogin(
  appId: string,
  tables: DBTable[],
  email: string,
  password: string,
): { ok: boolean; error?: string; session?: AppUserSession } {
  const users = getUsersTable(tables);
  if (!users) return { ok: false, error: 'Usersテーブルが見つかりません' };

  const emailField = getFieldByName(users, 'Email');
  const passwordField = getFieldByName(users, 'Password');
  const nameField = getFieldByName(users, 'Name');
  if (!emailField || !passwordField) {
    return { ok: false, error: 'UsersテーブルにEmail/Passwordフィールドがありません' };
  }

  const normalized = String(email ?? '').trim().toLowerCase();
  const record = users.records.find(
    (r) => String(r.values[emailField.id] ?? '').trim().toLowerCase() === normalized,
  );
  if (!record) return { ok: false, error: 'メールアドレスまたはパスワードが正しくありません' };
  if (String(record.values[passwordField.id] ?? '') !== String(password ?? '')) {
    return { ok: false, error: 'メールアドレスまたはパスワードが正しくありません' };
  }

  const session: AppUserSession = {
    userId: record.id,
    email: String(record.values[emailField.id] ?? ''),
    name: nameField ? String(record.values[nameField.id] ?? '') : '',
    loggedInAt: new Date().toISOString(),
  };
  setAppUserSession(appId, session);
  return { ok: true, session };
}

// ============================================================
// フィールド値取得ヘルパー
// ============================================================

export function getFieldByName(
  table: DBTable | null | undefined,
  name: string,
): DBField | undefined {
  if (!table) return undefined;
  const lower = name.toLowerCase();
  return table.fields.find((f) => f.name.toLowerCase() === lower);
}

export function getRecordValue(
  record: DBRecord | null | undefined,
  table: DBTable | null | undefined,
  fieldId: string | undefined,
): any {
  if (!record || !fieldId) return undefined;
  if (fieldId in (record.values ?? {})) return record.values[fieldId];
  // フィールド名でも引けるようにフォールバック
  const byName = table?.fields.find((f) => f.name === fieldId);
  if (byName) return record.values[byName.id];
  return undefined;
}

// ============================================================
// 比較ヘルパー(filter / conditions 共通)
// operator: '=' '!=' 'contains' '>' '<' 'is-empty' 'is-not-empty'
// ============================================================

function isEmptyValue(v: any): boolean {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
}

function compareValues(left: any, operator: string, right: any): boolean {
  switch (operator) {
    case 'is-empty':
      return isEmptyValue(left);
    case 'is-not-empty':
      return !isEmptyValue(left);
    case '=':
    case '==':
      // boolean / number / string をゆるく比較
      // eslint-disable-next-line eqeqeq
      return String(left ?? '') === String(right ?? '') || left == right;
    case '!=':
      // eslint-disable-next-line eqeqeq
      return !(String(left ?? '') === String(right ?? '') || left == right);
    case 'contains':
      return String(left ?? '').toLowerCase().includes(String(right ?? '').toLowerCase());
    case '>': {
      const ln = Number(left);
      const rn = Number(right);
      if (!Number.isNaN(ln) && !Number.isNaN(rn)) return ln > rn;
      return String(left ?? '') > String(right ?? ''); // 日付ISO文字列等
    }
    case '<': {
      const ln = Number(left);
      const rn = Number(right);
      if (!Number.isNaN(ln) && !Number.isNaN(rn)) return ln < rn;
      return String(left ?? '') < String(right ?? '');
    }
    default:
      return true; // 未知のoperatorは常にtrue(安全側)
  }
}

// ============================================================
// アクション実行エンジン (ClickFlow 相当)
// ============================================================

/** conditions を評価。field は fieldId(currentRecord) または elementId(formValues) */
function evaluateConditions(
  conditions: Action['conditions'],
  ctx: ActionContext,
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((cond) => {
    let left: any;
    if (ctx.currentRecord && cond.field in (ctx.currentRecord.values ?? {})) {
      left = ctx.currentRecord.values[cond.field];
    } else if (cond.field in ctx.formValues) {
      left = ctx.formValues[cond.field];
    } else {
      // ValueSource式としても解決を試みる
      left = resolveValueSource(cond.field, ctx);
    }
    const right =
      typeof cond.value === 'string' ? resolveValueSource(cond.value, ctx) : cond.value;
    return compareValues(left, cond.operator, right);
  });
}

/** fieldMappings を解決して values を構築(特殊キー email/password/name は除外) */
function buildValuesFromMappings(
  mappings: Record<string, string> | undefined,
  ctx: ActionContext,
  excludeKeys: string[] = [],
): Record<string, any> {
  const values: Record<string, any> = {};
  if (!mappings) return values;
  for (const [fieldId, source] of Object.entries(mappings)) {
    if (excludeKeys.includes(fieldId)) continue;
    const v = resolveValueSource(source, ctx);
    if (v !== undefined) values[fieldId] = v;
  }
  return values;
}

/** login/register 用に email/password/name を取得 */
function extractCredentials(
  action: Action,
  ctx: ActionContext,
): { email: string; password: string; name: string } {
  const m = action.fieldMappings ?? {};
  let email = m.email !== undefined ? resolveValueSource(m.email, ctx) : undefined;
  let password = m.password !== undefined ? resolveValueSource(m.password, ctx) : undefined;
  let name = m.name !== undefined ? resolveValueSource(m.name, ctx) : undefined;

  // フォールバック: ページ内エレメントの type から自動検出
  if ((email === undefined || password === undefined) && ctx.elements) {
    for (const el of ctx.elements) {
      const v = ctx.formValues[el.id];
      if (v === undefined) continue;
      if (password === undefined && el.type === 'password-input') password = v;
      if (
        email === undefined &&
        (el.type === 'input' || el.type === 'form') &&
        /@/.test(String(v))
      ) {
        email = v;
      }
    }
  }
  // 最終フォールバック: formValues のキー名
  if (email === undefined) email = ctx.formValues['email'];
  if (password === undefined) password = ctx.formValues['password'];
  if (name === undefined) name = ctx.formValues['name'];

  return {
    email: String(email ?? ''),
    password: String(password ?? ''),
    name: String(name ?? ''),
  };
}

const CREDENTIAL_KEYS = ['email', 'password', 'name'];

/**
 * 複数アクションを順次実行(ClickFlow)。
 * - conditions を満たさないアクションはスキップ
 * - confirmMessage があれば window.confirm(キャンセルでそのアクションのみ中断、後続も停止)
 * - 各アクション成功後に successMessage 通知 / navigateAfterPageId 遷移
 * - login/register 失敗時は後続アクションを実行しない
 */
export async function runActions(
  actions: Action[] | undefined,
  ctx: ActionContext,
): Promise<void> {
  if (!actions || actions.length === 0) return;

  for (const action of actions) {
    // ── 条件チェック ──
    if (!evaluateConditions(action.conditions, ctx)) continue;

    // ── 確認ダイアログ ──
    if (action.confirmMessage) {
      if (typeof window === 'undefined') continue;
      if (!window.confirm(action.confirmMessage)) return; // キャンセル → フロー全体を停止
    }

    let succeeded = true;

    switch (action.type) {
      case 'navigate': {
        if (action.targetPageId) ctx.navigate(action.targetPageId);
        else succeeded = false;
        break;
      }

      case 'back': {
        ctx.back();
        break;
      }

      case 'external-link': {
        if (action.targetUrl) ctx.openUrl(action.targetUrl, action.openInNewTab);
        else succeeded = false;
        break;
      }

      case 'create-record': {
        if (!action.tableId) {
          console.warn('[runtime] create-record: tableId がありません', action);
          succeeded = false;
          break;
        }
        const values = buildValuesFromMappings(action.fieldMappings, ctx);
        try {
          await ctx.addRecord(action.tableId, values);
        } catch (err) {
          console.error('[runtime] create-record failed:', err);
          ctx.notify?.('レコードの作成に失敗しました', 'error');
          succeeded = false;
        }
        break;
      }

      case 'update-record': {
        const record = ctx.currentRecord;
        if (!record) {
          console.warn('[runtime] update-record: currentRecord がありません', action);
          ctx.notify?.('更新対象のレコードがありません', 'error');
          succeeded = false;
          break;
        }
        const tableId = action.tableId ?? ctx.currentTable?.id ?? record.tableId;
        const values = buildValuesFromMappings(action.fieldMappings, ctx);
        ctx.updateRecord(tableId, record.id, values);
        break;
      }

      case 'delete-record': {
        const record = ctx.currentRecord;
        if (!record) {
          console.warn('[runtime] delete-record: currentRecord がありません', action);
          ctx.notify?.('削除対象のレコードがありません', 'error');
          succeeded = false;
          break;
        }
        const tableId = action.tableId ?? ctx.currentTable?.id ?? record.tableId;
        ctx.deleteRecord(tableId, record.id);
        break;
      }

      case 'login': {
        const { email, password } = extractCredentials(action, ctx);
        if (!email || !password) {
          ctx.notify?.('メールアドレスとパスワードを入力してください', 'error');
          succeeded = false;
          break;
        }
        const result = appUserLogin(ctx.appId, ctx.tables, email, password);
        if (result.ok && result.session) {
          ctx.setAppUser(result.session);
        } else {
          ctx.notify?.(result.error ?? 'ログインに失敗しました', 'error');
          succeeded = false;
        }
        break;
      }

      case 'logout': {
        setAppUserSession(ctx.appId, null);
        ctx.setAppUser(null);
        break;
      }

      case 'register': {
        const users = getUsersTable(ctx.tables);
        if (!users) {
          ctx.notify?.('Usersテーブルが見つかりません', 'error');
          succeeded = false;
          break;
        }
        const { email, password, name } = extractCredentials(action, ctx);
        if (!email || !password) {
          ctx.notify?.('メールアドレスとパスワードを入力してください', 'error');
          succeeded = false;
          break;
        }
        const emailField = getFieldByName(users, 'Email');
        const passwordField = getFieldByName(users, 'Password');
        const nameField = getFieldByName(users, 'Name');
        if (!emailField || !passwordField) {
          ctx.notify?.('UsersテーブルにEmail/Passwordフィールドがありません', 'error');
          succeeded = false;
          break;
        }
        // 重複チェック
        const normalized = email.trim().toLowerCase();
        const exists = users.records.some(
          (r) => String(r.values[emailField.id] ?? '').trim().toLowerCase() === normalized,
        );
        if (exists) {
          ctx.notify?.('このメールアドレスは既に登録されています', 'error');
          succeeded = false;
          break;
        }
        // 追加フィールド(fieldMappings の fieldId キー)もマージ
        const extraValues = buildValuesFromMappings(action.fieldMappings, ctx, CREDENTIAL_KEYS);
        const values: Record<string, any> = {
          ...extraValues,
          [emailField.id]: email,
          [passwordField.id]: password,
        };
        if (nameField) values[nameField.id] = name || email.split('@')[0];

        try {
          const created = await ctx.addRecord(users.id, values);
          const userId =
            created && typeof created === 'object' && 'id' in created
              ? (created as DBRecord).id
              : '';
          const session: AppUserSession = {
            userId,
            email,
            name: name || email.split('@')[0],
            loggedInAt: new Date().toISOString(),
          };
          setAppUserSession(ctx.appId, session);
          ctx.setAppUser(session);
        } catch (err) {
          console.error('[runtime] register failed:', err);
          ctx.notify?.('登録に失敗しました', 'error');
          succeeded = false;
        }
        break;
      }

      case 'custom':
      default:
        // custom は将来拡張用(現状 no-op)
        break;
    }

    if (succeeded) {
      if (action.successMessage) ctx.notify?.(action.successMessage, 'success');
      if (action.navigateAfterPageId) ctx.navigate(action.navigateAfterPageId);
    }
  }
}

// ============================================================
// データバインディング解決
// ============================================================

/**
 * DataBinding を解決して { table, records } を返す。
 * filter(=, !=, contains, >, <, is-empty, is-not-empty) → sort → limit の順に適用。
 * filter.field は DBField.id またはフィールド名。
 * filter.value が文字列の場合 ValueSource 式("user:id" 等)として解決を試みる。
 */
export function resolveBinding(
  binding: DataBinding | undefined,
  tables: DBTable[],
  opts?: { appUser?: AppUserSession | null },
): { table: DBTable | null; records: DBRecord[] } {
  if (!binding?.tableId) return { table: null, records: [] };
  const table = tables.find((t) => t.id === binding.tableId) ?? null;
  if (!table) return { table: null, records: [] };

  let records = [...table.records];

  // filter.value 内の ValueSource を解決するための最小コンテキスト
  const miniCtx: ActionContext = {
    appId: table.appId,
    tables,
    formValues: {},
    appUser: opts?.appUser ?? null,
    navigate: () => {},
    back: () => {},
    openUrl: () => {},
    addRecord: () => {},
    updateRecord: () => {},
    deleteRecord: () => {},
    setAppUser: () => {},
  };

  // ── filter ──
  if (binding.filter && binding.filter.length > 0) {
    for (const f of binding.filter) {
      if (!f?.field) continue;
      // field: fieldId 優先、なければフィールド名で解決
      const fieldId =
        table.fields.find((fd) => fd.id === f.field)?.id ??
        getFieldByName(table, f.field)?.id ??
        f.field;
      const right = typeof f.value === 'string' ? resolveValueSource(f.value, miniCtx) : f.value;
      records = records.filter((r) => compareValues(r.values[fieldId], f.operator, right));
    }
  }

  // ── sort ──
  if (binding.sortField) {
    const sortFieldId =
      table.fields.find((fd) => fd.id === binding.sortField)?.id ??
      getFieldByName(table, binding.sortField)?.id ??
      binding.sortField;
    const dir = binding.sortOrder === 'desc' ? -1 : 1;
    records.sort((a, b) => {
      const av = a.values[sortFieldId];
      const bv = b.values[sortFieldId];
      const an = Number(av);
      const bn = Number(bv);
      if (!Number.isNaN(an) && !Number.isNaN(bn) && av !== '' && bv !== '') {
        return (an - bn) * dir;
      }
      return String(av ?? '').localeCompare(String(bv ?? ''), 'ja') * dir;
    });
  }

  // ── limit ──
  if (binding.limit && binding.limit > 0) {
    records = records.slice(0, binding.limit);
  }

  return { table, records };
}

// ============================================================
// テンプレート解決 — "{{フィールド名}}" をレコード値で置換
// ============================================================

/**
 * テキスト中の "{{フィールド名}}" をレコード値で置換する。
 * - フィールド名は大文字小文字を無視してマッチ
 * - image 型フィールドは URL(またはdataURL)文字列をそのまま返す
 * - record / table がない場合は原文をそのまま返す
 * - 一致するフィールドがないプレースホルダーは原文のまま残す
 */
export function resolveTemplate(
  text: string | undefined,
  record: DBRecord | null | undefined,
  table: DBTable | null | undefined,
): string {
  if (!text) return '';
  if (!record || !table) return text;
  return text.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, name: string) => {
    const field =
      getFieldByName(table, name) ?? table.fields.find((f) => f.id === name);
    if (!field) return match;
    const v = record.values[field.id];
    if (v === undefined || v === null) return '';
    return String(v);
  });
}

// ============================================================
// スタートページ解決
// ============================================================

/**
 * ログイン状態に応じたスタートページを返す。
 * loggedIn=true → isStartPageLoggedIn、false → isStartPageLoggedOut。
 * 該当なしの場合は order 順の先頭ページにフォールバック。
 */
export function resolveStartPage(pages: Page[], loggedIn: boolean): Page | undefined {
  const normalPages = pages.filter((p) => p.type !== 'modal');
  const candidates = normalPages.length > 0 ? normalPages : pages;
  const sorted = [...candidates].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const flagged = sorted.find((p) =>
    loggedIn ? p.isStartPageLoggedIn : p.isStartPageLoggedOut,
  );
  return flagged ?? sorted[0];
}

// ============================================================
// 画像ファイル → dataURL 変換(アップロード基盤)
// ============================================================

/**
 * File を dataURL に変換する。画像の場合は canvas で縮小・JPEG圧縮し、
 * おおよそ maxSizeKB(デフォルト200KB)以下に収める。
 * 画像以外のファイルはそのまま dataURL 化(サイズ制限なし)。
 * ブラウザ専用API(SSRでは reject)。
 */
export function fileToDataUrl(file: File, maxSizeKB = 200): Promise<string> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('fileToDataUrl はブラウザでのみ使用できます'));
  }

  const readAsDataUrl = (f: File | Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error('ファイルの読み込みに失敗しました'));
      reader.readAsDataURL(f);
    });

  // 画像以外はそのまま dataURL 化
  if (!file.type.startsWith('image/')) {
    return readAsDataUrl(file);
  }

  // dataURL のおおよそのバイト数(base64 → 実データの約3/4だが、文字列長で概算)
  const dataUrlSizeKB = (dataUrl: string) => (dataUrl.length * 3) / 4 / 1024;

  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const MAX_DIMENSION = 1280;
        let scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height, 1));
        let quality = 0.85;
        let result = '';

        // 縮小+品質を段階的に下げて maxSizeKB 以下を目指す(最大8回)
        for (let i = 0; i < 8; i++) {
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx2d = canvas.getContext('2d');
          if (!ctx2d) {
            // canvas が使えない環境では元ファイルをそのまま返す
            readAsDataUrl(file).then(resolve, reject);
            return;
          }
          ctx2d.drawImage(img, 0, 0, canvas.width, canvas.height);
          // PNG透過が必要なケースもあるが、サイズ優先でJPEGに統一
          result = canvas.toDataURL('image/jpeg', quality);
          if (dataUrlSizeKB(result) <= maxSizeKB) break;
          // まず品質、次に解像度を下げる
          if (quality > 0.5) quality -= 0.15;
          else scale *= 0.75;
        }
        resolve(result);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('画像の変換に失敗しました'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // 画像としてデコードできない場合はそのまま dataURL 化にフォールバック
      readAsDataUrl(file).then(resolve, reject);
    };
    img.src = url;
  });
}
