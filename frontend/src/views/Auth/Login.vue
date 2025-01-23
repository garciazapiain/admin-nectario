<template>
  <div class="flex flex-col items-center mt-10">
    <!-- <div class="flex justify-center h-80 w-80 items-center">
      <img src="../../../public/logo.png" alt="Logo" />
    </div> -->
    <h2 class="text-2xl font-semibold mb-4">Admin Nectario</h2>
    <form @submit.prevent="submitForm" class="w-full p-3 flex flex-col space-y-4">
      <input type="text" v-model="username" placeholder="Username" required
        class="w-full p-2 border rounded-md focus:outline-none" />
      <input type="password" v-model="password" placeholder="Password" required
        class="w-full p-2 border rounded-md focus:outline-none" />
      <button type="submit" class="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none">Iniciar
        sesión</button>
    </form>
    <p v-if="errorMessage" class="text-red-500">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuth } from "../../composables/Auth/useAuth";
import { useFormValidation } from "../../composables/shared/useFormValidation";

const { login, errorMessage } = useAuth();
const { validateForm } = useFormValidation();

const username = ref("");
const password = ref("");

const submitForm = () => {
  const error = validateForm({ username: username.value, password: password.value });
  if (error) {
    errorMessage.value = error;
    return;
  }
  login(username.value, password.value);
};
</script>
