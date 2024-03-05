<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
const handleClickSubPlatillo = (idSubplatillo) => {
  router.push(`/subplatillo/${idSubplatillo}`);
};
</script>

<template>
  <div>
    <h1>Subplatillos</h1>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Rendimiento</th>
        </tr>
      </thead>
      <tbody>
        <tr
          @click="handleClickSubPlatillo(subplatillo.id_subplatillo)"
          v-for="(subplatillo, index) in subplatillos"
          :key="index"
        >
          <td>{{ subplatillo.nombre }}</td>
          <td>{{ subplatillo.unidad }}</td>
          <td>{{ subplatillo.rendimiento }}</td>
        </tr>
      </tbody>
    </table>
    <form @submit.prevent="agregarSubPlatillo">
      <input v-model="nuevoSubPlatillo.nombre" placeholder="Nombre" required />
      <input v-model="nuevoSubPlatillo.unidad" placeholder="Unidad" required />
      <input
        v-model="nuevoSubPlatillo.rendimiento"
        placeholder="Rendimiento"
        required
      />
      <button type="submit">Agregar Subplatillo</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "Subplatillos",
  data() {
    return {
      subplatillos: [],
      nuevoSubPlatillo: {
        nombre: "",
        unidad: "",
        rendimiento: "",
      },
    };
  },
  methods: {
    async agregarSubPlatillo() {
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";
      this.nuevoSubPlatillo.rendimiento = parseFloat(
        this.nuevoSubPlatillo.rendimiento
      );
      const response = await fetch(`${API_URL}/subplatillos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.nuevoSubPlatillo),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.subplatillos.push(this.nuevoSubPlatillo);
      this.nuevoSubPlatillo = { nombre: "", unidad: "", rendimiento: "" };
    },
  },
  async mounted() {
    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";
    const response = await fetch(`${API_URL}/subplatillos`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    this.subplatillos = await response.json();
  },
};
</script>

<style scoped>
</style>