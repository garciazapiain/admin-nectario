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
      <button class="main-page-button" @click="goToMainPage">
        Página principal
      </button>
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
    <router-view />
  </div>
</template>

<style scoped>
.buttonsTop {
  display: flex;
  justify-content: space-between;
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