import { onBeforeUnmount, ref } from 'vue';

interface UseTableColumnSizingParams {
    getInitialWidth: (field: string) => number;
}

export const useTableColumnSizing = ({ getInitialWidth }: UseTableColumnSizingParams) => {
    const columnWidths = ref<Record<string, number>>({});
    const resizingState = ref<{ field: string; startX: number; startWidth: number } | null>(null);

    /**
     * Khởi tạo chiều rộng mặc định cho các cột từ getInitialWidth. Trả về Record<field, width>
     * Create by: DatND (15/1/2026)
     */
    const initWidths = (fields: string[]) => {
        const next: Record<string, number> = {};
        fields.forEach(field => {
            next[field] = getInitialWidth(field);
        });
        columnWidths.value = next;
    };

    const getColumnWidth = (field: string) => {
        const fromState = columnWidths.value[field];
        if (fromState) return fromState;
        return getInitialWidth(field);
    };

    /**
     * Xử lý bắt đầu resize cột, lưu state và đăng ký mousemove, mouseup events
     * Create by: DatND (15/1/2026)
     */
    const startResize = (field: string, clientX: number) => {
        const width = getColumnWidth(field);
        resizingState.value = { field, startX: clientX, startWidth: width };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopResize);
    };

    /**
     * Tính toán chiều rộng mới khi kéo resize. Width tối thiểu là 10px
     * Create by: DatND (15/1/2026)
     */
    const handleMouseMove = (event: MouseEvent) => {
        if (!resizingState.value) return;
        const delta = event.clientX - resizingState.value.startX;
        const nextWidth = Math.max(10, resizingState.value.startWidth + delta);
        columnWidths.value = { ...columnWidths.value, [resizingState.value.field]: nextWidth };
    };

    const stopResize = () => {
        resizingState.value = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', stopResize);
    };

    onBeforeUnmount(() => stopResize());

    return {
        columnWidths,
        resizingState,
        initWidths,
        getColumnWidth,
        startResize,
        stopResize
    };
};
