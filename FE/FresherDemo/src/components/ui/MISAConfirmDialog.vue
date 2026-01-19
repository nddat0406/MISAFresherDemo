<script setup lang="ts">
import { computed } from 'vue';

/**
 * Props cho MISAConfirmDialog component
 * - visible: Trạng thái hiển thị của dialog
 * - title: Tiêu đề của dialog
 * - message: Nội dung thông báo
 * - icon: Class của icon (mặc định: 'icon-confirm')
 * - acceptLabel: Nhãn nút đồng ý (mặc định: 'Đồng ý')
 * - rejectLabel: Nhãn nút hủy (mặc định: 'Hủy')
 * - showReject: Hiển thị nút hủy (mặc định: true)
 * - width: Chiều rộng của dialog (mặc định: '432px')
 * 
 * Created by: DatND (19/1/2026)
 */
interface Props {
    visible?: boolean;
    title?: string;
    message?: string;
    icon?: string;
    acceptLabel?: string;
    acceptClass?: string;
    rejectLabel?: string;
    rejectClass?: string;
    showReject?: boolean;
    width?: string;
}

const props = withDefaults(defineProps<Props>(), {
    visible: false,
    title: 'Xác nhận',
    message: '',
    icon: 'icon-confirm',
    acceptLabel: 'Đồng ý',
    acceptClass: 'ms-button btn-solid-brand',
    rejectLabel: 'Hủy',
    rejectClass: 'ms-button btn-outline-neutral msg-btn btn',
    showReject: true,
    width: '432px'
});

/**
 * Events được emit từ MISAConfirmDialog
 * - update:visible: Cập nhật trạng thái visible
 * - accept: Emit khi người dùng đồng ý
 * - reject: Emit khi người dùng hủy
 * - close: Emit khi đóng dialog
 * 
 * Created by: DatND (19/1/2026)
 */
interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'accept'): void;
    (e: 'reject'): void;
    (e: 'close'): void;
}

const emit = defineEmits<Emits>();

/**
 * Xử lý sự kiện đóng dialog
 * 
 * Created by: DatND (19/1/2026)
 */
const handleClose = () => {
    emit('update:visible', false);
    emit('close');
};

/**
 * Xử lý sự kiện đồng ý
 * 
 * Created by: DatND (19/1/2026)
 */
const handleAccept = () => {
    emit('update:visible', false);
    emit('accept');
};

/**
 * Xử lý sự kiện hủy
 * 
 * Created by: DatND (19/1/2026)
 */
const handleReject = () => {
    emit('update:visible', false);
    emit('reject');
};

/**
 * Xử lý click vào backdrop
 * 
 * Created by: DatND (19/1/2026)
 */
const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
        handleClose();
    }
};

/**
 * Computed style cho container
 * 
 * Created by: DatND (19/1/2026)
 */
const containerStyle = computed(() => ({
    width: props.width
}));
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="visible" class="msg-box" tabindex="-1" @click="handleBackdropClick">
                <div class="msg-center msg-box-container" :style="containerStyle">
                    <div class="flex gap-4">
                        <div class="msg-message">
                            <div class="msg-header">
                                <div class="title flex flex-center">
                                    <!-- Icon slot với fallback -->
                                    <slot name="icon">
                                        <span class="mi-qtsx icon20 mr-2" :class="icon"></span>
                                    </slot>
                                    
                                    <!-- Title slot với fallback -->
                                    <div class="msg-title">
                                        <slot name="title">{{ title }}</slot>
                                    </div>
                                </div>
                                <div class="icon-container">
                                    <div class="mi icon20 close pointer v-popper--has-tooltip" @click="handleClose"></div>
                                </div>
                            </div>
                            
                            <!-- Message slot với fallback -->
                            <div class="msg-item">
                                <slot name="message">{{ message }}</slot>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Buttons slot với fallback -->
                    <div class="msg-buttons flex gap-2 justify-end items-center">
                        <slot name="buttons" :accept="handleAccept" :reject="handleReject" :close="handleClose">
                            <button v-if="showReject" :class="rejectClass" @click="handleReject">
                                <div class="text nowrap">{{ rejectLabel }}</div>
                            </button>
                            <button :class="acceptClass" @click="handleAccept">
                                <div class="text nowrap">{{ acceptLabel }}</div>
                            </button>
                        </slot>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
/* Message box styles */
.msg-box {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background-color: #0000004d;
    z-index: 999999;
}

.msg-center {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #fff;
    box-shadow: 0 3px 20px #00000014;
    border-radius: 4px;
}

.msg-box-container {
    font-size: 14px;
    padding: 16px;
    display: flex;
    flex-direction: column;
}

.msg-message {
    display: flex;
    flex-direction: column;
    flex: 1;
    row-gap: 16px;
    margin-bottom: 16px;
}

.msg-message .msg-header {
    display: flex;
    align-items: center;
    height: 24px;
    justify-content: space-between;
}

.msg-item {
    font-size: 13px;
    max-height: 400px;
    overflow-y: auto;
    font-weight: 400;
    line-height: 20px;
    max-width: 100%;
    overflow-wrap: anywhere;
}

.msg-buttons {
    border-radius: 0 0 2px 2px;
}

.msg-title {
    font-weight: 600;
    color: #111827;
    font-size: 20px;
}

.msg-btn:not(:first-child) {
    margin-left: 10px;
}

/* Transition styles */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
