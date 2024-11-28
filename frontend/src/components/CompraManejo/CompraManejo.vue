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
        @drop="(event) => handleDrop(proveedor, event)" @touchend="(event) => handleDrop(proveedor, event)">
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
              draggable="true" @dragstart="(event) => startDrag(ingrediente, event)"
              @touchstart="(event) => startDrag(ingrediente, event)">
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
              <td class="clickable-row" v-if="ingrediente.image_url || ingrediente.image_url_2">
                <span class="bg-blue-800 p-2 text-white cursor-pointer" @click="showPopup(ingrediente)">Foto</span>
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

    <!-- Popup Component -->
    <div v-if="popupVisible" class="popup-overlay">
      <div class="popup">
        <button class="close-button" @click="closePopup">X</button>
        <div class="slideshow-container">
          <div class="image-container">
            <!-- First Image -->
            <template v-if="currentImageIndex === 0">
              <h1 class="text-black">Opción A</h1>
              <img v-if="selectedPopupIngrediente?.image_url" :src="selectedPopupIngrediente.image_url"
                alt="Opción A" />
            </template>

            <!-- Second Image -->
            <template v-if="currentImageIndex === 1 && selectedPopupIngrediente?.image_url_2">
              <h1 class="text-black">Opción B {{ selectedPopupIngrediente?.proveedor_opcion_b }}</h1>
              <img :src="selectedPopupIngrediente.image_url_2" alt="Opción B" />
            </template>
          </div>

          <!-- Navigation Buttons -->
          <div class="navigation-buttons">
            <!-- Previous Button -->
            <button :disabled="currentImageIndex === 0" @click="prevImage"
              :class="{ 'disabled-button': currentImageIndex === 0 }">
              ◀
            </button>

            <!-- Next Button -->
            <button :disabled="currentImageIndex === 1 || !selectedPopupIngrediente.image_url_2" @click="nextImage"
              :class="{ 'disabled-button': currentImageIndex === 1 || !selectedPopupIngrediente.image_url_2 }">
              ▶
            </button>
          </div>
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
let draggedItem = null;
const selectedPopupIngrediente = ref(null); // Stores the selected ingredient for the popup
const currentImageIndex = ref(0); // Tracks the current image index in the slideshow


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
  selectedPopupIngrediente.value = ingrediente;
  currentImageIndex.value = 0; // Start with the first image
  popupVisible.value = true;
};

const closePopup = () => {
  popupVisible.value = false;
  selectedPopupIngrediente.value = null;
};

const nextImage = () => {
  if (
    currentImageIndex.value === 0 &&
    selectedPopupIngrediente.value?.image_url_2
  ) {
    currentImageIndex.value = 1;
  }
};

const prevImage = () => {
  if (currentImageIndex.value === 1) {
    currentImageIndex.value = 0;
  }
};

const enableMobileDrag = false; // Flag to toggle mobile implementation

const startDrag = (ingrediente, event) => {
  draggedItem = ingrediente;

  // For touch devices
  if (event.type === "touchstart") {
    console.log("Mobile drag detected, but it's currently disabled.");
    if (!enableMobileDrag) return; // Skip execution for mobile drag
    event.preventDefault(); // Prevent scrolling
    const touch = event.touches[0];
    draggedItem.touchX = touch.clientX;
    draggedItem.touchY = touch.clientY;
  }
};

const handleDrop = async (targetProveedor, event) => {
  // Prevent default for touch and drag events
  if (event.type === "touchend") {
    console.log("Mobile drop detected, but it's currently disabled.");
    if (!enableMobileDrag) return; // Skip execution for mobile drop
    event.preventDefault();
    const touch = event.changedTouches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    // Check if the drop occurred within the target drop zone
    const dropZone = event.target.closest(".dropzone");
    if (!dropZone) {
      console.warn("Touch did not occur within a valid drop zone.");
      return;
    }
  }

  // Existing desktop drag-and-drop logic
  if (draggedItem && draggedItem.proveedor !== targetProveedor) {
    try {
      const updatedData = {
        ...draggedItem,
        proveedor: targetProveedor,
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

<script>
export default {
  props: {
    ingrediente: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      currentImageIndex: 0, // Default to the first image
    };
  },
  methods: {
    nextImage() {
      // Go to the next image only if it's the second one and exists
      if (this.currentImageIndex < 1 && this.ingrediente.image_url_2) {
        this.currentImageIndex++;
      }
    },
    prevImage() {
      // Go back to the first image if currently on the second
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
      }
    },
  },
};
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

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.navigation-buttons button {
  padding: 5px 10px;
  font-size: 16px;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.navigation-buttons button:hover:not(.disabled-button) {
  background-color: #45a049;
}

.navigation-buttons button.disabled-button {
  background-color: #cccccc;
  /* Light gray for disabled state */
  cursor: not-allowed;
}

</style>
