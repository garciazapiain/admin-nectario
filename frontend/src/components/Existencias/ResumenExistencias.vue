<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Resumen Existencias Lista Peligro</h1>
    <p class="mb-2">Ultima actualización Moral: {{ lastUpdatedMoral }}</p>
    <p class="mb-4">Ultima actualización Campestre: {{ lastUpdatedCampestre }}</p>
    <div v-if="isAdmin" class="flex flex-col justify-center items-center w-full">
      <h2 class="text-xl font-semibold mb-2">Filtros:</h2>
      <label for="insumos" class="mb-2">Tipo Insumos:</label>
      <select id="insumos" v-model="selectedInsumosTipo" class="filterBar">
        <option value="Lista Peligro">Lista peligro</option>
        <option value="Todos">Todos</option>
      </select>
      <label for="proveedores" class="mb-2">Proveedores:</label>
      <select id="proveedores" v-model="selectedProveedor" class="filterBar">
        <option value="">Todos</option>
        <option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.nombre">
          {{ proveedor.nombre }}
        </option>
      </select>
      <label for="frecuencias_inventario" class="mb-2">Frecuencia Inventario:</label>
      <select id="frecuencias_inventario" v-model="selectedFrecuencia" class="filterBar">
        <option value="">Todos</option>
        <option value="inicio_primer_turno">Inicio primer turno</option>
        <option value="inicio_segundo_turno">Inicio segundo turno</option>
        <option value="fin_segundo_turno">Fin segundo turno</option>
      </select>
    </div>
    <input v-model="searchTerm" placeholder="Buscar ingrediente..." class="w-3/4 p-2 mb-4 border rounded" />
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-200">
          <th class="border p-2">Insumo</th>
          <th class="border p-2">Unidad</th>
          <th class="border p-2">Moral</th>
          <th class="border p-2">Campestre</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(ingrediente, index) in filteredIngredients" :key="index" class="odd:bg-gray-800 even:bg-gray-950">
          <td class="border p-2 cursor-pointer" @click="ingredienteClicked(ingrediente)">
            {{ ingrediente.nombre }}
          </td>
          <td class="border p-2">{{ ingrediente.unidad }}</td>
          <td :class="['border p-2', getInventory('moral', ingrediente.id_ingrediente) < ingrediente.moral_demanda_semanal / 7 ? 'text-red-500' : 'text-white']">
            {{ getInventory("moral", ingrediente.id_ingrediente) }}
          </td>
          <td :class="['border p-2', getInventory('bosques', ingrediente.id_ingrediente) < ingrediente.bosques_demanda_semanal / 7 ? 'text-red-500' : 'text-white']">
            {{ getInventory("bosques", ingrediente.id_ingrediente) }}
          </td>
        </tr>
      </tbody>
    </table>
    <PopupInsumo v-if="isPopupVisible" :ingrediente="selectedIngredient" @close="closePopup" />
  </div>
</template>

