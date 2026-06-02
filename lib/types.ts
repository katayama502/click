export type ElementType =
  | 'text'
  | 'heading'
  | 'button'
  | 'image'
  | 'divider'
  | 'spacer'
  | 'input'
  | 'textarea'
  | 'check'
  | 'card'
  | 'list'
  | 'nav'
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

export interface AppElement {
  id: string;
  type: ElementType;
  props: {
    // Text / heading / button / card
    text?: string;
    // Input / textarea
    label?: string;
    placeholder?: string;
    rows?: number;
    // Check
    checked?: boolean;
    // Image
    src?: string;
    alt?: string;
    // Button
    href?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    // Spacer
    spacerHeight?: number;
    // List
    items?: ListItem[];
    // Nav
    navItems?: NavItem[];
    // Style
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
    // Container children
    children?: AppElement[];
  };
}

export interface AppPage {
  id: string;
  name: string;
  elements: AppElement[];
  backgroundColor?: string;
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
}
