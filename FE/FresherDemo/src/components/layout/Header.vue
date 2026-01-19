<script setup lang="ts">

</script>

<template>
    <div class="header flex w-full">
        <!-- Header Left -->
        <div class="nav-item left flex-none">
            <div class="nav-item-logo">
                <div class="mi icon24 logo-menu" id="AMIS_Launcher"></div>
                <a class="home" href="/production">
                    <div class="logo-item"></div>
                    <div class="logo-text">Sản xuất</div>
                </a>
            </div>
        </div>
        <!-- Header Right -->
        <div class="nav-item right flex flex-1 justify-between">
            <div class="nav-item-content">
                <div class="nav-item-content-left flex items-center cursor-pointer">
                    <div class="company-title-container flex items-center">
                        <div class="company-title-text mr-1">Công ty cổ phần Misa 234</div>
                        <div class="mi icon16 ic-chevron-down"></div>
                    </div>
                </div>
                <div class="nav-item-content-right">
                    <div class="icon-function-nav mr-3" v-tooltip="'Xuất Excel'">
                        <div class="mi-awh icon24 download-status"></div>
                    </div>
                    <div class="nav-separator"></div>
                    <div class="icon-function-nav" v-tooltip="'Tra cứu tồn kho'">
                        <div class=" icon24 ic-package-2"></div>
                    </div>
                    <div class="icon-function-nav" v-tooltip="'Tham gia AMIS'">
                        <div class="ic-add-friend"></div>
                    </div>
                    <div class="icon-function-nav" v-tooltip="'Thông báo'">
                        <div class="mi icon24 ic-bell"></div>
                    </div>
                    <div class="icon-function-nav" v-tooltip="'Trợ giúp'">
                        <div class="mi icon24 ic-question-circle"></div>
                    </div>
                    <div class="icon-function-nav" v-tooltip="'Tính năng khác'">
                        <div class="mi-qtsx icon24 dots-circle-horizontal"></div>
                    </div>
                    <div class="icon-function-nav" v-tooltip="'Kiến thức hữu ích'">
                        <div class="ic-acknowledge"></div>
                    </div>
                    <div class="profile-icon">
                        <img src="../../assets/images/Avatar.svg" alt="Avatar">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
/* Header Component */
.header {
    width: 100%;
    height: 48px;
    background-color: #fff;
    display: flex;
    align-items: center;
    font-family: Inter;
    border-bottom: 1px solid #D1D5DB;
    position: relative;
}

/* Header left */
.nav-item.left {
    max-width: 200px;
    display: flex;
    align-items: center;
    padding-left: 16px;
    margin-right: 16px;
}

.nav-item-logo {
    display: flex;
    align-items: center;
}

.header .nav-item.left .home {
    margin-left: 16px;
    display: flex;
    align-items: center;
    width: 140px;
    cursor: pointer;
}

.header .nav-item.left .logo-item {
    background-image: url(../../assets/icons/ic-shift-green.svg);
    width: 30px;
    height: 30px;
    background-repeat: no-repeat;
    background-size: contain;
}

.header .nav-item.left .logo-text {
    font-size: 18px;
    margin-left: 12px;
    font-weight: 700;
    color: #262626;
    white-space: nowrap;
}

/* Header Right */
.nav-item.right {
    flex: 1;
    padding: 0 16px 0 20px;
}

.nav-item.right .nav-item-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
}

.nav-item.right .nav-item-content .nav-item-content-left {
    font-size: 14px;
}

.nav-item.right .nav-item-content .nav-item-content-right {
    display: flex;
    align-items: center;
}

.nav-item-content-left .company-title-container {
    max-width: 440px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.nav-item-content-left .company-title-text {
    font-size: 13px;
    font-weight: 700;
    margin-top: 2px;
}

.nav-item-content .nav-item-content-right .nav-separator {
    width: 1px;
    height: 16px;
    background: #D1D5DB;
    align-self: center;
    border-radius: 1px;
}

.nav-item-content .nav-item-content-right .icon-function-nav {
    cursor: pointer;
    position: relative;
}

.nav-item-content .nav-item-content-right .icon-function-nav:not(:first-child) {
    margin-left: 12px;
}

.nav-item-content .nav-item-content-right .profile-icon {
    margin-left: 16px;
    border: 1px solid #E0E0E0;
    position: relative;
    min-width: 32px;
    min-height: 32px;
    border-radius: 50%;
    cursor: pointer;
    width: 32px;
    height: 32px;
    overflow: hidden;
    border: none;
}

.nav-item-content .nav-item-content-right .profile-icon img {
    width: 100%;
    height: 100%;
    max-width: 32px;
    max-height: 32px;
}
</style>