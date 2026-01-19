<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SidebarItem from '../ui/SidebarItem.vue';
import PopoverMenu from '../ui/PopoverMenu.vue';
import type { SidebarMenuItem, PopoverPosition } from '../../types/navigation';
import { navigationItems } from '../../data/navigationItems';
import { convertToSidebarItems } from '../../utils/navigationUtils';

/**
 * Component thanh bên điều hướng chính, hỗ trợ thu gọn/mở rộng và hiển thị popover menu.
 * Create by: DatND (13/1/2026)
 */

interface Props {
    isCollapsed?: boolean;
}

interface Emits {
    (e: 'toggle-collapse'): void;
}

const props = withDefaults(defineProps<Props>(), {
    isCollapsed: false
});

const emit = defineEmits<Emits>();

const router = useRouter();
const route = useRoute();
const expandedGroups = ref<Set<string>>(new Set());
const activeHover = ref<string | null>(null);
const activePopover = ref<{ item: SidebarMenuItem; position: PopoverPosition } | null>(null);
const popoverCloseTimeout = ref<number | null>(null);
const activeTab = ref<string | null>(null);

/**
 * Chuyển đổi danh sách điều hướng từ config thành cấu trúc menu sidebar.
 * Trả về mảng SidebarMenuItem đã được định dạng.
 * Create by: DatND (13/1/2026)
 */
const menuItems = computed(() => convertToSidebarItems(navigationItems));

/**
 * Tìm kiếm mục menu khớp với đường dẫn hiện tại trong cây menu.
 * Trả về mục tìm thấy và chuỗi parent chain để mở rộng các nhóm cha.
 * Create by: DatND (13/1/2026)
 */
const findItemByPath = (
    items: SidebarMenuItem[],
    targetPath: string,
    parentChain: string[] = []
): { item: SidebarMenuItem; parentChain: string[] } | null => {
    for (const item of items) {
        if (item.type === 'link' && item.fullPath === targetPath) {
            return { item, parentChain };
        }

        if (item.type === 'popover' && item.popoverItems) {
            const matched = item.popoverItems.some(category =>
                category.items.some(child => child.path === targetPath)
            );
            if (matched) return { item, parentChain };
        }

        if (item.type === 'group' && item.children) {
            const found = findItemByPath(item.children, targetPath, [...parentChain, item.id]);
            if (found) return found;
        }
    }

    return null;
};

/**
 * Đồng bộ trạng thái active tab và mở rộng các nhóm cha dựa trên route hiện tại.
 * Tự động expand các nhóm chứa route đang active.
 * Create by: DatND (13/1/2026)
 */
const syncActiveTabFromRoute = () => {
    const matched = findItemByPath(menuItems.value, route.path);

    expandedGroups.value.clear();

    if (!matched) {
        activeTab.value = null;
        return;
    }

    matched.parentChain.forEach(id => expandedGroups.value.add(id));

    if (matched.item.type === 'popover') {
        activeTab.value = matched.item.id;
        return;
    }

    if (matched.item.type === 'link' && matched.parentChain.length) {
        activeTab.value = matched.parentChain[matched.parentChain.length - 1] ?? null;
        return;
    }

    activeTab.value = matched.item.id;
};

/**
 * Kiểm tra xem một mục menu có đang được chọn (active) hay không.
 * Trả về true nếu mục đang active.
 * Create by: DatND (13/1/2026)
 */
const isItemSelected = (item: SidebarMenuItem): boolean => {
    return activeTab.value === item.id;
};

/**
 * Tính toán vị trí hiển thị popover menu dựa trên vị trí phần tử mục tiêu.
 * Tự động điều chỉnh top/bottom để không bị tràn viewport.
 * Create by: DatND (13/1/2026)
 */
const calculatePopoverPosition = (event: MouseEvent): PopoverPosition => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const popoverHeight = 200;
    const offset = 25;
    const margin = 10;

    const left = rect.right + offset;

    if (rect.top + popoverHeight > viewportHeight - margin) {
        return { bottom: margin, left };
    }

    const top = rect.top < margin ? margin : rect.top;
    return { top, left };
};

/**
 * Text hiển thị trên nút thu gọn/mở rộng sidebar dựa trên trạng thái isCollapsed.
 * Trả về 'Mở rộng' hoặc 'Thu gọn'.
 * Create by: DatND (13/1/2026)
 */
const collapseButtonText = computed(() =>
    props.isCollapsed ? 'Mở rộng' : 'Thu gọn'
);

