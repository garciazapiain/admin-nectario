<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
const handleClickPlatillo = (idPlatillo) => {
  router.push(`/platillo/${idPlatillo}`);
};
</script>

<template>
  <div>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
        </tr>
      </thead>
      <tbody>
        <tr
          @click="handleClickPlatillo(platillo.id_platillo)"
          v-for="(platillo, index) in platillos"
          :key="index"
        >
          <td>{{ platillo.nombre }}</td>
        </tr>
      </tbody>
    </table>
    <form @submit.prevent="agregarPlatillo">
      <input v-model="nuevoPlatillo.nombre" placeholder="Nombre" required />
      <button type="submit">Agregar Platillo</button>
    </form>
  </div>
</template>

<script>
export default {
  name: "Platillos",
  data() {
    return {
      platillos: [],
      nuevoPlatillo:{
        nombre: "",
      }
    };
  },
  methods: {
    async agregarPlatillo() {
      const response = await fetch("http://localhost:3000/api/platillos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.nuevoPlatillo),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.platillos.push(this.nuevoPlatillo);
      this.nuevoPlatillo = {};
    },
  },
  async mounted() {
    try {
      const response = await fetch("http://localhost:3000/api/platillos");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Data is not an array");
      }
      this.platillos = data;
    } catch (error) {
      console.error(error);
    }
  },
};
</script>

<style scoped>
</style>