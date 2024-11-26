<template>
  <div>
    <h1 class="mb-10">Gestión de Planeación de Compra</h1>

    <!-- Button to toggle views -->
    <button @click="toggleView" class="mb-5 bg-blue-500 text-white py-2 px-4 rounded">
      {{ showSummary ? "Regresar a Proveedores" : "Ver Órdenes de Moral y Bosques" }}
    </button>

    <div v-if="!isLoaded" class="loading-message">Cargando datos...</div>

    <!-- Main grouped view -->
    <div v-else-if="!showSummary">
      <div v-for="(ingredientes, proveedor) in groupedByProveedor" :key="proveedor" class="dropzone"
        @dragover.prevent @drop="() => handleDrop(proveedor)">
        <h1 class="flex justify-start pl-3 bg-white text-black"> {{ proveedor }}</h1>
        <table class="table">
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th>Nombre</th>
              <th>Surtir Moral</th>
              <th>Surtir Bosques</th>
              <th>Ver Foto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ingrediente in getSortedIngredientes(ingredientes)" :key="ingrediente.id_ingrediente"
              draggable="true" @dragstart="startDrag(ingrediente)">
              <td>
                <span class="cursor-move">☰</span>
              </td>
              <td>
                <input type="checkbox" :checked="ingrediente.ya_comprado" @change="toggleYaComprado(ingrediente)" />
              </td>
              <td :class="{ 'line-through text-gray-500': ingrediente.ya_comprado }">{{ ingrediente.nombre }}</td>
              <td :class="{ 'line-through text-gray-500': ingrediente.ya_comprado }">{{ ingrediente.surtir_moral }}</td>
              <td :class="{ 'line-through text-gray-500': ingrediente.ya_comprado }">{{ ingrediente.surtir_campestre }}
              </td>
              <td class="clickable-row" v-if="ingrediente.image_url" @click="showPopup(ingrediente)">
                <span class="bg-blue-800 p-2 text-white cursor-pointer">Foto</span>
              </td>
              <td v-else></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Summary view -->
    <div v-else>
      <!-- Moral Table -->
      <h1 class="mb-5 bg-gray-200 text-black p-3">Órdenes Moral</h1>
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ingrediente in moralOrders" :key="ingrediente.id_ingrediente">
            <td>{{ ingrediente.nombre }}</td>
            <td>{{ ingrediente.surtir_moral }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Bosques Table -->
      <h1 class="mb-5 bg-gray-200 text-black p-3">Órdenes Campestre</h1>
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ingrediente in bosquesOrders" :key="ingrediente.id_ingrediente">
            <td>{{ ingrediente.nombre }}</td>
            <td>{{ ingrediente.surtir_campestre }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import API_URL from "../../config";

const planeacionCompra = ref([]);
const isLoaded = ref(false);
const showSummary = ref(false); // State to toggle views
const popupVisible = ref(false);
const popupImage = ref(null);
let draggedItem = null;

// Fetch data from the API
const fetchPlaneacionCompra = async () => {
  try {
    const response = await fetch(`${API_URL}/planeacion_compra`);
    if (!response.ok) throw new Error(`Error ${response.status}: Failed to fetch data`);
    planeacionCompra.value = await response.json();
    isLoaded.value = true;
  } catch (error) {
    console.error("Error fetching planeacion_compra:", error);
  }
};

// Toggle between main view and summary view
const toggleView = () => {
  showSummary.value = !showSummary.value;
};

// Computed property to group by proveedor
const groupedByProveedor = computed(() => {
  return planeacionCompra.value.reduce((grouped, ingrediente) => {
    if (!grouped[ingrediente.proveedor]) {
      grouped[ingrediente.proveedor] = [];
    }
    grouped[ingrediente.proveedor].push(ingrediente);
    return grouped;
  }, {});
});

// Filtered orders for Moral
const moralOrders = computed(() =>
  planeacionCompra.value.filter((ingrediente) => ingrediente.surtir_moral && ingrediente.surtir_moral !== "0")
);

// Filtered orders for Bosques
const bosquesOrders = computed(() =>
  planeacionCompra.value.filter((ingrediente) => ingrediente.surtir_campestre && ingrediente.surtir_campestre !== "0")
);

// Utility function to sort ingredientes
const getSortedIngredientes = (ingredientes) => {
  return ingredientes.slice().sort((a, b) => {
    if (a.ya_comprado && !b.ya_comprado) return 1; // Move `ya_comprado: true` to the bottom
    if (!a.ya_comprado && b.ya_comprado) return -1; // Keep `ya_comprado: false` at the top
    return 0; // Maintain order for items with the same status
  });
};

// Other existing functions: handleDrop, startDrag, toggleYaComprado, etc.
onMounted(() => {
  fetchPlaneacionCompra();
});
</script>

<style scoped>
.loading-message {
  font-size: 18px;
  color: gray;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.table th,
.table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.clickable-row {
  cursor: pointer;
}

.cursor-move {
  cursor: move;
}
</style>
