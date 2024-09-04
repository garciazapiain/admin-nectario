<template>
  <div class="flex flex-col items-center mt-10">
    <div class="flex justify-center h-80 w-80 items-center">
      <img src="../../assets/logo.png" alt="Logo" />
    </div>
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
        const response = await fetch(`${API_URL}/auth/login`, {
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
          if (data.accessToken) {
            localStorage.setItem("jwt", data.accessToken);
            localStorage.setItem("isAdmin", data.isAdmin);
            localStorage.setItem("isChef", data.isChef);
            this.router.push("/"); // Redirect to home page
          } else {
            this.errorMessage = "Login falló";// Login failed
          }
        } else {
          this.errorMessage = "Occurió un error";// An error occurred
        }
      } catch (error) {
        this.errorMessage = "Occurió un error";// An error occurred
      }
    },
  },
};
</script>
