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

  // Adjust to the first Monday of the year
  while (startOfYear.getDay() !== 1) {
    startOfYear.setDate(startOfYear.getDate() + 1);
  }

  const currentDate = new Date();

  // Loop to generate weeks until the current date
  while (startOfYear <= currentDate) {
    const weekStart = new Date(startOfYear);
    const weekEnd = new Date(startOfYear);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Get month and day names for start and end dates
    const weekStartMonth = weekStart.toLocaleString('es-ES', { month: 'long' });
    const weekEndMonth = weekEnd.toLocaleString('es-ES', { month: 'long' });

    // Generate the label based on whether the week crosses into a new month
    let label;
    if (weekStartMonth !== weekEndMonth) {
      // If start and end are in different months, include both months in the label
      label = `${weekStart.getDate()} ${weekStartMonth} al ${weekEnd.getDate()} ${weekEndMonth}`;
    } else {
      // If within the same month, include the month only once at the end
      label = `${weekStart.getDate()} al ${weekEnd.getDate()} de ${weekStartMonth}`;
    }

    // Add the week option to the list
    weekOptions.push({
      value: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`,
      label: label
    });

    // Move to the next week
    startOfYear.setDate(startOfYear.getDate() + 7);
  }

  weeks.value = weekOptions.reverse(); // Reverse to show the latest weeks first
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
const fetchEntradasSalidasCompras = async () => {
  try {
    const response = await fetch(`${API_URL}/entradas_salidas/compras?startDate=${startDate.value}&endDate=${endDate.value}`);

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`);
      throw new Error('Failed to fetch');
    }

    const data = await response.json();
    entradasSalidas.value = data;
  } catch (error) {
    console.error('Failed to fetch Entradas y Salidas de compras:', error);
  }
};

const setMovimientoTipoAndSubmit = (tipo, entrada) => {
  currentEntrada.value = entrada;
  movimientoTipo.value = tipo;
  handleSubmit();
};

const setTransferModal = (entrada) => {
  currentEntrada.value = entrada;
  movimientoTipo.value = 'inventario_inicial_cedis_transfer';
  showModal.value = true;
};

// Function to open the modal and set the movement type
const openModal = (entrada, tipo) => {
  origen.value = null;
  destino.value = null;
  cantidad.value = null;
  currentEntrada.value = entrada;
  movimientoTipo.value = tipo;  // Set the tipo, e.g., 'Movimiento' or 'inventario_inicial_cedis_transfer'
  showModal.value = true;  // Show modal for input
};

