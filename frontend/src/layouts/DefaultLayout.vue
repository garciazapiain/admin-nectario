<script setup>
import { useRouter } from "vue-router";
import ButtonBase from "../components/BaseButton.vue";
import { ref, computed } from "vue";

const router = useRouter();

const isAdmin = ref(localStorage.getItem("isAdmin") === "true");
const userName = ref(localStorage.getItem("userName"));

// Handle logout and navigate to login
const handleLogout = () => {
  localStorage.removeItem("jwt");
  router.push("/login");
};

// Check if the current route matches the given path
const isCurrentPath = (path) => {
  return router.currentRoute.value.path === path;
};

// Check if buttons should be shown
const shouldShowButtons = () => {
  const excludedPaths = ["/login", "/register"];
  return !excludedPaths.includes(router.currentRoute.value.path);
};

// Toggle button logic for non-admin users
const toggleRoute = () => {
  const currentPath = router.currentRoute.value.path;

  if (userName.value === "campestre") {
    if (currentPath.startsWith("/listapeligro")) {
      router.push("/existenciasresumen");
    } else if (currentPath === "/existenciasresumen") {
      router.push("/listapeligro/bosques");
    }
  }

  if (userName.value === "moral") {
    if (currentPath.startsWith("/listapeligro")) {
      router.push("/existenciasresumen");
    } else if (currentPath === "/existenciasresumen") {
      router.push("/listapeligro/moral");
    }
  }
};

// Button label changes based on current route
const toggleButtonLabel = computed(() => {
  const currentPath = router.currentRoute.value.path;
  return currentPath.startsWith("/listapeligro") ? "Resumen Existencias" : "Lista Peligro";
});
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <!-- Header Section -->
    <div v-if="shouldShowButtons()" class="fixed top-2.5 left-2.5 z-50 flex flex-col space-y-2">
      <div class="buttonWrapper">
        <!-- Página Principal button (commented out) -->
        <!--
        <ButtonBase bgColor="bg-white" textColor="text-black" fontSize="text-base" @click="goToMainPage"
          v-if="!isCurrentPath('/')">
          Página Principal
        </ButtonBase>
        -->

        <!-- Toggle Button for moral/campestre (not admin) -->
        <ButtonBase :hidden="isAdmin" bgColor="bg-white" textColor="text-black" fontSize="text-base"
          @click="toggleRoute">
          {{ toggleButtonLabel }}
        </ButtonBase>


        <!-- Logout button only on the '/' route -->
        <ButtonBase bgColor="bg-white" textColor="text-black" fontSize="text-base" v-if="isCurrentPath('/')"
          @click="handleLogout">
          Salir
        </ButtonBase>
      </div>
    </div>

    <!-- Router View for Pages -->
    <router-view class="mt-20" />
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
