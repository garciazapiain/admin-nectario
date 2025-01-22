<template>
  <div>
    <h1>Cargar Ventas</h1>
    <input type="file" @change="handleFileChange" />
    <div v-if="items.length">
      <label for="store">Store:</label>
      <Dropdown v-model="store" :options="storeOptions" defaultOption="{ value: '', label: 'Select Store' }" />
      <label for="startDate">Start Date:</label>
      <input type="date" id="startDate" v-model="startDate" :max="today" />
      <label for="endDate">End Date:</label>
      <input type="date" id="endDate" v-model="endDate" :min="startDate" :max="today" />
      <h2>Seleccionar por semana</h2>
      <Dropdown v-model="selectedWeek" :options="weekOptions" defaultOption="{ value: '', label: 'Select Week' }"
        @change="updateDateRange" />
      <BaseButton bgColor="bg-green-600" textColor="text-white" fontSize="text-base" @click="saveSalesData">Guardar Data
      </BaseButton>
    </div>
    <table v-if="items.length">
      <thead>
        <tr>
          <th>Clave</th>
          <th>Descripcion</th>
          <th>Cantidad</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.clavepos">
          <td>{{ item.clavepos }}</td>
          <td>{{ item.descripcion }}</td>
          <td>{{ item.cantidad }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import BaseButton from "../../components/BaseButton.vue"
import Dropdown from "../../components/Dropdown.vue"
import useDateRange from "../../composables/ConsumoInsumos/useDateRange";
import useFileUpload from "../../composables/ConsumoInsumos/useFileUpload";
import useApi from "../../composables/shared/useApi";
import API_URL from "../../config";
import { computed, onMounted, ref } from "vue";

/* ====== Section A: Core Declarations and State ====== */

// Core Data Management
const { weeks, startDate, endDate, selectedWeek, generateWeeks, updateDateRange } = useDateRange()
const { items, parseExcelFile } = useFileUpload();
const { postData } = useApi(API_URL);

// Computed Properties
const weekOptions = computed(() =>
  weeks.value.map((week) => ({
    value: week.value,
    label: week.label,
  }))
)

/* ====== Section B: Functions for Component Logic ====== */

// Initialization and Lifecycle
generateWeeks();

// State and Reactive Variables
const store = ref("");
const storeOptions = [
  { value: "moral", label: "Moral" },
  { value: "bosques", label: "Bosques" },
];
const today = new Date().toISOString().split("T")[0];

// Initialization and Lifecycle
onMounted(() => {
  generateWeeks();
});

// Utility/Helper Functions
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    parseExcelFile(file); // Call composable function to parse Excel file
  }
};

// API Interaction and State Modifiers
const saveSalesData = async () => {
  if (!store.value || !startDate.value || !endDate.value || !items.value.length) {
    alert("Please fill all fields and upload an Excel file before logging data.");
    return;
  }

  const payload = {
    store: store.value,
    startDate: startDate.value,
    endDate: endDate.value,
    items: items.value,
  };

  const response = await postData("/consumption/cargarventas", payload);

  if (response) alert("Data successfully inserted");
};

</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
}

th {
  background-color: #2e970b;
}

h2 {
  margin-top: 20px;
}
</style>
