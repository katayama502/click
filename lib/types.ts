export type ElementType =
  // ベーシック
  | 'text'
  | 'heading'
  | 'image'
  | 'video'
  | 'divider'
  | 'spacer'
  | 'shape'
  // アクション
  | 'button'
  | 'toggle'
  | 'iconbutton'
  // フォーム
  | 'input'
  | 'textarea'
  | 'password'
  | 'date'
  | 'dropdown'
  | 'check'
  | 'radio'
  | 'fileupload'
  | 'stepper'
  | 'rating'
  | 'form'
  // データ表示
  | 'card'
  | 'list'
  | 'table'
  | 'badge'
  | 'avatar'
  | 'progress'
  | 'tag'
  | 'nav'
  | 'carousel'
  | 'qrcode'
  // レイアウト
  | 'container';

export interface ListItem {
  id: string;
  icon?: string;
  title: string;
  subtitle?: string;
}

export interface NavItem {
  id: string;
  icon?: string;
  label: string;
}

export interface TableColumn {
  id: string;
  label: string;
}

export interface TableRow {
  id: string;
  cells: string[];
}

export interface RadioOption {
  id: string;
  label: string;
  value: string;
}

export interface DropdownOption {
  id: string;
  label: string;
  value: string;
}

export interface CarouselItem {
  id: string;
  src?: string;
  caption?: string;
}

// ─── Click Flow (Action) types ───────────────────────────────────
export type ClickActionType =
  | 'navigate'   // ページ移動
  | 'create'     // データ作成
  | 'update'     // データ更新
  | 'delete'     // データ削除
  | 'alert'      // アラート表示
  | 'redirect';  // リダイレクト

export interface ClickAction {
  id: string;
  type: ClickActionType;
  label?: string;
  // navigate / redirect
  targetPageId?: string;
  // DB operations
  tableId?: string;
  // alert
  message?: string;
}

// ─── Visibility condition ───────────────────────────────────────
export type VisibilityMode = 'always' | 'conditional';
export type ConditionOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'contains';

export interface VisibilityCondition {
  id: string;
  logic: 'AND' | 'OR';
  field: string;
  operator: ConditionOperator;
  value: string;
}

export interface AppElement {
  id: string;
  type: ElementType;
  // Click Flow
  clickActions?: ClickAction[];
  // 表示設定
  visibilityMode?: VisibilityMode;
  visibilityConditions?: VisibilityCondition[];
  props: {
    // テキスト / 見出し / ボタン / カード
    text?: string;
    // フォームラベル / プレースホルダー
    label?: string;
    placeholder?: string;
    rows?: number;
    // チェック / ラジオ
    checked?: boolean;
    radioOptions?: RadioOption[];
    // ドロップダウン
    dropdownOptions?: DropdownOption[];
    dropdownValue?: string;
    // 画像 / 動画
    src?: string;
    alt?: string;
    videoUrl?: string;
    // ボタンリンク
    href?: string;
    // ページ遷移リンク（ボタン押下でページ移動）
    pageLinkId?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    // シェイプ
    shapeType?: 'rect' | 'circle' | 'rounded';
    // スペーサー
    spacerHeight?: number;
    // ステッパー
    stepperValue?: number;
    stepperMin?: number;
    stepperMax?: number;
    // 評価（星）
    ratingValue?: number;
    ratingMax?: number;
    // バッジ
    badgeColor?: string;
    badgeVariant?: 'solid' | 'outline' | 'subtle';
    // アバター
    avatarSrc?: string;
    avatarName?: string;
    avatarSize?: 'sm' | 'md' | 'lg';
    // プログレスバー
    progressValue?: number;
    progressMax?: number;
    progressColor?: string;
    // トグル
    toggleValue?: boolean;
    // アイコンボタン
    iconName?: string;
    iconSize?: number;
    // リスト
    items?: ListItem[];
    // テーブル
    tableColumns?: TableColumn[];
    tableRows?: TableRow[];
    // ナビ
    navItems?: NavItem[];
    // カルーセル
    carouselItems?: CarouselItem[];
    // QRコード
    qrValue?: string;
    // タグ
    tags?: string[];
    // スタイル共通
    align?: 'left' | 'center' | 'right';
    color?: string;
    bgColor?: string;
    fontSize?: string;
    fontWeight?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    width?: string;
    height?: string;
    // カードの追加フィールド
    imageSrc?: string;
    subtitle?: string;
    buttonText?: string;
    // ディバイダーの追加フィールド
    dividerThickness?: number;
    dividerStyle?: 'solid' | 'dashed' | 'dotted';
    // ナビの追加フィールド
    navActiveIndex?: number;
    // フォームウィジェット (form type)
    formTitle?: string;
    formTableId?: string;
    formFields?: FormField[];
    formSubmitLabel?: string;
    // コンテナ子要素
    children?: AppElement[];
  };
}

export interface FormField {
  id: string;
  columnId: string;
  label: string;
  required?: boolean;
}

export type PageType = 'normal' | 'modal';

export interface AppPage {
  id: string;
  name: string;
  elements: AppElement[];
  backgroundColor?: string;
  pageType?: PageType;     // 'normal' | 'modal'
  autoRefresh?: boolean;   // ページ自動更新
}

// ─── Database types ───────────────────────────────────
export type DbColumnType = 'text' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'image' | 'relational';

export interface DbColumn {
  id: string;
  name: string;
  type: DbColumnType;
  relationalTableId?: string; // for relational type
}

export interface DbRow {
  id: string;
  cells: Record<string, string>; // columnId → value
}

export interface DbTable {
  id: string;
  name: string;
  columns: DbColumn[];
  rows: DbRow[];
  createdAt: string;
}

export interface AppDatabase {
  tables: DbTable[];
}

export interface AppProject {
  id: string;
  name: string;
  description?: string;
  pages: AppPage[];
  createdAt: string;
  updatedAt: string;
  publishedId?: string;
  thumbnail?: string;
  database?: AppDatabase;
}
