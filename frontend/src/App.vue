<script setup>
import { useRouter } from "vue-router";
import 'tailwindcss/tailwind.css'

const router = useRouter();

const goToMainPage = () => {
  router.push("/");
};

const handleLogout = () => {
  localStorage.removeItem("jwt");
  router.push("/login");
};

const isPathNotEqual = (...paths) => {
  return !paths.includes(router.currentRoute.value.path);
};
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <div class="buttonsTop w-full justify-evenly">
      <div class="buttonWrapper">
        <button
          class="main-page-button"
          @click="go/Page"
          v-show="isPathNotEqual('/', '/login')"
        >
          Página principal
        </button>
      </div>
      <div class="buttonWrapper">
        <button
          class="logout-button"
          v-if="isPathNotEqual('/login', '/register')"
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