<template>
  <div>
    <h1>Resumen Existencias Lista Peligro</h1>
    <p>Ultima actualización Moral: {{ lastUpdatedMoral }}</p>
    <p>Ultima actualización Campestre: {{ lastUpdatedCampestre }}</p>
    <div v-if="isAdmin" class="filtros-container">
      <h2>Filtros:</h2>
      <label for="insumos">Tipo Insumos:</label>
      <select class="filterBar" id="insumos" v-model="selectedInsumosTipo">
        <option value="Lista Peligro">Lista peligro</option>
        <option value="Todos">Todos</option>
      </select>
      <label for="proveedores">Proveedores:</label>
      <select class="filterBar" id="proveedores" v-model="selectedProveedor">
        <option value="">Todos</option>
        <option
          v-for="proveedor in proveedores"
          :key="proveedor.id"
          :value="proveedor.nombre"
        >
          {{ proveedor.nombre }}
        </option>
      </select>
      <label for="frecuencias_inventario">Frecuencia Inventario:</label>
      <select
        class="filterBar"
        id="frecuencias_inventario"
        v-model="selectedFrecuencia"
      >
        <option value="">Todos</option>
        <option value="inicio_primer_turno">Inicio primer turno</option>
        <option value="inicio_segundo_turno">Inicio segundo turno</option>
        <option value="fin_segundo_turno">Fin segundo turno</option>
      </select>
    </div>
    <input
      v-model="searchTerm"
      placeholder="Buscar ingrediente..."
      class="search-bar"
    />
    <table>
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Unidad</th>
          <th>Moral</th>
          <th>Campestre</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(ingrediente, index) in filteredIngredients" :key="index">
          <td>{{ ingrediente.nombre }}</td>
          <td>{{ ingrediente.unidad }}</td>
          <td>{{ getInventory("moral", ingrediente.id_ingrediente) }}</td>
          <td>{{ getInventory("bosques", ingrediente.id_ingrediente) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from "vue";
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");
</script>
<script>
export default {
  name: "ResumenExistencias",
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
    };
  },
  async created() {
    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";
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
.filtros-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.filterBar {
  margin-left: 10px;
  height: 2rem;
  font-size: 1rem;
  width: 50%;
}
.search-bar {
  width: 50%;
  padding: 10px;
  font-size: 16px;
}
td {
  color: white;
}
/* Add any custom styles here */
</style>