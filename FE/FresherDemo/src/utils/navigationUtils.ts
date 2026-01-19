import type { NavItem, SidebarMenuItem, FlatRoute } from '../types/navigation';

/**
 * Navigation utilities for hierarchical path generation
 * Created By: DatND (13/1/2026)
 */

/**
 * Generate full path from navigation hierarchy.
 * Example: parent/child/childOfChild
 * Created By: DatND (13/1/2026)
 */
export function generatePath(item: NavItem, parentPath: string = ''): string {
    if (item.type === 'divider' || !item.segment) {
        return '';
    }

    const fullPath = parentPath ? `${parentPath}/${item.segment}` : `/${item.segment}`;
    return fullPath;
}

/**
 * Convert navigation items to sidebar menu items with computed full paths.
 * Created By: DatND (13/1/2026)
 */
export function convertToSidebarItems(
    items: NavItem[],
    parentPath: string = ''
): SidebarMenuItem[] {
    return items.map(item => {
        if (item.type === 'divider') {
            return {
                id: item.id,
                type: 'divider'
            };
        }

        const fullPath = generatePath(item, parentPath);

        if (item.type === 'popover') {
            return {
                id: item.id,
                type: 'popover',
                iconClass: item.iconClass,
                label: item.label,
                fullPath,
                popoverItems: item.popoverItems
            };
        }

        if (item.type === 'group') {
            return {
                id: item.id,
                type: 'group',
                iconClass: item.iconClass,
                label: item.label,
                fullPath,
                children: convertToSidebarItems(item.children, fullPath)
            };
        }

        // type === 'link'
        return {
            id: item.id,
            type: 'link',
            iconClass: item.iconClass,
            label: item.label,
            fullPath,
        };
    });
}

/**
 * Flatten navigation tree into routes for Vue Router.
 * Created By: DatND (13/1/2026)
 */
export function flattenNavToRoutes(
    items: NavItem[],
    parentPath: string = '',
    breadcrumb: string[] = []
): FlatRoute[] {
    const routes: FlatRoute[] = [];

    for (const item of items) {
        if (item.type === 'divider') continue;

        const fullPath = generatePath(item, parentPath);
        const currentBreadcrumb = [...breadcrumb, item.label];

        // Handle popover items
        if (item.type === 'popover' && item.popoverItems) {
            // Generate routes for each popover item
            for (const category of item.popoverItems) {
                for (const popoverItem of category.items) {
                    if (popoverItem.path) {
                        // Convert path to component path
                        const componentPath = popoverItem.path.split('/').filter(Boolean).map(
                            segment => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-([a-z])/g, (_, char) => char.toUpperCase())
                        ).join('/');
                        
                        routes.push({
                            path: popoverItem.path,
                            name: popoverItem.id,
                            component: () => import(`../views/${componentPath}/Index.vue`).catch(() => import('../views/NotImplemented.vue')),
                            meta: {
                                title: popoverItem.label,
                                breadcrumb: [...currentBreadcrumb, popoverItem.label],
                                implemented: true
                            }
                        });
                    }
                }
            }
            continue;
        }

        // Recursively add child routes
        if (item.type === 'group' && item.children) {
            routes.push(...flattenNavToRoutes(item.children, fullPath, currentBreadcrumb));
        }
    }

    return routes;
}

/**
 * Find navigation item by path.
 * Created By: DatND (13/1/2026)
 */
export function findNavItemByPath(
    items: NavItem[],
    targetPath: string,
    parentPath: string = ''
): NavItem | null {
    for (const item of items) {
        if (item.type === 'divider') continue;

        const fullPath = generatePath(item, parentPath);

        if (fullPath === targetPath) {
            return item;
        }

        if (item.type === 'group' && item.children) {
            const found = findNavItemByPath(item.children, targetPath, fullPath);
            if (found) return found;
        }
    }

    return null;
}

/**
 * Get breadcrumb trail for a path.
 * Created By: DatND (13/1/2026)
 */
export function getBreadcrumbForPath(
    items: NavItem[],
    targetPath: string,
    parentPath: string = '',
    trail: string[] = []
): string[] | null {
    for (const item of items) {
        if (item.type === 'divider') continue;

        const fullPath = generatePath(item, parentPath);
        const currentTrail = [...trail, item.label];

        if (fullPath === targetPath) {
            return currentTrail;
        }

        if (item.type === 'group' && item.children) {
            const found = getBreadcrumbForPath(item.children, targetPath, fullPath, currentTrail);
            if (found) return found;
        }
    }

    return null;
}
