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
      <div v-for="(ingredientes, proveedor) in groupedByProveedor" :key="proveedor" class="dropzone" @dragover.prevent
        @drop="() => handleDrop(proveedor)">
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
            <th>Entregado</th>
            <th>Nombre</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ingrediente in moralOrders" :key="ingrediente.id_ingrediente"
            :class="{ 'line-through text-gray-500': ingrediente.ya_entregado_moral }">
            <td>
              <input type="checkbox" :checked="ingrediente.ya_entregado_moral"
                @change="toggleEntregado(ingrediente, 'moral')" />
            </td>
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
            <th>Entregado</th>
            <th>Nombre</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ingrediente in bosquesOrders" :key="ingrediente.id_ingrediente"
            :class="{ 'line-through text-gray-500': ingrediente.ya_entregado_bosques }">
            <td>
              <input type="checkbox" :checked="ingrediente.ya_entregado_bosques"
                @change="toggleEntregado(ingrediente, 'bosques')" />
            </td>
            <td>{{ ingrediente.nombre }}</td>
            <td>{{ ingrediente.surtir_campestre }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Popup component -->
    <div v-if="popupVisible" class="popup-overlay">
      <div class="popup">
        <div v-if="popupImage">
          <img :src="popupImage" alt="Ingrediente Imagen" class="popup-image" />
          <button @click="closePopup" class="close-button">Cerrar</button>
        </div>
        <div v-else>
          <p>Falta foto para este producto.</p>
        </div>
      </div>
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

const showPopup = (ingrediente) => {
  console.log(ingrediente)
  if (ingrediente.image_url) {
    popupImage.value = ingrediente.image_url;
  } else {
    popupImage.value = null;
    setTimeout(() => {
      popupVisible.value = false;
    }, 1000);
  }
  popupVisible.value = true;
};

const closePopup = () => {
  popupVisible.value = false;
};

// Handle dragging logic
const startDrag = (ingrediente) => {
  draggedItem = ingrediente;
};

const handleDrop = async (targetProveedor) => {
  if (draggedItem && draggedItem.proveedor !== targetProveedor) {
    try {
      const updatedData = {
        ...draggedItem,
        proveedor: targetProveedor, // Update the proveedor to the new table's group
      };
      const response = await fetch(`${API_URL}/planeacion_compra/${draggedItem.id_ingrediente}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error(`Error ${response.status}: Failed to update proveedor`);
      // Reflect the change locally
      draggedItem.proveedor = targetProveedor;
      // Refresh data
      planeacionCompra.value = planeacionCompra.value.filter(
        (item) => item.id_ingrediente !== draggedItem.id_ingrediente
      );
      planeacionCompra.value.push(draggedItem);
      draggedItem = null;
    } catch (error) {
      console.error("Error updating proveedor:", error);
    }
  }
};

// Filtered and sorted orders for Moral
const moralOrders = computed(() =>
  planeacionCompra.value
    .filter((ingrediente) => ingrediente.surtir_moral && ingrediente.surtir_moral !== "0")
    .sort((a, b) => (a.ya_entregado_moral === b.ya_entregado_moral ? 0 : a.ya_entregado_moral ? 1 : -1))
);

// Filtered and sorted orders for Bosques
const bosquesOrders = computed(() =>
  planeacionCompra.value
    .filter((ingrediente) => ingrediente.surtir_campestre && ingrediente.surtir_campestre !== "0")
    .sort((a, b) => (a.ya_entregado_bosques === b.ya_entregado_bosques ? 0 : a.ya_entregado_bosques ? 1 : -1))
);

// Utility function to sort ingredientes
const getSortedIngredientes = (ingredientes) => {
  return ingredientes.slice().sort((a, b) => {
    if (a.ya_comprado && !b.ya_comprado) return 1; // Move `ya_comprado: true` to the bottom
    if (!a.ya_comprado && b.ya_comprado) return -1; // Keep `ya_comprado: false` at the top
    return 0; // Maintain order for items with the same status
  });
};

const toggleYaComprado = async (ingrediente) => {
  try {
    // Toggle the current value
    const newValue = !ingrediente.ya_comprado;
    const response = await fetch(`${API_URL}/planeacion_compra/${ingrediente.id_ingrediente}/toggle-comprado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ya_comprado: newValue }),
    })
    if (!response.ok) throw new Error(`Error ${response.status}: Failed to update ya_comprado`);
    // Update the local state
    ingrediente.ya_comprado = newValue;
  } catch (error) {
    console.error("Error updating ya_comprado:", error);
  }
}

// Function to toggle ya_entregado for a specific store
const toggleEntregado = async (ingrediente, store) => {
  try {
    // Determine the column to update
    const column =
      store === "moral" ? "ya_entregado_moral" : "ya_entregado_bosques";

    // Toggle the value locally
    ingrediente[column] = !ingrediente[column];

    // Update the API
    const response = await fetch(`${API_URL}/planeacion_compra/${ingrediente.id_ingrediente}/toggle-entregado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [column]: ingrediente[column] }),
    });

    if (!response.ok) throw new Error(`Failed to update ${column}`);
  } catch (error) {
    console.error("Error toggling ya_entregado:", error);
    alert("Error al actualizar el estado de entrega.");
  }
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

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.popup {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  position: relative;
}
.popup img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}
.popup p {
  font-size: 16px;
  color: gray;
}
.popup-image {
  max-width: 300px;
  max-height: 300px;
  object-fit: cover;
  border-radius: 8px;
}

</style>
