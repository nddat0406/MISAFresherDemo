/**
 * Navigation Types
 * Defines hierarchical navigation structure with auto-path generation
 * Created By: DatND (13/1/2026)
 */

/**
 * Navigation item types
 */
export type NavItemType = 'link' | 'group' | 'divider' | 'popover';

/**
 * Base navigation item
 */
export interface BaseNavItem {
  id: string;
  type: NavItemType;
  segment?: string;
  path?: string;
}

/**
 * Link navigation item (leaf node)
 */
export interface LinkNavItem extends BaseNavItem {
  type: 'link';
  iconClass: string;
  label: string;
  segment: string;
}

/**
 * Group navigation item (has children)
 */
export interface GroupNavItem extends BaseNavItem {
  type: 'group';
  iconClass: string;
  label: string;
  segment: string;
  children: NavItem[];
}

/**
 * Divider navigation item
 */
export interface DividerNavItem extends BaseNavItem {
  type: 'divider';
}

/**
 * Popover item for categorized menu
 */
export interface PopoverItem {
  id: string;
  label: string;
  path?: string;
}

/**
 * Popover category grouping
 */
export interface PopoverCategory {
  title: string;
  items: PopoverItem[];
}

/**
 * Popover navigation item (shows floating popover menu)
 */
export interface PopoverNavItem extends BaseNavItem {
  type: 'popover';
  iconClass: string;
  label: string;
  popoverItems: PopoverCategory[];
}

/**
 * Union type for all navigation items
 */
export type NavItem = LinkNavItem | GroupNavItem | DividerNavItem | PopoverNavItem;

/**
 * Flattened route for router configuration
 */
export interface FlatRoute {
  path: string;
  name: string;
  component: () => Promise<any>;
  meta?: {
    title: string;
    breadcrumb?: string[];
    implemented?: boolean;
  };
}

/**
 * Menu item for sidebar rendering (with computed full path)
 */
export interface SidebarMenuItem {
  id: string;
  type: NavItemType;
  iconClass?: string;
  label?: string;
  fullPath?: string;
  children?: SidebarMenuItem[];
  implemented?: boolean;
  popoverItems?: PopoverCategory[];
}

/**
 * Popover position
 */
export interface PopoverPosition {
  top?: number;
  bottom?: number;
  left: number;
}
