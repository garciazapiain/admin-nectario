<template>
  <div>
    <h1>Consumo de insumos</h1>
    <input type="date" v-model="startDate" :max="today" />
    <input type="date" v-model="endDate" :max="today" />
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <div>
      <h2>Seleccionar por semana</h2>
      <Dropdown v-model="selectedWeek" :options="weekOptions" defaultOption="{ value: '', label: 'Select Week' }"
        @change="updateDateRange" />
    </div>
    <table>
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Unidad</th>
          <th>Proveedor</th>
          <th>Consumido (Moral)</th>
          <th>Consumido (Bosques)</th>
          <th>Total consumido sin merma</th>
          <th>Total consumido real</th>
          <th>Precio / unidad</th>
          <th>$ Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredConsumptionData" :key="item.id_ingrediente">
          <td>{{ item.nombre }}</td>
          <td>{{ item.unidad }}</td>
          <td>{{ item.proveedor }}</td>
          <td>{{ item.total_consumido_moral.toFixed(2) }}</td>
          <td>{{ item.total_consumido_bosques.toFixed(2) }}</td>
          <td>{{ item.total_consumido_total.toFixed(2) }}</td>
          <td>{{ (item.total_consumido_total / (1 - Number(item.merma))).toFixed(2) }}</td>
          <td>$ {{ item.precio }}</td>
          <td>$ {{ ((item.total_consumido_total / (1 - Number(item.merma))) * item.precio).toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="button-container">
      <BaseButton bgColor="bg-violet-800" textColor="text-white" fontSize="text-base" @click="fetchConsumptionData">
        Obtener data</BaseButton>
      <BaseButton bgColor="bg-green-600" textColor="text-white" fontSize="text-base"
        v-if="filteredConsumptionData.length > 0">Exportar a
        Excel</BaseButton>
      <router-link :to="cargarVentasRoute">
        <BaseButton bgColor="bg-green-600" textColor="text-white" fontSize="text-base">Cargar ventas</BaseButton>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import BaseButton from "../../components/BaseButton.vue"
import Dropdown from "../../components/Dropdown.vue"
import useDateRange from "../../composables/ConsumoInsumos/useDateRange";
import useApi from "../../composables/shared/useApi";
import useExportToExcel from "../../composables/shared/useExportToExcel";
import API_URL from "../../config";
import { useRouter } from "vue-router";

/* ====== Section A: Core Declarations and State ====== */

// Core Data Management
const { weeks, startDate, endDate, selectedWeek, generateWeeks, updateDateRange } = useDateRange();
const { getData } = useApi(API_URL);
const { exportDataToExcel } = useExportToExcel();

// Computed properties
const router = useRouter();
const today = new Date().toISOString().split("T")[0];
const cargarVentasRoute = computed(() => `${router.currentRoute.value.path}/cargarventa`);
const filteredConsumptionData = computed(() =>
  consumptionData.value.sort((a, b) => b.total_consumido_dinero - a.total_consumido_dinero)
);
const weekOptions = computed(() =>
  weeks.value.map((week) => ({
    value: week.value,
    label: week.label,
  }))
);

// Reactive data
const consumptionData = ref([]);
const errorMessage = ref(null);

/* ====== Section B: Functions for Component Logic ====== */

// Initialization and Lifecycle
generateWeeks();

// API Interaction and State Modifiers
const fetchConsumptionData = async () => {
  errorMessage.value = null;

  if (!startDate.value || !endDate.value) {
    errorMessage.value = "Ambas fechas deben ser seleccionadas.";
    setTimeout(() => (errorMessage.value = null), 5000);
    return;
  }

  const stores = ["moral", "bosques"];
  const results = {};

  for (const store of stores) {
    const response = await getData(`/consumption/${store}`, {
      startDate: startDate.value,
      endDate: endDate.value,
    });
    if (response) results[store] = response;
  }

  consumptionData.value = processConsumptionData(results);

  if (consumptionData.value.length === 0) {
    errorMessage.value = "No se encontró data en esas fechas.";
    setTimeout(() => {
      errorMessage.value = null;
    }, 5000);
  }
};

// Utility/Helper Functions
const processConsumptionData = (results) => {
  const combinedData = [];
  if (results.moral && results.bosques) {
    for (const ingredient of results.moral) {
      const sameIngredientInBosques = results.bosques.find(
        (i) => i.id_ingrediente === ingredient.id_ingrediente
      );
      const total_consumido_moral = parseFloat(ingredient.total_consumido);
      const total_consumido_bosques = sameIngredientInBosques
        ? parseFloat(sameIngredientInBosques.total_consumido)
        : 0;
      const total_consumido_total = total_consumido_moral + total_consumido_bosques;

      combinedData.push({
        id_ingrediente: ingredient.id_ingrediente,
        nombre: ingredient.nombre,
        precio: ingredient.precio,
        unidad: ingredient.unidad,
        proveedor: ingredient.proveedor,
        producto_clave: ingredient.producto_clave,
        merma: ingredient.merma,
        total_consumido_moral,
        total_consumido_bosques,
        total_consumido_total,
        total_consumido_dinero: total_consumido_total * ingredient.precio,
      });
    }
  }
  return combinedData;
};

const exportToExcel = () => {
  const dataForExport = filteredConsumptionData.value.map((item) => ({
    Insumo: item.nombre,
    Unidad: item.unidad,
    Proveedor: item.proveedor,
    "Consumido (Moral)": item.total_consumido_moral.toFixed(2),
    "Consumido (Bosques)": item.total_consumido_bosques.toFixed(2),
    "Total consumido sin merma": item.total_consumido_total.toFixed(2),
    "Total consumido real": (item.total_consumido_total / (1 - Number(item.merma))).toFixed(2),
    "Precio / unidad": `$ ${item.precio}`,
    "$ Total": `$ ${((item.total_consumido_total / (1 - Number(item.merma))) * item.precio).toFixed(2)}`,
  }));

  exportDataToExcel(dataForExport, "consumo_insumos.xlsx");
};

</script>

<style scoped>
.button-container {
  display: flex;
  gap: 10px;
  /* Adjust the gap as needed */
}
</style>