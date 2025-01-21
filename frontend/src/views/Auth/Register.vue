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
            this.errorMessage = "Fallo en el registo"; //Failure in register process
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