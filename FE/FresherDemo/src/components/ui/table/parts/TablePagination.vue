<script setup lang="ts">
import MISACombobox from '../../MISACombobox.vue';

interface Props {
    totalCount: number;
    pageSize: number;
    pageSizes: number[];
    pageInfo: string;
    hasPrev: boolean;
    hasNext: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    'update:pageSize': [value: number];
    'page-change': ['first' | 'prev' | 'next' | 'last'];
}>();
</script>

<template>
    <div class="ms-pagination flex flex-row table-paging">
        <div class="flex total-count">
            <div class="total-label">Tổng số: </div>
            <div class="total">{{ props.totalCount }}</div>
        </div>
        <div class="pagination-sticky">
            <div class="flex items-center gap-x-4">
                <div class="page-size-component-title">Số dòng/trang</div>
                <div class="page-size-component">
                    <MISACombobox :model-value="props.pageSize"
                        :options="props.pageSizes.map(size => ({ label: size.toString(), value: size }))"
                        :searchable="false" :style="{ width: '80px' }"
                        @update:model-value="(val: string | number | null) => val && emit('update:pageSize', typeof val === 'number' ? val : Number(val))" />
                </div>
                <div class="page-info">{{ props.pageInfo }}</div>
                <div class="btn-next-page">
                    <button class="ms-button btn-text-neutral only-icon" :class="{ 'disabled-opacity': !props.hasPrev }"
                        :disabled="!props.hasPrev" @click="emit('page-change', 'first')">
                        <div class="icon mi icon16 left step-backward" :class="{ 'disabled-icon': !props.hasPrev }">
                            &nbsp;</div>
                    </button>
                    <button class="ms-button btn-text-neutral only-icon" :class="{ 'disabled-opacity': !props.hasPrev }"
                        :disabled="!props.hasPrev" @click="emit('page-change', 'prev')">
                        <div class="icon mi icon16  left angle-left" :class="{ 'disabled-icon': !props.hasPrev }">
                            &nbsp; </div>
                    </button>
                    <button class="ms-button btn-text-neutral only-icon" :class="{ 'disabled-opacity': !props.hasNext }"
                        :disabled="!props.hasNext" @click="emit('page-change', 'next')">
                        <div class="icon mi icon16 left angle-right" :class="{ 'disabled-icon': !props.hasNext }">
                            &nbsp; </div>

                    </button><button class="ms-button btn-text-neutral only-icon"
                        :class="{ 'disabled-opacity': !props.hasNext }" :disabled="!props.hasNext"
                        @click="emit('page-change', 'last')">
                        <div class="icon mi icon16 left step-forward"
                            :class="{ 'disabled-icon': !props.hasNext }"> &nbsp; </div>
                    </button>
                </div>
            </div>
            <slot name="pagination-append"></slot>
        </div>
    </div>
</template>
