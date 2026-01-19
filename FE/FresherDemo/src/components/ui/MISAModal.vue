<script setup lang="ts">
import { Dialog } from 'primevue';

/**
 * Props cho MISAModal component
 * - visible: Trạng thái hiển thị của modal (v-model:visible)
 * - closable: Cho phép đóng modal bằng nút X hoặc ESC
 * 
 * Created by: DatND (16/1/2026)
 */
interface Props {
    visible: boolean;
    closable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    closable: true
});

/**
 * Events được emit từ MISAModal
 * update:visible: Cập nhật trạng thái visible khi modal đóng/mở
 * 
 * Created by: DatND (16/1/2026)
 */
interface Emits {
    (e: 'update:visible', value: boolean): void;
}

const emit = defineEmits<Emits>();

/**
 * Xử lý sự kiện đóng modal
 * Emit update:visible với giá trị false
 * 
 * Created by: DatND (16/1/2026)
 */
const handleClose = () => {
    emit('update:visible', false);
};
</script>

<template>
    <Dialog
        :visible="visible" 
        :modal="true" 
        :closable="false"
        pt:mask="dialog-mask" 
        pt:footer="dialog-footer"
        pt:root="dialog-root"
        @update:visible="emit('update:visible', $event)"
    >
        <!-- 
            Slot header: Cho phép custom header của modal
            Mặc định hiển thị title và action buttons (help, close)
            Created by: DatND (16/1/2026)
        -->
        <template #header>
            <slot name="header" :close="handleClose">
                <div class="modal__title modal__drag cursor-move">
                    <div class="title-left">
                        <div class="title">
                            <slot name="title">Modal Title</slot>
                        </div>
                    </div>
                    <div class="title-right">
                        <slot name="header-actions" :close="handleClose">
                            <div class="mi icon20 ic-help pointer" shortkey-target="Help" v-tooltip="'Trợ giúp'"></div>
                            <div class="icon20 mi close pointer" v-tooltip="'Đóng (Esc)'" @click="handleClose"></div>
                        </slot>
                    </div>
                </div>
            </slot>
        </template>

        <!-- 
            Slot default: Nội dung chính của modal
            Created by: DatND (16/1/2026)
        -->
        <template #default>
            <span class="popup-shortkey" shortkey="Close|Save|SaveAndAdd|Help|Print|Maximum|QuickSelect|Postpone|Edit|Refresh|Delete|Duplicate|Posted|ShortKeyHelp"></span>
            <slot></slot>
        </template>

        <!-- 
            Slot footer: Footer của modal chứa các action buttons
            Created by: DatND (16/1/2026)
        -->
        <template #footer>
            <slot name="footer" :close="handleClose"></slot>
        </template>
    </Dialog>
</template>

<style>
/* Dialog Styles - Preserved from original implementation */

.dialog-root {
    width: 680px;
    touch-action: none;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    transition: all .3s ease-in-out;
    border-radius: 4px;
}

.dialog-root:focus {
    outline: none;
}

.dialog-mask {
    background-color: #0000002e;
}

.dialog-footer {
    display: flex;
    padding: 12px 20px;
    position: relative;
    border-top: 1px solid #d5dfe2;
}
</style>

<style scoped>
/* Modal Styles - Preserved from original implementation */
.modal__title {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal__title .title-left {
    flex: 1 1 0%;
    min-width: 0;
    align-items: center;
    font-weight: 700;
    font-size: 16px;
    line-height: 36px;
    text-overflow: ellipsis;
    overflow: hidden;
    display: flex;
}

.modal__title .title-right {
    display: flex;
    align-items: center;
    column-gap: 8px;
    justify-content: flex-end;
    white-space: nowrap;
    flex-shrink: 0;
}
.modal__title .title {
    font-size: 24px;
    font-family: Inter;
    color: #111827;
    margin-right: 32px;
    white-space: nowrap;
    cursor: text;
}
</style>
