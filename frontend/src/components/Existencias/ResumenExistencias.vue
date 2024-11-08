<template>
  <div>
    <h1 class="font-bold mb-4">Resumen Existencias Lista Peligro</h1>
    <p class="mb-2">Ultima actualización Moral: {{ lastUpdatedMoral }}</p>
    <p class="mb-4">Ultima actualización Campestre: {{ lastUpdatedCampestre }}</p>
    <!-- <div v-if="isAdmin" class="flex flex-col justify-center items-center w-full">
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
    </div> -->
    <input v-model="searchTerm" placeholder="Buscar ingrediente..." class="search-bar w-3/4 p-4 mb-4 border rounded" />
    <div class="w-full flex justify-center">
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse">
          <thead>
            <tr class="bg-gray-200">
              <th class="border p-2">Insumo</th>
              <th class="border p-2">Unidad</th>
              <th class="border p-2">Moral</th>
              <th class="border p-2">Camp</th>
              <th v-if="isAdmin" class="border p-2">Sugerencias para Transf.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ingrediente, index) in filteredIngredients" :key="index"
              class="odd:bg-gray-800 even:bg-gray-950">
              <td class="border p-2 cursor-pointer text-white" @click="ingredienteClicked(ingrediente)">
                {{ ingrediente.nombre }}
              </td>
              <td class="border p-2 text-white">{{ ingrediente.unidad }}</td>
              <td
                :class="['border p-2', getInventory('moral', ingrediente.id_ingrediente) < ingrediente.moral_demanda_semanal / 7 ? 'text-red-500' : 'text-white']">
                {{ getInventory("moral", ingrediente.id_ingrediente) }}
              </td>
              <td
                :class="['border p-2', getInventory('bosques', ingrediente.id_ingrediente) < ingrediente.bosques_demanda_semanal / 7 ? 'text-red-500' : 'text-white']">
                {{ getInventory("bosques", ingrediente.id_ingrediente) }}
              </td>
              <td v-if="isAdmin" class="border p-2 max-w-3 text-white">{{ shouldTransfer(ingrediente) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <PopupInsumo v-if="isPopupVisible" :ingrediente="selectedIngredient" @close="closePopup" />
    </div>
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
    const submissionsResponse = await fetch(`${API_URL}/submissions/latest-submissions`);
    if (submissionsResponse.ok) {
      this.submissions = await submissionsResponse.json();
    } else {
      console.error("HTTP error:", submissionsResponse.status);
    }
    // Fetch the ingredientes data
    const response = await fetch(`${API_URL}/ingredientes-producto-clave`);
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
      if (lastSubmission) {
        const date = new Date(lastSubmission.timestamp);
        return date.toLocaleString("en-US", { timeZone: "UTC" });
      }
      return "N/A";
    },
    lastUpdatedCampestre() {
      const lastSubmission = this.lastSubmission("bosques");
      if (lastSubmission) {
        const date = new Date(lastSubmission.timestamp);
        return date.toLocaleString("en-US", { timeZone: "UTC" });
      }
      return null;
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
    shouldTransfer(ingrediente) {
      const moralInventory = this.getInventory("moral", ingrediente.id_ingrediente);
      const bosquesInventory = this.getInventory("bosques", ingrediente.id_ingrediente);
      if (
        moralInventory < ingrediente.moral_demanda_semanal / 7 ||
        bosquesInventory < ingrediente.bosques_demanda_semanal / 7
      ) {
        const moralDemand = ingrediente.moral_demanda_semanal;
        const bosquesDemand = ingrediente.bosques_demanda_semanal;
        const totalDemand = Number(moralDemand) + Number(bosquesDemand);
        const totalInventory = moralInventory + bosquesInventory;
        const bothInventoriesLow = moralInventory < ingrediente.moral_demanda_semanal / 7 && bosquesInventory < ingrediente.bosques_demanda_semanal / 7;
        const percentMoral = moralDemand / totalDemand;
        const percentBosques = bosquesDemand / totalDemand;
        const unitsToFixed1 = ["KG", "CAJA", "POMO", "TUBO", "BOTE", "BOLSA"];
        let adjustMoral = Math.round(percentMoral * totalInventory);
        let adjustBosques = Math.round(percentBosques * totalInventory);
        if (!unitsToFixed1.includes(ingrediente.unidad)) {
          // If unidad is NOT one of the excluded ones, apply Math.round
          adjustMoral = Math.round(percentMoral * totalInventory);
          adjustBosques = Math.round(percentBosques * totalInventory);
        } else {
          // If unidad is one of the excluded ones, do not apply Math.round
          adjustMoral = percentMoral * totalInventory;
          adjustBosques = percentBosques * totalInventory;
        }
        // Ensure the sum of adjustments equals total inventory exactly
        const adjustmentDifference = totalInventory - (adjustMoral + adjustBosques);
        adjustMoral += adjustmentDifference; // Adjust one of the values to compensate for rounding
        const toFixedValue = unitsToFixed1.includes(ingrediente.unidad) ? 1 : 0;
        const inventoryAlreadyBalanced = (Number(percentMoral * totalInventory).toFixed(1)) == Number(moralInventory) && (Number(percentBosques * totalInventory).toFixed(1)) == Number(bosquesInventory);
        const adjustMoralMessage = adjustMoral > 0 ? `Ajuste Moral: ${adjustMoral.toFixed(toFixedValue)},` : "";
        const adjustBosquesMessage = adjustBosques > 0 ? `Ajuste Campestre: ${adjustBosques.toFixed(toFixedValue)}` : "";
        return `${bothInventoriesLow ? "RESURTIR URGENTE, POR EL MOMENTO:\n" : ""}${inventoryAlreadyBalanced ? "Inventario ya balanceado" : `${adjustMoralMessage}\n${adjustBosquesMessage}`}`;
      } else {
        return ""; // Return empty string if no adjustment needed
      }
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