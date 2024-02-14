<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const handleLogout = () => {
  localStorage.removeItem("jwt");
  router.push("/login");
};
</script>

<template>
  <div>
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
    <router-view />
  </div>
</template>

<style scoped>
.logout-button {
  position: fixed;
  top: 10px;
  right: 10px;
}
</style>