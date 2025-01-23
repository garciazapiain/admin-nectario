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
import { ref, computed, watch } from "vue";
import SearchBar from "../../components/SearchBar.vue";
import useSubmissions from "../../composables/shared/useSubmissions";
import useInventory from "../../composables/ExistenciasYListaPeligro/useInventory";
import PopupInsumo from "../../components/PopupInsumo.vue";
import useSWRV from 'swrv';
import API_URL from "../../config";

/* ====== Section A: Core Declarations and State ====== */

// Initialization and Lifecycle

const fetcher = (url) => fetch(url).then((res) => res.json());
const { data: submissions, error: submissionsError } = useSWRV(`${API_URL}/submissions/latest-submissions`, fetcher);
const { data: ingredientes, error: ingredientesError } = useSWRV(`${API_URL}/ingredientes/producto-clave`, fetcher);

if (!submissionsError && !ingredientesError) {
  isLoading.value = false;
}

watch(
  [submissions, ingredientes],
  ([newSubmissions, newIngredientes]) => {
    const isLoading = ref(true);
    if (newSubmissions && newIngredientes) {
      isLoading.value = false;
    }
  },
  { immediate: true }
);

// Core Data Management
const searchTerm = ref("")
const { lastSubmission } = useSubmissions()
const { getInventory } = useInventory()

// Computed Properties
const filteredIngredients = computed(() => {
  if (!ingredientes?.value) return [];
  const term = searchTerm.value.toLowerCase();
  return ingredientes.value.filter((ingrediente) =>
    ingrediente.nombre.toLowerCase().includes(term)
  );
});

const lastUpdatedMoral = computed(() =>
  lastSubmission("moral", submissions)
    ? new Date(lastSubmission("moral", submissions).timestamp).toLocaleString("en-US", {
      timeZone: "UTC",
    })
    : "N/A"
);

const lastUpdatedCampestre = computed(() =>
  lastSubmission("bosques", submissions)
    ? new Date(lastSubmission("bosques", submissions).timestamp).toLocaleString("en-US", {
      timeZone: "UTC",
    })
    : "N/A"
);

// State and Reactive Variables
const isPopupVisible = ref(false);
const selectedIngredient = ref(null);

/* ====== Section B: Functions for Component Logic ====== */

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