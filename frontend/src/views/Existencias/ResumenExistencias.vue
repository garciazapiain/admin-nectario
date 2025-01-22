<template>
  <div>
    <h1 class="font-bold mb-4">Resumen Existencias Lista Peligro</h1>
    <p class="mb-2">Ultima actualización Moral: {{ lastUpdatedMoral }}</p>
    <p class="mb-4">Ultima actualización Campestre: {{ lastUpdatedCampestre }}</p>
    <SearchBar v-model="searchTerm" placeholder="Buscar ingrediente..."></SearchBar>
    <div class="w-full flex justify-center">
      <div class="overflow-x-auto">
        <p v-if="isLoading">Loading....</p>
        <table v-else class="min-w-full border-collapse">
          <thead>
            <tr class="bg-gray-200">
              <th class="border p-2">Insumo</th>
              <th class="border p-2">Unidad</th>
              <th class="border p-2">Moral</th>
              <th class="border p-2">Camp</th>
              <!-- <th v-if="isAdmin" class="border p-2">Sugerencias para Transf.</th> -->
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
                :class="['border p-2', getInventory('moral', ingrediente.id_ingrediente, submissions) < ingrediente.moral_demanda_semanal / 7 ? 'text-red-500' : 'text-white']">
                {{ getInventory("moral", ingrediente.id_ingrediente, submissions) }}
              </td>
              <td
                :class="['border p-2', getInventory('bosques', ingrediente.id_ingrediente, submissions) < ingrediente.bosques_demanda_semanal / 7 ? 'text-red-500' : 'text-white']">
                {{ getInventory("bosques", ingrediente.id_ingrediente, submissions) }}
              </td>
              <!-- <td v-if="isAdmin" class="border p-2 max-w-3 text-white">{{ shouldTransfer(ingrediente, submissions) }}</td> -->
            </tr>
          </tbody>
        </table>
      </div>
      <PopupInsumo v-if="isPopupVisible" :ingrediente="selectedIngredient" @close="closePopup" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import SearchBar from "../../components/SearchBar.vue";
import useSubmissions from "../../composables/shared/useSubmissions";
import useIngredients from "../../composables/shared/useIngredients";
import useInventory from "../../composables/ExistenciasYListaPeligro/useInventory";
import PopupInsumo from "../../components/PopupInsumo.vue";
import useAdminState from "../../composables/shared/useAdminState";

/* ====== Section A: Core Declarations and State ====== */

// Core Data Management
const { isAdmin } = useAdminState();
const { submissions, fetchSubmissions, lastSubmission } = useSubmissions();
const {
  ingredientes,
  proveedores,
  searchTerm,
  selectedProveedor,
  selectedFrecuencia,
  selectedInsumosTipo,
  fetchIngredientes,
  fetchProveedores,
  filteredIngredients,
} = useIngredients();
const { getInventory } = useInventory();

// Computed Properties
const lastUpdatedMoral = computed(() =>
  lastSubmission("moral")
    ? new Date(lastSubmission("moral").timestamp).toLocaleString("en-US", {
        timeZone: "UTC",
      })
    : "N/A"
);

const lastUpdatedCampestre = computed(() =>
  lastSubmission("bosques")
    ? new Date(lastSubmission("bosques").timestamp).toLocaleString("en-US", {
        timeZone: "UTC",
      })
    : "N/A"
);

// State and Reactive Variables
const isPopupVisible = ref(false);
const selectedIngredient = ref(null);
const isLoading = ref(true);

/* ====== Section B: Functions for Component Logic ====== */

// Initialization and Lifecycle
onMounted(async () => {
  await Promise.all([fetchSubmissions(), fetchIngredientes(), fetchProveedores()]);
  isLoading.value = false; // Set loading to false after all fetches complete
});


// Popup/Dropdown and Interaction Logic
const ingredienteClicked = (ingrediente) => {
  selectedIngredient.value = ingrediente;
  isPopupVisible.value = true;
};

const closePopup = () => {
  isPopupVisible.value = false;
};


</script>

<style scoped>
.filterBar {
  @apply ml-2 h-8 text-base w-3/4;
}
</style>