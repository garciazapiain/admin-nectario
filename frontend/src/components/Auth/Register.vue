<template>
  <div>
    <h2>Registrarse</h2>
    <form @submit.prevent="submitForm">
      <input type="text" v-model="username" placeholder="Usuario" required />
      <input
        type="password"
        v-model="password"
        placeholder="Contraseña"
        required
      />
      <button type="submit">Registrar</button>
    </form>
    <p v-if="errorMessage">{{ errorMessage }}</p>
  </div>
</template>

<script>
import { useRouter } from "vue-router";

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
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";
      try {
        const response = await fetch(`${API_URL}/register`, {
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
            this.errorMessage = "Fallo en el registo";
          }
        } else {
          this.errorMessage = "Ocurrió un error";
        }
      } catch (error) {
        this.errorMessage = "Ocurrió un error";
      }
    },
  },
};
</script>