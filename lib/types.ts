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
  // Basic
  | 'text' | 'shape' | 'line' | 'icon' | 'image' | 'video'
  // Action
  | 'button' | 'button2' | 'switch-element' | 'toggle-element'
  // Navigation
  | 'header' | 'tabbar'
  // Input
  | 'form' | 'input' | 'password-input' | 'date-input' | 'file-input' | 'image-input'
  // Output
  | 'list' | 'horizontal-list' | 'db-table' | 'carousel' | 'calendar' | 'dropdown' | 'search-element';

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
  filter?: Array<{ field: string; operator: string; value: any }>;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface Action {
  id: string;
  type: ActionType;
  targetPageId?: string;
  targetUrl?: string;
  openInNewTab?: boolean;
  tableId?: string;
  fieldMappings?: Record<string, string>;
  confirmMessage?: string;
  conditions?: Array<{ field: string; operator: string; value: any }>;
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
export type RightPanelTab = 'properties' | 'style' | 'data' | 'actions' | 'app-settings';
export type LeftPanelTab = 'pages' | 'elements' | 'layers';
export type DevicePreview = 'mobile' | 'tablet' | 'desktop';
