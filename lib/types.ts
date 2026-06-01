export type ElementType = 'text' | 'heading' | 'button' | 'image' | 'divider' | 'input' | 'card' | 'container';

export interface AppElement {
  id: string;
  type: ElementType;
  props: {
    text?: string;
    placeholder?: string;
    src?: string;
    alt?: string;
    href?: string;
    label?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
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
