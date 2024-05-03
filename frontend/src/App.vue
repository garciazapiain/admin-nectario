<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const goToMainPage = () => {
  router.push("/");
};

const handleLogout = () => {
  localStorage.removeItem("jwt");
  router.push("/login");
};
</script>

<template>
  <div>
    <div class="buttonsTop">
      <div class="buttonWrapper">
        <button
          class="main-page-button"
          @click="goToMainPage"
          v-show="
            router.currentRoute.value.path !== '/' &&
            router.currentRoute.value.path !== '/login'
          "
        >
          Página principal
        </button>
      </div>
      <div class="buttonWrapper">
        <button
          class="logout-button"
          v-if="
            router.currentRoute.value.path !== '/login' &&
            router.currentRoute.value.path !== '/register'
          "
          @click="handleLogout"
        >
          Salir
        </button>
      </div>
    </div>
    <router-view />
  </div>
</template>

<script>
export default {
  computed: {
    isMainPageButtonVisible() {
      return (
        this.router.currentRoute.value.path !== "/" &&
        this.router.currentRoute.value.path !== "/login"
      );
    },
    isLogoutButtonVisible() {
      return (
        this.router.currentRoute.value.path !== "/login" &&
        this.router.currentRoute.value.path !== "/register"
      );
    },
  },
  // other options...
};
</script>

<style scoped>
.buttonsTop {
  display: flex;
  justify-content: space-between;
}
.buttonWrapper {
  display: flex;
  justify-content: space-between;
}

.buttonWrapper.justify-end {
  justify-content: flex-end;
}
.main-page-button {
  position: static;
  top: 10px;
  left: 15px;
}
.logout-button {
  position: static;
  top: 10px;
  right: 15px;
}
</style>