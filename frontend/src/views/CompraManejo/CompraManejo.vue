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
                <span class="cursor-pointer" @click="openProveedorPopup(ingrediente)">☰</span>
              </td>
              <td>
                <input type="checkbox" :checked="ingrediente.ya_comprado" @change="toggleYaComprado(ingrediente)" />
              </td>
              <td :class="{ 'line-through text-gray-500': ingrediente.ya_comprado }">{{ ingrediente.nombre }}</td>
              <td :class="{ 'line-through text-gray-500': ingrediente.ya_comprado }">{{ ingrediente.surtir_moral }}</td>
              <td :class="{ 'line-through text-gray-500': ingrediente.ya_comprado }">{{ ingrediente.surtir_campestre }}
              </td>
              <td class="clickable-row"
                v-if="ingrediente.image_url || ingrediente.image_url_2 || ingrediente.proveedor_opcion_b">
                <span class="bg-blue-800 p-2 text-white cursor-pointer" @click="showPopup(ingrediente)">Foto</span>
              </td>
              <td v-else></td>
            </tr>
            <div v-if="proveedorPopupVisible" class="popup-overlay">
              <div class="popup">
                <h2 class="text-black">Cambiar Proveedor</h2>
                <select v-model="selectedProveedor" class="mb-5">
                  <option disabled value="">Selecciona un proveedor</option>
                  <option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.nombre">
                    {{ proveedor.nombre }}
                  </option>
                </select>
                <div class="flex justify-around">
                  <button class="bg-green-500 text-white py-2 px-4 rounded"
                    @click="confirmProveedorChange">Confirmar</button>
                  <button class="bg-red-500 text-white py-2 px-4 rounded" @click="closeProveedorPopup">Cancelar</button>
                </div>
              </div>
            </div>
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
              <p v-else>No image available for Opción A</p>
            </template>

            <!-- Second Slide -->
            <template v-if="currentImageIndex === 1">
              <h1 class="text-black">
                Opción B
                <span v-if="selectedPopupIngrediente?.proveedor_opcion_b">
                  ({{ selectedPopupIngrediente.proveedor_opcion_b }})
                </span>
              </h1>
              <img v-if="selectedPopupIngrediente?.image_url_2" :src="selectedPopupIngrediente.image_url_2"
                alt="Opción B" />
              <p v-else>No image available for Opción B</p>
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
            <button
              :disabled="currentImageIndex === 1 && !selectedPopupIngrediente?.image_url_2 && !selectedPopupIngrediente?.proveedor_opcion_b"
              @click="nextImage"
              :class="{ 'disabled-button': currentImageIndex === 1 && !selectedPopupIngrediente?.image_url_2 && !selectedPopupIngrediente?.proveedor_opcion_b }">
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
import useProveedores from '../../composables/shared/useProveedores';
import useDragAndDrop from '../../composables/CompraManejo/useDragAndDrop';
import usePlaneacionCompra from '../../composables/CompraManejo/usePlaneacionCompra';
import usePlaneacionComputed from '../../composables/CompraManejo/usePlaneacionComputed';

const showSummary = ref(false); // State to toggle views
const popupVisible = ref(false);
const selectedPopupIngrediente = ref(null); // Stores the selected ingredient for the popup
const currentImageIndex = ref(0); // Tracks the current image index in the slideshow

const {planeacionCompra, fetchPlaneacionCompra, isLoaded} = usePlaneacionCompra()

// Toggle between main view and summary view
const toggleView = () => {
  showSummary.value = !showSummary.value;
};

const {groupedByProveedor, moralOrders, bosquesOrders} = usePlaneacionComputed(planeacionCompra)

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
    (selectedPopupIngrediente.value?.image_url_2 || selectedPopupIngrediente.value?.proveedor_opcion_b)
  ) {
    currentImageIndex.value = 1;
  }
};

const prevImage = () => {
  if (currentImageIndex.value === 1) {
    currentImageIndex.value = 0;
  }
};

const { startDrag, handleDrop } = useDragAndDrop();

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

const proveedorPopupVisible = ref(false);
const selectedProveedor = ref(""); // Holds the selected proveedor id
const currentEditingIngrediente = ref(null); // Holds the ingrediente being edited

// Fetch all proveedores from the API
const { proveedores, fetchProveedores } = useProveedores();

// Open the popup and set the current editing ingrediente
const openProveedorPopup = (ingrediente) => {
  currentEditingIngrediente.value = ingrediente;
  selectedProveedor.value = ingrediente.proveedor; // Default to the current proveedor
  proveedorPopupVisible.value = true;
};

// Close the popup
const closeProveedorPopup = () => {
  proveedorPopupVisible.value = false;
  currentEditingIngrediente.value = null;
  selectedProveedor.value = "";
};

// Confirm the change and update the proveedor
const confirmProveedorChange = async () => {
  if (!selectedProveedor.value || !currentEditingIngrediente.value) {
    alert("Selecciona un proveedor válido.");
    return;
  }

  try {
    // Update the ingrediente's proveedor via API
    const updatedData = {
      ...currentEditingIngrediente.value,
      proveedor: selectedProveedor.value,
    };

    const response = await fetch(
      `${API_URL}/planeacion_compra/${currentEditingIngrediente.value.id_ingrediente}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      }
    );

    if (!response.ok) throw new Error("Error al actualizar el proveedor.");

    // Update local state
    currentEditingIngrediente.value.proveedor = selectedProveedor.value;

    // Close the popup
    closeProveedorPopup();
  } catch (error) {
    console.error("Error al cambiar el proveedor:", error);
    alert("Error al cambiar el proveedor.");
  }
};

// Fetch data when the component is mounted
onMounted(() => {
  fetchPlaneacionCompra();
  fetchProveedores(); // Fetch all proveedores
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
