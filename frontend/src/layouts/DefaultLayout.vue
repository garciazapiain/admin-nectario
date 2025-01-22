<script setup>
import { useRouter } from "vue-router";
import ButtonBase from "../components/BaseButton.vue"

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

// Check if the current route matches the given path or if it's excluded
const shouldShowButtons = () => {
  const excludedPaths = ["/login", "/register"];
  return !excludedPaths.includes(router.currentRoute.value.path);
};

</script>

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <!-- Header Section -->
    <div v-if="shouldShowButtons()" class="buttonsTop w-full justify-evenly">
      <div class="buttonWrapper">
        <!-- Show "Página Principal" button on all routes except '/' -->
        <ButtonBase bgColor="bg-white" textColor="text-black" fontSize="text-base" @click="goToMainPage"
          v-if="!isCurrentPath('/')">
          Página Principal
        </ButtonBase>

        <!-- Show "Salir" button only on the '/' route -->
        <ButtonBase bgColor="bg-white" textColor="text-black" fontSize="text-base" v-if="isCurrentPath('/')"
          @click="handleLogout">
          Salir
        </ButtonBase>
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
