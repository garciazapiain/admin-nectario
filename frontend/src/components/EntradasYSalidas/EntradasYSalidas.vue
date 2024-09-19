<script setup>
import { ref } from "vue";
import API_URL from "../../config";

// Local storage admin check (Optional if needed for admin-specific logic)
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");

// Reactive variables for weeks and table data
const entradasSalidas = ref([]);
const weeks = ref([]);
const selectedWeek = ref(null);
const startDate = ref(null);
const endDate = ref(null);
const today = ref(new Date().toISOString().split('T')[0]);

// Modal visibility and form data
const showModal = ref(false);
const movimientoTipo = ref(null);
const origen = ref(null);
const destino = ref(null);
const cantidad = ref(null);
const currentEntrada = ref(null); // Tracks which row's action is being performed
// Function to generate weeks
const generateWeeks = () => {
  const weekOptions = [];
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  while (startOfYear.getDay() !== 1) {
    startOfYear.setDate(startOfYear.getDate() + 1);
  }

  const currentDate = new Date();

  while (startOfYear <= currentDate) {
    const weekStart = new Date(startOfYear);
    const weekEnd = new Date(startOfYear);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let label = weekStart.getDate() + " al " + weekEnd.getDate() + " de " + weekStart.toLocaleString('es-ES', { month: 'long' });

    weekOptions.push({
      value: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`,
      label: label
    });

    startOfYear.setDate(startOfYear.getDate() + 7);
  }

  weeks.value = weekOptions.reverse();
};

// Function to handle week range selection and update
const updateDateRange = () => {
  if (selectedWeek.value) {
    const [start, end] = selectedWeek.value.split('_');
    startDate.value = start;
    endDate.value = end;
  }
};

// Fetch "Entradas y Salidas" data for the selected week range
const fetchEntradasSalidas = async () => {
  try {
    const response = await fetch(`${API_URL}/entradas_salidas?startDate=${startDate.value}&endDate=${endDate.value}`);

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`);
      throw new Error('Failed to fetch');
    }

    const data = await response.json();
    entradasSalidas.value = data;
  } catch (error) {
    console.error('Failed to fetch Entradas y Salidas:', error);
  }
};

// Function to open modal for adding "Movimiento"
const openModal = (entrada) => {
  origen.value = null;
  destino.value = null;
  cantidad.value = null;
  currentEntrada.value = entrada;
  showModal.value = true;
};

