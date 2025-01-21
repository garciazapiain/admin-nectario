<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

// Navigate to the home page
const goToMainPage = () => {
  router.push("/");
};

// Handle logout and navigate to login
const handleLogout = () => {
  localStorage.removeItem("jwt");
  router.push("/login");
};

// Check if the current route matches the given path
const isCurrentPath = (path) => {
  return router.currentRoute.value.path === path;
};
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <!-- Header Section -->
    <div class="buttonsTop w-full justify-evenly">
      <div class="buttonWrapper">
        <!-- Show "Página Principal" button on all routes except '/' -->
        <button
          class="main-page-button"
          @click="goToMainPage"
          v-if="!isCurrentPath('/')"
        >
          Página Principal
        </button>

        <!-- Show "Salir" button only on the '/' route -->
        <button
          class="logout-button"
          v-if="isCurrentPath('/')"
          @click="handleLogout"
        >
          Salir
        </button>
      </div>
    </div>

    <!-- Router View for Pages -->
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
