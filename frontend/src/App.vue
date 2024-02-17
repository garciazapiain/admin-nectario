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
    <div>
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
.main-page-button {
  position: fixed;
  top: 10px;
  left: 15px;
}
.logout-button {
  position: fixed;
  top: 10px;
  right: 15px;
}
</style>