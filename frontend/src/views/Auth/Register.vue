<template>
  <div class="flex flex-col items-center mt-10">
    <!-- Logo Section -->
    <div class="flex justify-center h-80 w-80 items-center">
      <img src="../../../public/logo.webp" alt="Logo" />
    </div>
    <!-- Title -->
    <h2 class="text-2xl font-semibold mb-4">Registrarse</h2>
    <!-- Form -->
    <form @submit.prevent="submitForm" class="w-full max-w-sm p-3 flex flex-col space-y-4">
      <!-- Username Input -->
      <input
        type="text"
        v-model="username"
        placeholder="Usuario"
        required
        class="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <!-- Password Input -->
      <input
        type="password"
        v-model="password"
        placeholder="Contraseña"
        required
        class="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <!-- Submit Button -->
      <button
        type="submit"
        class="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-all duration-300 focus:outline-none"
      >
        Registrarse
      </button>
    </form>
    <!-- Error Message -->
    <p v-if="errorMessage" class="text-red-500 mt-4">{{ errorMessage }}</p>
  </div>
</template>

<script>
import { useRouter } from "vue-router";
import API_URL from "../../config";

export default {
  data() {
    return {
      username: "",
      password: "",
      errorMessage: "",
    };
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  methods: {
    async submitForm() {
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: this.username,
            password: this.password,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.message === "User registered") {
            this.router.push("/login"); // Redirect to login page
          } else {
            this.errorMessage = "Fallo en el registro"; // Failure in register process
          }
        } else {
          this.errorMessage = "Ocurrió un error"; // An error occurred
        }
      } catch (error) {
        this.errorMessage = "Ocurrió un error"; // An error occurred
      }
    },
  },
};
</script>
