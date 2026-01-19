<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { useToast } from 'primevue';

/**
 * Not Implemented View
 * Fallback view for routes that haven't been implemented yet
 * Created By: DatND (13/1/2026)
 */

const route = useRoute();

const pageTitle = computed(() => {
  return route.meta.title || 'Chức năng';
});

const breadcrumb = computed(() => {
  return (route.meta.breadcrumb as string[]) || [];
});


const toast = useToast();

</script>

<template>
  <div class="not-implemented-view">
    <div class="page-header">
      <div v-if="breadcrumb.length > 0" class="breadcrumb">
        <span v-for="(item, index) in breadcrumb" :key="index">
          <span v-if="index > 0" class="separator">/</span>
          <span :class="{ current: index === breadcrumb.length - 1 }">{{ item }}</span>
        </span>
      </div>
      <h1>{{ pageTitle }}</h1>
    </div>

    <div class="not-implemented-content">
      <div class="not-implemented-card">
        <img src="../assets/images/bg_report_nodata.svg" alt="Not Implemented" class="m-auto" />
        <h2>Chức năng chưa được phát triển</h2>
        <p class="message">
          Tính năng này hiện đang trong quá trình phát triển và sẽ sớm được cập nhật.
        </p>
        <p class="sub-message">
          Vui lòng quay lại sau hoặc liên hệ quản trị viên để biết thêm thông tin.
        </p>

        <div class="action-buttons">
          <button class="btn-secondary" @click="$router.go(-1)">
            <span class="icon16 mi icon-arrow-left"></span>
            Quay lại
          </button>
          <button class="btn-primary" @click="$router.push('/')">
            <span class="icon16 mi-qtsx icon-dashboard"></span>
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-implemented-view {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 32px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.breadcrumb .separator {
  color: #d1d5db;
  margin: 0 4px;
}

.breadcrumb .current {
  color: #1f2937;
  font-weight: 500;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
}

.not-implemented-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.not-implemented-card {
  background: white;
  border-radius: 12px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.icon-wrapper {
  display: inline-flex;
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.icon-wrapper .icon64 {
  background-color: #f59e0b;
}

.not-implemented-card h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.message {
  font-size: 16px;
  color: #4b5563;
  margin-bottom: 8px;
}

.sub-message {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 32px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-primary .icon16 {
  background-color: white;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.btn-secondary .icon16 {
  background-color: #374151;
}

.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.info-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.info-icon {
  display: flex;
  width: 48px;
  height: 48px;
  background: #ede9fe;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon .icon24 {
  background-color: #7c3aed;
}

.info-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.info-content p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}
</style>