/**
 * Class icon cho nút thu gọn/mở rộng sidebar dựa trên trạng thái isCollapsed.
 * Trả về class mũi tên trái hoặc phải.
 * Create by: DatND (13/1/2026)
 */
const collapseIconClass = computed(() =>
    props.isCollapsed ? 'icon-collapse-right' : 'icon-collapse-left'
);

/**
 * Xử lý sự kiện click vào mục menu: điều hướng, toggle group, hoặc hiển thị popover.
 * Điều kiện: không xử lý group/popover khi sidebar đang collapsed.
 * Create by: DatND (13/1/2026)
 */
const handleItemClick = (item: SidebarMenuItem, event: MouseEvent) => {
    if (props.isCollapsed && (item.type === 'group' || item.type === 'popover')) {
        return;
    }

    if (item.type === 'popover') {
        activePopover.value = {
            item,
            position: calculatePopoverPosition(event)
        };
    } else if (item.type === 'group') {
        if (expandedGroups.value.has(item.id)) {
            expandedGroups.value.delete(item.id);
        } else {
            expandedGroups.value.clear();
            expandedGroups.value.add(item.id);
        }

        activeTab.value = item.id;
    } else if (item.type === 'link' && item.fullPath) {
        activeTab.value = item.id;
        router.push(item.fullPath);
    }
};

/**
 * Xử lý hover vào mục menu để hiển thị popover hoặc menu con khi collapsed.
 * Hủy timeout đóng popover nếu đang tồn tại.
 * Create by: DatND (13/1/2026)
 */
const handleMouseEnter = (item: SidebarMenuItem, event: MouseEvent) => {
    if (popoverCloseTimeout.value) {
        clearTimeout(popoverCloseTimeout.value);
        popoverCloseTimeout.value = null;
    }

    if (item.type === 'popover') {
        activePopover.value = {
            item,
            position: calculatePopoverPosition(event)
        };
    }

    if (props.isCollapsed && item.type === 'group' && item.children && item.children.length > 0) {
        activeHover.value = item.id;
        const popoverItems = [{
            title: item.label || '',
            items: item.children.map(child => ({
                id: child.id,
                label: child.label || '',
                path: child.fullPath || ''
            }))
        }];
        activePopover.value = {
            item: { ...item, popoverItems },
            position: calculatePopoverPosition(event)
        };
    }
};

/**
 * Xử lý rời chuột khỏi mục menu, đặt timeout để đóng popover sau 200ms.
 * Cho phép di chuyển chuột vào popover mà không bị đóng ngay.
 * Create by: DatND (13/1/2026)
 */
const handleMouseLeave = (item: SidebarMenuItem) => {
    if (popoverCloseTimeout.value) {
        clearTimeout(popoverCloseTimeout.value);
    }
    popoverCloseTimeout.value = window.setTimeout(() => {
        activePopover.value = null;
        if (props.isCollapsed && activeHover.value === item.id) {
            activeHover.value = null;
        }
    }, 200);
};

/**
 * Kiểm tra xem một nhóm menu có đang được mở rộng hay không.
 * Trả về true nếu nhóm đang expanded.
 * Create by: DatND (13/1/2026)
 */
const isGroupExpanded = (itemId: string) => {
    return expandedGroups.value.has(itemId);
};

/**
 * Xử lý click nút thu gọn/mở rộng sidebar.
 * Đồng bộ lại active tab và emit sự kiện toggle-collapse.
 * Create by: DatND (13/1/2026)
 */
const handleToggleCollapse = () => {
    syncActiveTabFromRoute();
    emit('toggle-collapse');
};

/**
 * Xử lý hover vào popover menu để hủy timeout đóng popover.
 * Giữ popover mở khi chuột đang ở trong popover.
 * Create by: DatND (13/1/2026)
 */
const handlePopoverMouseEnter = () => {
    if (popoverCloseTimeout.value) {
        clearTimeout(popoverCloseTimeout.value);
        popoverCloseTimeout.value = null;
    }
};

/**
 * Xử lý rời chuột khỏi popover menu, đóng popover ngay lập tức.
 * Xóa timeout nếu tồn tại.
 * Create by: DatND (13/1/2026)
 */
const handlePopoverMouseLeave = () => {
    if (popoverCloseTimeout.value) {
        clearTimeout(popoverCloseTimeout.value);
    }
    activePopover.value = null;
};

