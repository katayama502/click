// ============================================================
// Click Clone — Complete Type System
// ============================================================

export type AppVersion = 'v3' | 'v4';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type PageType = 'page' | 'modal';
export type FieldType = 'text' | 'password' | 'number' | 'boolean' | 'datetime' | 'date' | 'image' | 'file' | 'relation';
export type RelationType = '1-N' | 'N-1' | 'N-N';
export type ActionType =
  | 'navigate' | 'back' | 'external-link'
  | 'create-record' | 'update-record' | 'delete-record'
  | 'login' | 'logout' | 'register'
  | 'custom';

export type ElementType =
  // ベーシック
  | 'text' | 'shape' | 'line' | 'icon' | 'image' | 'video'
  // アクション
  | 'button' | 'button2' | 'switch-element' | 'toggle-element' | 'check'
  // ナビゲーション
  | 'header' | 'tabbar'
  // インプット
  | 'form' | 'input' | 'password-input' | 'date-input' | 'file-input' | 'image-input'
  // アウトプット
  | 'list' | 'card-list' | 'custom-list' | 'horizontal-list' | 'tag-list' | 'avatar-list'
  | 'carousel' | 'stack-carousel' | 'db-table' | 'calendar' | 'dropdown' | 'search-element'
  | 'barcode' | 'qr-code'
  // 外部連携
  | 'line-social' | 'map-element' | 'web-view' | 'youtube-element' | 'vimeo-element'
  | 'stamp-element' | 'stamp-card' | 'lottie-element' | 'chat-element' | 'star-rating';

// ============================================================
// Auth
// ============================================================
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// ============================================================
// App (Product)
// ============================================================
export interface App {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  version: AppVersion;
  primaryDevice: DeviceType;
  devices: DeviceType[];
  createdAt: string;
  updatedAt: string;
  published: boolean;
  publishedUrl?: string;
  thumbnail?: string;
  iconHidden?: boolean;
}

// ============================================================
// Workspace
// ============================================================
export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

// ============================================================
// Database
// ============================================================
export interface DBField {
  id: string;
  tableId: string;
  name: string;
  type: FieldType;
  isSystem: boolean; // Name field is system — cannot delete
  required?: boolean;
  relatedTableId?: string;
  relationType?: RelationType;
}

export interface DBRecord {
  id: string;
  tableId: string;
  values: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface DBTable {
  id: string;
  appId: string;
  name: string;
  isSystem: boolean; // Users table is system — cannot delete
  fields: DBField[];
  records: DBRecord[];
}

// ============================================================
// Canvas / Elements
// ============================================================
export interface ElementStyle {
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  backgroundImage?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  borderRadius?: number;
  padding?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  margin?: string;
  border?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  zIndex?: number;
  textAlign?: 'left' | 'center' | 'right';
  display?: string;
  flexDirection?: string;
  alignItems?: string;
  justifyContent?: string;
  gap?: number;
  overflow?: string;
  boxShadow?: string;
}

export interface DataBinding {
  tableId?: string;
  fieldId?: string;
  // filter.field は DBField.id(推奨)またはフィールド名。
  // operator: '=' | '!=' | 'contains' | '>' | '<' | 'is-empty' | 'is-not-empty'
  // value には ValueSource 形式("user:id" 等)も指定可能(runtime.resolveBinding が解決)
  filter?: Array<{ field: string; operator: string; value: any }>;
  sortField?: string; // DBField.id
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  // ── リスト系エレメントの表示フィールドマッピング ──
  titleFieldId?: string;    // タイトルに表示するフィールド
  subtitleFieldId?: string; // サブタイトルに表示するフィールド
  imageFieldId?: string;    // 画像(image型フィールド)
  captionFieldId?: string;  // キャプション
}

export interface Action {
  id: string;
  type: ActionType;
  targetPageId?: string;
  targetUrl?: string;
  openInNewTab?: boolean;
  tableId?: string;
  // fieldMappings: Record<DBField.id, ValueSource>
  // ValueSource は文字列式(lib/runtime.ts の resolveValueSource が解決):
  //   "form:{elementId}"  → フォーム入力値(ActionContext.formValues[elementId])
  //   "static:{value}"    → 固定値(2つ目以降の ':' は値の一部として扱う)
  //   "user:email" | "user:name" | "user:id" → ログイン中アプリ利用者の属性
  //   "record:{fieldId}"  → カレントレコード(リスト項目コンテキスト)のフィールド値
  //   "now"               → 現在日時(ISO 8601 文字列)
  // login/register アクションでは特殊キー "email" / "password" / "name" も使用可
  // (例: { email: "form:el_1", password: "form:el_2" })
  fieldMappings?: Record<string, string>;
  confirmMessage?: string;
  // conditions: 全条件を満たさない場合そのアクションをスキップ。
  // field は DBField.id(currentRecord から評価)または elementId(formValues から評価)
  conditions?: Array<{ field: string; operator: string; value: any }>;
  successMessage?: string;      // 成功時に notify で表示するメッセージ
  navigateAfterPageId?: string; // アクション成功後に遷移するページID
}

// ── アプリ利用者セッション(ビルダー利用者とは別。アプリごとのエンドユーザー) ──
export interface AppUserSession {
  userId: string;     // Usersテーブルの DBRecord.id
  email: string;
  name: string;
  loggedInAt: string; // ISO 8601
}

export interface Element {
  id: string;
  pageId: string;
  type: ElementType;
  label?: string;
  content?: string;
  placeholder?: string;
  src?: string;
  href?: string;
  style: ElementStyle;
  dataBinding?: DataBinding;
  actions?: Action[];
  // 入力エレメントをDBフィールドに対応付ける(create-record時の自動マッピング等に利用)
  valueFieldId?: string;
  children?: Element[];
  visible?: boolean;
  visibilityCondition?: string;
  locked?: boolean;
}

export interface Page {
  id: string;
  appId: string;
  name: string;
  type: PageType;
  elements: Element[];
  isStartPageLoggedIn?: boolean;
  isStartPageLoggedOut?: boolean;
  backgroundColor?: string;
  order: number;
}

export interface CanvasSnapshot {
  pages: Page[];
  selectedPageId: string | null;
  timestamp: number;
}

// ============================================================
// Editor State
// ============================================================
export type RightPanelTab = 'element' | 'style' | 'data' | 'actions' | 'app-settings';
export type LeftPanelTab = 'pages' | 'elements' | 'layers';
export type DevicePreview = 'mobile' | 'tablet' | 'desktop';
