<script setup lang="ts">
import { ref } from 'vue';
import Header from './components/layout/Header.vue';
import NavigationSidebar from './components/layout/NavigationSidebar.vue';

const isSidebarCollapsed = ref(false);

const handleToggleCollapse = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};
</script>

<template>
  <!-- Main Container -->
  <div class="main-container flex flex-col h-full">
    <div class="header-container">
      <Header></Header>
    </div>
    <div class="main flex grow">
      <div class="main-left">
        <div class="left-container h-full">
          <NavigationSidebar :is-collapsed="isSidebarCollapsed" @toggle-collapse="handleToggleCollapse" />
        </div>
      </div>
      <div class="main-right grow flex flex-col">
        <div class="main-view flex flex-col">
          <!-- Router View for page content -->
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  height: 100%;
}

.header-container {
  width: 100%;
  height: 48px;
  background-color: #fff;
  display: flex;
  align-items: center;
  font-family: Inter;
  border-bottom: 1px solid #D1D5DB;
  position: relative;
}

.main {
  height: calc(100% - 48px);
  max-height: calc(100vh - 48px);
}

.main-left {
  background: #393a3d;
}
.main-right {
  transition: padding .2s;
  background-color: #fff;
  width: calc(100% - 234px);
}

.main-view {
  height: 100%;
  background: #E5E7EB;
  padding: 16px 20px 20px;
}
</style>