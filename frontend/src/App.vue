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
        <button class="main-page-button" @click="goToMainPage" v-show="router.currentRoute.value.path !== '/'">
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

<style scoped>
.buttonsTop {
  display: flex;
  justify-content: space-between;
}
.buttonWrapper {
  flex-grow: 1;
  display: flex;
  justify-content: center;
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