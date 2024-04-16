<template>
  <div>
    <div
      style="
        display: flex;
        justify-content: center;
        height: 300px;
        width:300px
        align-items: center;
      "
    >
      <img src="../../assets/logo.png" alt="Logo" />
    </div>
    <h2>Admin Nectario</h2>
    <form
      @submit.prevent="submitForm"
      style="display: flex; flex-direction: column"
    >
      <input type="text" v-model="username" placeholder="Username" required />
      <input
        type="password"
        v-model="password"
        placeholder="Password"
        required
      />
      <button type="submit">Iniciar sesión</button>
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
        const response = await fetch(`${API_URL}/login`, {
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
            this.router.push("/"); // Redirect to home page
          } else {
            this.errorMessage = "Login falló";
          }
        } else {
          this.errorMessage = "Occurió un error";
        }
      } catch (error) {
        this.errorMessage = "Occurió un error";
      }
    },
  },
};
</script>