// Update the submit function to be triggered only when the user submits data via the modal.
const handleSubmit = async () => {
  if (!currentEntrada.value || !movimientoTipo.value) {
    console.error('Data missing for submission');
    return;
  }

  const apiRoute = movimientoTipo.value === 'inventario_inicial_cedis_transfer'
    ? `${API_URL}/entradas_salidas/movimiento/inventario_inicial_cedis_transfer`
    : `${API_URL}/entradas_salidas/movimiento/transfers`;

  const payload = {
    id_ingrediente: currentEntrada.value.id_ingrediente,
    movimientoTipo: movimientoTipo.value,
    origen: origen.value,
    destino: destino.value,
    cantidad: cantidad.value,
    startDate: startDate.value,
    endDate: endDate.value,
  };

  try {
    const response = await fetch(apiRoute, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Error: ${response.statusText}`);
      resultMessage.value = 'Error al hacer movimiento';
      showResultModal.value = true;
      throw new Error('Failed to update movimiento');
    }

    console.log('Movimiento updated successfully');
    resultMessage.value = `Se transfirió exitósamente ${cantidad.value} ${currentEntrada.value.unidad} de ${origen.value} a ${destino.value} para el ingrediente ${currentEntrada.value.nombre}.`;
    showResultModal.value = true;
    showModal.value = false; // Close the input modal
    fetchEntradasSalidasCompras(); // Refresh data after update
  } catch (error) {
    console.error('Failed to update movimiento:', error);
    resultMessage.value = 'Error al hacer movimiento';
    showResultModal.value = true;
    handleCerrar()
  }
};

const handleCerrar = async () => {
  showModal.value = false;
}

const showResultModal = ref(false);
const resultMessage = ref('');

// Generate weeks on component mount
generateWeeks();
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4 text-white">Entradas y Salidas</h1>
    <!-- Result Modal -->
    <div v-if="showResultModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-80">
        <h3 class="text-xl font-bold mb-4 text-black">{{ resultMessage }}</h3>
        <div class="flex justify-end">
          <button @click="showResultModal = false"
            class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md">Cerrar</button>
        </div>
      </div>
    </div>
    <!-- Week Selection Dropdown -->
    <div class="mb-6">
      <label class="text-white block font-semibold mb-2">Seleccionar por semana</label>
      <select v-model="selectedWeek" @change="updateDateRange"
        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300">
        <option v-for="week in weeks" :key="week.value" :value="week.value">
          {{ week.label }}
        </option>
      </select>
      <button @click="fetchEntradasSalidasCompras"
        class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md">
        Obtener datos
      </button>
    </div>

    <!-- Data Table -->
    <table v-if="entradasSalidas.length > 0">
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
            <div>Inventario Inicial: {{ entrada.inventario_inicial_cedis }}</div>

            <!-- Show 'Transferir Inventario Inicial' button only if inventario_inicial_cedis > 0 -->
            <button v-if="entrada.inventario_inicial_cedis > 0" @click="setTransferModal(entrada)"
              class="mt-2 bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md">
              Transferir Inventario Inicial
            </button>

            <!-- Show 'Movimiento' button only if inventario_inicial_cedis <= 0 -->
            <button v-else @click="openModal(entrada, 'Movimiento')"
              class="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md">
              Movimiento
            </button>

            <div>Entradas: {{ Number(entrada.quantity_cedis || 0).toFixed(2) }}</div>
          </td>
          <td class="py-2 px-4">
            <!-- <div>Inventario Inicial: {{ entrada.inventario_inicial_moral }}</div> -->
            <div>Entradas: {{ Number(entrada.quantity_moral) +
              Number(entrada.transfers_inventario_inicial_cedis_a_moral) }}</div>
            <button @click="openModal(entrada, 'Movimiento')"
              class="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md">
              Movimiento
            </button>
          </td>
          <td class="py-2 px-4">
            <!-- <div>Inventario Inicial: {{ entrada.inventario_inicial_bosques }}</div> -->
            <div>Entradas: {{ Number(entrada.quantity_campestre) +
              Number(entrada.transfers_inventario_inicial_cedis_a_bosques) }}</div>
            <button @click="openModal(entrada, 'Movimiento')"
              class="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md">Movimiento</button>
          </td>
          <td class="py-2 px-4">{{ Number(entrada.total_quantity) +
            Number(entrada.transfers_inventario_inicial_cedis_a_bosques) +
            Number(entrada.transfers_inventario_inicial_cedis_a_moral) }}</td>
        </tr>
      </tbody>
    </table>

    <p class="text-white mt-4" v-else>No hay datos para la semana seleccionada.</p>

    <!-- Modal for Movimiento -->
    <div v-if="showModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-80">
        <h3 class="text-xl font-bold mb-4 text-black">Movimiento de {{ currentEntrada?.nombre }}</h3>

        <!-- Origen Dropdown -->
        <label class="flex font-semibold mb-2 text-black">Origen:</label>
        <select v-model="origen"
          class="flex justify-start w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring focus:ring-blue-300">
          <option value="CEDIS" :disabled="destino === 'CEDIS'">CEDIS</option>
          <option value="Moral" :disabled="destino === 'Moral'">Moral</option>
          <option value="Campestre" :disabled="destino === 'Campestre'">Campestre</option>
        </select>

        <!-- Destino Dropdown -->
        <label class="flex justify-start font-semibold mb-2 text-black">Destino:</label>
        <select v-model="destino"
          class="block w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring focus:ring-blue-300">
          <option value="CEDIS" :disabled="origen === 'CEDIS'">CEDIS</option>
          <option value="Moral" :disabled="origen === 'Moral'">Moral</option>
          <option value="Campestre" :disabled="origen === 'Campestre'">Campestre</option>
        </select>

        <!-- Cantidad Input -->
        <label class="flex justify-start font-semibold mb-2 text-black">Cantidad:</label>
        <div class="flex">
          <input type="number" v-model="cantidad" :min="0.01" :max="availableInventory"
            class="block w-1/4 px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring focus:ring-blue-300" />
          <p class="text-black text-xl text-bold">{{ currentEntrada.unidad }}</p>
        </div>

        <!-- Error Messages -->
        <p v-if="cantidad > availableInventory" class="text-red-500">
          La cantidad no puede exceder la cantidad disponible en {{ origen }}.
        </p>
        <p v-if="0 > cantidad" class="text-red-500">
          La cantidad no puede ser negativa.
        </p>

        <!-- Modal Buttons -->
        <div class="flex justify-end">
          <button @click="handleSubmit" :disabled="cantidad > availableInventory || cantidad <= 0"
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

.fixed {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-opacity-50 {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