// Handle submission of the form (send data to the backend)
const handleSubmit = async () => {
  const payload = {
    id_ingrediente: currentEntrada.value.id_ingrediente,
    movimientoTipo: "Movimiento", // Fixed movement type
    origen: origen.value,
    destino: destino.value,
    cantidad: cantidad.value,
    startDate: startDate.value,
    endDate: endDate.value
  };

  try {
    const response = await fetch(`${API_URL}/entradas_salidas/movimiento`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`);
      throw new Error('Failed to update movimiento');
    }

    console.log('Movimiento updated successfully');
    showModal.value = false; // Close the modal after successful submission
    fetchEntradasSalidas(); // Refresh data after the update
  } catch (error) {
    console.error('Failed to update movimiento:', error);
  }
};

const handleCerrar = async () => {
  showModal.value = false;
}

// Generate weeks on component mount
generateWeeks();
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4 text-white">Entradas y Salidas</h1>

    <!-- Week Selection Dropdown -->
    <div class="mb-6">
      <label class="text-white block font-semibold mb-2">Seleccionar por semana</label>
      <select v-model="selectedWeek" @change="updateDateRange"
        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300">
        <option v-for="week in weeks" :key="week.value" :value="week.value">
          {{ week.label }}
        </option>
      </select>
      <button @click="fetchEntradasSalidas"
        class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md">
        Obtener datos
      </button>
    </div>

    <!-- Data Table -->
    <table v-if="entradasSalidas.length > 0" class="">
      <thead>
        <tr class="bg-gray-100 border-b">
          <th class="py-2 px-4 text-left">Nombre</th>
          <th class="py-2 px-4 text-left">Unidad</th>
          <th class="py-2 px-4 text-left">CEDIS</th>
          <th class="py-2 px-4 text-left">Moral</th>
          <th class="py-2 px-4 text-left">Campestre</th>
          <th class="py-2 px-4 text-left">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entrada in entradasSalidas" :key="entrada.id_ingrediente" class="border-b">
          <td class="py-2 px-4">{{ entrada.nombre }}</td>
          <td class="py-2 px-4">{{ entrada.unidad }}</td>
          <td class="py-2 px-4">
            <div>Cantidad: {{ entrada.quantity_cedis }}</div>
            <button @click="openModal(entrada)"
              class="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md">Movimiento</button>
          </td>
          <td class="py-2 px-4">
            <div>Cantidad: {{ entrada.quantity_moral }}</div>
            <button @click="openModal(entrada)"
              class="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md">Movimiento</button>
          </td>
          <td class="py-2 px-4">
            <div>Cantidad: {{ entrada.quantity_campestre }}</div>
            <button @click="openModal(entrada)"
              class="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md">Movimiento</button>
          </td>
          <td class="py-2 px-4">{{ entrada.total_quantity }}</td>
        </tr>
      </tbody>
    </table>

    <p class="text-white mt-4" v-else>No hay datos para la semana seleccionada.</p>

    <!-- Modal for Movimiento -->
    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-80">
        <h3 class="text-xl font-bold mb-4 text-black">Movimiento de {{ currentEntrada?.nombre }}</h3>

        <!-- Origen Dropdown with Conditional Disabling -->
        <label class="block font-semibold mb-2">Origen:</label>
        <select v-model="origen"
          class="block w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring focus:ring-blue-300">
          <option value="CEDIS" :disabled="destino === 'CEDIS'">CEDIS</option>
          <option value="Moral" :disabled="destino === 'Moral'">Moral</option>
          <option value="Campestre" :disabled="destino === 'Campestre'">Campestre</option>
        </select>

        <!-- Destino Dropdown with Conditional Disabling -->
        <label class="block font-semibold mb-2">Destino:</label>
        <select v-model="destino"
          class="block w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring focus:ring-blue-300">
          <option value="CEDIS" :disabled="origen === 'CEDIS'">CEDIS</option>
          <option value="Moral" :disabled="origen === 'Moral'">Moral</option>
          <option value="Campestre" :disabled="origen === 'Campestre'">Campestre</option>
        </select>

        <label class="block font-semibold mb-2">Cantidad:</label>
        <input type="number" v-model="cantidad" :min="0.01"
          :max="origen === 'CEDIS' ? currentEntrada?.quantity_cedis : origen === 'Moral' ? currentEntrada?.quantity_moral : origen === 'Campestre' ? currentEntrada?.quantity_campestre : 0"
          class="block w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring focus:ring-blue-300" />
        <p v-if="cantidad > (origen === 'CEDIS' ? currentEntrada?.quantity_cedis : origen === 'Moral' ? currentEntrada?.quantity_moral : currentEntrada?.quantity_campestre)"
          class="text-red-500">
          La cantidad no puede exceder la cantidad disponible en {{ origen }}.
        </p>
        <p v-if="0 > cantidad"
          class="text-red-500">
          La cantidad no puede ser negativa.
        </p>

        <div class="flex justify-end">
          <button @click="handleSubmit"
            :disabled="cantidad > (origen === 'CEDIS' ? currentEntrada?.quantity_cedis : origen === 'Moral' ? currentEntrada?.quantity_moral : origen === 'Campestre' ? currentEntrada?.quantity_campestre : 0) || cantidad <0"
            class="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md mr-2 disabled:bg-gray-400 disabled:cursor-not-allowed">Guardar</button>
          <button @click="handleCerrar"
            class="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #000;
  padding: 10px;
}
</style>
