<script setup>
import { useRouter } from "vue-router";
import BaseButton from "../../components/BaseButton.vue";
import ArrowToPageNavigateDown from "../../components/ArrowToPageNavigateDown.vue";
import SearchBar from "../../components/SearchBar.vue";

const router = useRouter();
const handleClickSubPlatillo = (idSubplatillo) => {
  router.push(`/subplatillos/${idSubplatillo}`);
};
</script>

<template>
  <div>
    <ArrowToPageNavigateDown />
    <h1>Subplatillos</h1>
    <SearchBar v-model="searchTerm" placeholder="Buscar sub-platillo..."></SearchBar>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Rendimiento</th>
        </tr>
      </thead>
      <tbody>
        <tr @click="handleClickSubPlatillo(subplatillo.id_subplatillo)"
          v-for="(subplatillo, index) in filteredSubPlatillos" :key="index">
          <td>{{ subplatillo.nombre }}</td>
          <td>{{ subplatillo.unidad }}</td>
          <td>{{ subplatillo.rendimiento }}</td>
        </tr>
      </tbody>
    </table>
    <h2>Agregar nuevo sub-platillo</h2>
    <form
      id="agregarSubPlatilloForm"
      @submit.prevent="agregarSubPlatillo"
      class="flex flex-col space-y-4 p-6 bg-white shadow-lg rounded-lg"
    >
      <!-- Input for Nombre -->
      <input
      v-model="nuevoSubPlatillo.nombre"
      placeholder="Nombre"
      required
      class="w-full h-10 px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
      />

      <!-- Dropdown for Unidad -->
      <Dropdown
        v-model="nuevoSubPlatillo.unidad"
        :options="unidadOptions"
        :defaultOption="{ value: '', label: 'Unidad' }"
        required
      />

      <!-- Input for Rendimiento -->
      <input
        v-model="nuevoSubPlatillo.rendimiento"
        placeholder="Rendimiento"
        type="number"
        min="0.01"
        step="0.01"
        required
        class="w-full h-10 px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
      />

      <!-- Submit Button -->
      <BaseButton
        bgColor="bg-violet-800"
        textColor="text-white"
        fontSize="text-base"
        type="submit"
        class="w-full h-12 flex items-center justify-center bg-green-700 text-white rounded-lg hover:bg-green-800 transition-all"
      >
      Agregar Subplatillo
      </BaseButton>
    </form>
  </div>
</template>

<script>
import API_URL from "../../config";
import Dropdown from "../../components/Dropdown.vue";

export default {
  name: "Subplatillos",
  data() {
    return {
      subplatillos: [],
      unidades: [],
      nuevoSubPlatillo: {
        nombre: "",
        unidad: "",
        rendimiento: "",
      },
      searchTerm: ""
    };
  },
  methods: {
    async agregarSubPlatillo() {
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
      window.location.reload()
    },
  },
  computed: {
    unidadOptions() {
      return this.unidades.map((unidad) => ({
        value: unidad,
        label: unidad,
      }));
    },
    filteredSubPlatillos() {
      // Add this computed property
      if (!this.searchTerm) {
        return this.subplatillos;
      }
      const term = this.searchTerm.toLowerCase();
      return this.subplatillos.filter((subplatillo) =>
        subplatillo.nombre.toLowerCase().includes(term)
      );
    },
  },
  async mounted() {
    try {
      // Fetching subplatillos
      const responseSubplatillos = await fetch(`${API_URL}/subplatillos`);
      if (!responseSubplatillos.ok) {
        throw new Error(`HTTP error! status: ${responseSubplatillos.status}`);
      }
      this.subplatillos = await responseSubplatillos.json();
      // Fetching unidades
      const responseUnidades = await fetch(`${API_URL}/unidades`);
      if (!responseUnidades.ok) {
        throw new Error(`HTTP error! status: ${responseUnidades.status}`);
      }
      this.unidades = await responseUnidades.json();
    } catch (error) {
      console.error("Error:", error);
    }
  }
};
</script>

<style scoped>
</style>