/**
 * Xử lý click vào item trong popover menu.
 * Đóng popover, set active tab, và điều hướng nếu có path.
 * Create by: DatND (13/1/2026)
 */
const handlePopoverItemClick = (itemId: string, path?: string) => {
    const currentPopover = activePopover.value;
    activePopover.value = null;
    activeTab.value = currentPopover?.item.id ?? itemId;
    if (path) {
        router.push(path);
    }
};

/**
 * Xử lý click ra ngoài sidebar để đóng popover đang mở.
 * Create by: DatND (13/1/2026)
 */
const handleClickOutside = () => {
    activePopover.value = null;
};

/**
 * Đồng bộ tab active khi component mount và theo dõi thay đổi route.
 * Create by: DatND (13/1/2026)
 */
onMounted(syncActiveTabFromRoute);

watch(
    () => route.path,
    () => syncActiveTabFromRoute()
);
</script>

<template>
    <div class="navigation-sidebar" :class="{ 'collapsed': isCollapsed }" @click="handleClickOutside">
        <div class="sidebar-wrapper" @click.stop>
            <div class="sidebar-content">
                <!-- Menu Items List -->
                <div class="sidebar-menu-list">
                    <template v-for="item in menuItems" :key="item.id">
                        <!-- Sidebar Parent Item -->
                        <SidebarItem :item="item" :is-expanded="isGroupExpanded(item.id)" :is-collapsed="isCollapsed"
                            :is-active="isItemSelected(item)" @click="handleItemClick" @mouseenter="handleMouseEnter"
                            @mouseleave="handleMouseLeave" />

                        <!-- Children (only show when expanded and not collapsed) -->
                        <div v-if="item.type === 'group' && item.children && !isCollapsed && isGroupExpanded(item.id)"
                            class="submenu-container">
                            <SidebarItem v-for="child in item.children" :key="child.id" :item="child"
                                :is-collapsed="false" :is-active="isItemSelected(child)" @click="handleItemClick" />
                        </div>
                    </template>
                </div>
            </div>

            <!-- Collapse/Expand Button -->
            <div class="collapse-button-footer">
                <div class="collapse-button" @click="handleToggleCollapse">
                    <div :class="['icon-menu', 'mi', 'icon20', 'menu-collapse-icon', collapseIconClass]"></div>
                    <div v-if="!isCollapsed" class="ml-2">{{ collapseButtonText }}</div>
                </div>
            </div>
        </div>

        <!-- Popover Menu -->
        <PopoverMenu v-if="activePopover && activePopover.item.popoverItems"
            :categories="activePopover.item.popoverItems" :position="activePopover.position" :current-path="route.path"
            @item-click="handlePopoverItemClick" @mouseenter="handlePopoverMouseEnter"
            @mouseleave="handlePopoverMouseLeave" @click.stop />
    </div>
</template>

<style scoped>
.navigation-sidebar {
    height: 100%;
    overflow: hidden;
    position: relative;
    color: #fff;
    background: #111827;
    width: 234px;
    transition: width 0.3s ease;
    display: flex;
    flex-direction: column;
}

.navigation-sidebar.collapsed {
    width: 60px;
}

.sidebar-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.sidebar-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.sidebar-menu-list {
    display: flex;
    flex-direction: column;
    padding: 12px;
    row-gap: 4px;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}

.submenu-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        max-height: 0;
    }

    to {
        opacity: 1;
        max-height: 500px;
    }
}

/* Collapse Button Styles */
.collapse-button-footer {
    box-sizing: border-box;
    width: 100%;
    height: 56px;
    padding: 10px;
    display: flex;
    align-items: center;
    background: #111827;
    border-top: 1px solid rgba(209, 213, 219, .3);
    flex-shrink: 0;
    position: sticky;
    bottom: 0;
    z-index: 10;
}

.collapsed .collapse-button-footer {
    padding: 8px;
}

.collapse-button {
    width: 100%;
    height: 36px;
    border-radius: 4px;
    background: #111827;
    color: #9ca3af;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-right: 5px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.collapse-button:hover {
    background-color: #1f2937;
    color: #fff;
}

.collapse-button:hover .menu-collapse-icon {
    background-color: #fff;
}

.menu-collapse-icon {
    background-color: #9ca3af;
}


.collapsed .collapse-button {
    padding: 8px;
}

.collapsed .collapse-button .ml-2 {
    display: none;
}

.ml-2 {
    margin-left: 8px;
}
</style>