<script setup>
import { ref } from "vue";
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");
</script>
<script>
import PopupInsumo from "./PopupInsumo.vue";
import API_URL from "../../config";
export default {
  name: "ResumenExistencias",
  components: {
    PopupInsumo,
  },
  data() {
    return {
      submissions: [],
      ingredientes: [], // You need to fetch the ingredientes data
      proveedor: "",
      proveedores: [], // For the select dropdown
      selectedInsumosTipo: "Lista Peligro",
      selectedProveedor: "",
      selectedFrecuencia: "",
      searchTerm: "",
      isPopupVisible: false,
      selectedIngredient: null,
    };
  },
  async created() {
    const submissionsResponse = await fetch(`${API_URL}/submissions`);
    if (submissionsResponse.ok) {
      this.submissions = await submissionsResponse.json();
    } else {
      console.error("HTTP error:", submissionsResponse.status);
    }
    // Fetch the ingredientes data
    const response = await fetch(`${API_URL}/ingredientes`);
    if (response.ok) {
      this.ingredientes = await response.json();
      return this.ingredientes;
    } else {
      console.error("HTTP error:", response.status);
    }
    const proveedoresResponse = await fetch(`${API_URL}/proveedores`);
    if (proveedoresResponse.ok) {
      let proveedores = await proveedoresResponse.json();
      // Filter out the provider with id 1
      this.proveedores = proveedores.filter((proveedor) => proveedor.id !== 1);
    } else {
      console.error("HTTP error:", proveedoresResponse.status);
    }
  },
  computed: {
    lastUpdatedMoral() {
      const lastSubmission = this.lastSubmission("moral");
      return lastSubmission
        ? new Date(lastSubmission.timestamp).toLocaleString()
        : "N/A";
    },
    lastUpdatedCampestre() {
      const lastSubmission = this.lastSubmission("bosques");
      return lastSubmission
        ? new Date(lastSubmission.timestamp).toLocaleString()
        : "N/A";
    },
    filteredIngredients() {
      let ingredientes = this.ingredientes;
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        ingredientes = ingredientes.filter((ingrediente) =>
          ingrediente.nombre.toLowerCase().includes(term)
        );
      }
      if (this.proveedor) {
        ingredientes = ingredientes.filter(
          (ingrediente) => ingrediente.proveedor === this.proveedor
        );
      }
      // Exclude ingredientes with proveedor_id === 1
      ingredientes = ingredientes.filter(
        (ingrediente) =>
          ingrediente.proveedor_id !== 1 && ingrediente.proveedor_id !== 31
      );
      // Filter ingredientes based on selectedInsumos
      if (this.selectedInsumosTipo === "Lista Peligro") {
        ingredientes = ingredientes.filter((ingrediente) => {
          return ingrediente.producto_clave;
        });
      }
      // Filter ingredientes based on selectedProveedor
      if (this.selectedProveedor) {
        ingredientes = ingredientes.filter(
          (ingrediente) => ingrediente.proveedor === this.selectedProveedor
        );
      }
      // Filter ingredientes based on selectedFrecuencia
      ingredientes = ingredientes.filter(
        (ingrediente) =>
          !ingrediente.frecuencias_inventario.includes("no_inventarear")
      );
      if (this.selectedFrecuencia) {
        ingredientes = ingredientes.filter((ingrediente) =>
          ingrediente.frecuencias_inventario.includes(this.selectedFrecuencia)
        );
      }
      ingredientes.sort((a, b) => {
        if (this.selectedInsumosTipo === "Lista Peligro") {
          // Sort by producto_clave first (true values come first)
          if (a.producto_clave !== b.producto_clave) {
            return b.producto_clave - a.producto_clave;
          }
          // If producto_clave is the same, sort alphabetically by nombre
          return a.nombre.localeCompare(b.nombre);
        } else {
          // Sort by orden_inventario, nulls last
          if (a.orden_inventario === null) return 1;
          if (b.orden_inventario === null) return -1;
          return a.orden_inventario - b.orden_inventario;
        }
      });
      ingredientes = ingredientes.filter((ingrediente) => {
        // Only apply the filter to ingredientes where producto_clave is not true
        if (!ingrediente.producto_clave) {
          const moralInventory = this.getInventory(
            "moral",
            ingrediente.id_ingrediente
          );
          const bosquesInventory = this.getInventory(
            "bosques",
            ingrediente.id_ingrediente
          );
          return (
            moralInventory !== "Suficiente" || bosquesInventory !== "Suficiente"
          );
        }
        // If producto_clave is true, include the ingrediente in the list
        return true;
      });
      return ingredientes;
    },
  },
  methods: {
    closePopup() {
      this.isPopupVisible = false;
    },
    ingredienteClicked(ingrediente) {
      this.selectedIngredient = ingrediente;
      this.isPopupVisible = true;
    },
    getInventory(storeName, ingredientId) {
      const submission = this.lastSubmission(storeName);

      if (!submission) {
        return "N/A";
      }

      const ingrediente = submission.compra.find(
        (ing) => ing.id_ingrediente === ingredientId
      );

      return ingrediente ? ingrediente.cantidad_inventario : "N/A";
    },
    lastSubmission(store) {
      const storeSubmissions = this.submissions.filter(
        (submission) => submission.store === store
      );

      if (storeSubmissions.length > 0) {
        return storeSubmissions.reduce((latest, current) =>
          new Date(latest.timestamp) > new Date(current.timestamp)
            ? latest
            : current
        );
      } else {
        return null;
      }
    },
  },
};
</script>

<style scoped>
.filterBar {
  @apply ml-2 h-8 text-base w-3/4;
}
</style>