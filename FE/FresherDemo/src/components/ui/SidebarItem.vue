<script setup lang="ts">
import type { SidebarMenuItem } from '../../types/navigation';

/**
 * SidebarItem Component
 * Reusable component for rendering individual sidebar items
 * No dependencies on router or domain logic
 * Created By: DatND (13/1/2026)
 */

interface Props {
    item: SidebarMenuItem;
    isExpanded?: boolean;
    isCollapsed?: boolean;
    isActive?: boolean;
}

interface Emits {
    (e: 'click', item: SidebarMenuItem, event: MouseEvent): void;
    (e: 'mouseenter', item: SidebarMenuItem, event: MouseEvent): void;
    (e: 'mouseleave', item: SidebarMenuItem): void;
}

const props = withDefaults(defineProps<Props>(), {
    isExpanded: false,
    isCollapsed: false,
    isActive: false
});

const emit = defineEmits<Emits>();

/**
 * Handle item click.
 * Created By: DatND (13/1/2026)
 */
const handleClick = (event: MouseEvent) => {
    if (props.item.type !== 'divider') {
        emit('click', props.item, event);
    }
};

/**
 * Handle mouse enter.
 * Created By: DatND (13/1/2026)
 */
const handleMouseEnter = (event: MouseEvent) => {
    if (props.item.type !== 'divider') {
        // Emit for popover items always, or for other items when collapsed
        if (props.item.type === 'popover' || props.isCollapsed) {
            emit('mouseenter', props.item, event);
        }
    }
};

/**
 * Handle mouse leave.
 * Created By: DatND (13/1/2026)
 */
const handleMouseLeave = () => {
    if (props.item.type !== 'divider') {
        // Emit for popover items always, or for other items when collapsed
        if (props.item.type === 'popover' || props.isCollapsed) {
            emit('mouseleave', props.item);
        }
    }
};
</script>

<template>
    <!-- Divider -->
    <div v-if="item.type === 'divider'" class="sidebar-divider" :class="{ 'collapsed': isCollapsed }"></div>

    <!-- Menu Item (Link or Group) -->
    <div v-else class="sidebar-item" @click="handleClick" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave"
        :class="{ 'collapsed': isCollapsed, 'expanded': isExpanded, 'active': isActive, 'no-icon': !item.iconClass }" v-tooltip="isCollapsed ? item.label : ''" :tooltip-append-to-body="true">
        <div class="item-icon">
            <div v-if="item.iconClass" :class="['icon-menu', 'mi-qtsx', 'icon20', item.iconClass]"></div>
        </div>
        <div v-if="!isCollapsed" class="item-label">{{ item.label }}</div>
        <!-- Arrow right icon for popover items -->
        <div v-if="!isCollapsed && item.type === 'popover'" class="flex justify-end flex-1 pr-2">
            <div :class="['icon20', 'mi', 'icon-arrow-right']"></div>
        </div>
        <!-- Dropdown icon for group items -->
        <div v-else-if="!isCollapsed && item.type === 'group'" class="flex justify-end flex-1 pr-2">
            <div :class="['icon20', 'mi', 'dropdown-icon', { expanded: isExpanded }]"></div>
        </div>
    </div>
</template>

<style scoped>
.sidebar-divider {
    margin: 8px auto;
    width: 178px;
    border-bottom: 1px solid rgba(209, 213, 219, .3);
}

.sidebar-divider.collapsed {
    width: 36px;
}

.sidebar-item {
    display: flex;
    position: relative;
    padding: 9px 0;
    height: 36px;
    font-size: 13px;
    align-items: center;
    column-gap: 8px;
    width: 100%;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 4px;
}

.sidebar-item:hover {
    background-color: #1f2937;
}

.item-icon {
    display: flex;
    align-items: center;
    width: 20px;
    height: 20px;
    justify-content: center;
    margin-left: 8px;
}

.item-label {
    z-index: 1;
    color: #9ca3af;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 170px;
    transition: color 0.2s ease;
}

.sidebar-item:hover .icon-menu {
    background-color: #fff;
}

.sidebar-item:hover .item-label {
    color: #fff;
}

.sidebar-item .icon-menu {
    background-color: #9ca3af;
    transition: background-color 0.2s ease;
}

/* Hover icon for submenu items */
.sidebar-item.no-icon.active::after,
.sidebar-item.no-icon:hover::after {
    content: "";
    position: absolute;
    left: 8px;
    width: 20px;
    height: 20px;
    mask-image: url('../../assets/icons/icon-palette-1.svg');
    mask-repeat: no-repeat;
    mask-position: -58px -67px;
    background-color: #fff;
    z-index: 2;
}

.dropdown-icon.expanded {
    transform: rotate(180deg);
}

.sidebar-item:hover .dropdown-icon,
.sidebar-item:hover .icon-arrow-right {
    background-color: #fff;
}

.sidebar-item.collapsed {
    justify-content: center;
    padding: 9px;
}

.sidebar-item.collapsed .item-icon {
    margin-left: 0;
}

/* Active state */
.sidebar-item.router-link-active,
.sidebar-item.active {
    background-color: #059669;
}

.sidebar-item.no-icon.active {
    background-color: #4B5563;
}

.sidebar-item.router-link-active .item-label,
.sidebar-item.active .item-label {
    color: #fff;
}

.sidebar-item.router-link-active .icon-menu,
.sidebar-item.active .icon-menu {
    background-color: #fff;
}

.sidebar-item.router-link-active .dropdown-icon,
.sidebar-item.active .dropdown-icon,.sidebar-item.active .icon-arrow-right {
    background-color: #fff;
}
</style>
