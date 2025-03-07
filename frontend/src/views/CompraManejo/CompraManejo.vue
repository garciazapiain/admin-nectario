<template>
  <div>
    <h1 class="mb-10">Gestión de Planeación de Compra</h1>
    <!-- Button to toggle views -->
    <BaseButton v-if="isAdmin" @click="toggleView" bgColor="bg-violet-800" textColor="text-white" fontSize="text-lg">
      {{ showSummary ? "Regresar a Proveedores" : "Ver Órdenes de Moral y Bosques" }}
    </BaseButton>
    <div v-if="!isLoaded" class="loading-message">Cargando datos...</div>
    <!-- Main grouped view -->
    <div v-else-if="!showSummary">
      <div v-for="(ingredientes, proveedor) in groupedByProveedor" :key="proveedor" class="dropzone" @dragover.prevent
        @drop="(event) => handleDrop(proveedor, event)" @touchend="(event) => handleDrop(proveedor, event)">
        <h2 class="flex justify-start pl-3 bg-white text-black"> {{ proveedor }}</h2>
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
                <span class="cursor-pointer" @click.stop="openProveedorPopup(ingrediente)">☰</span>
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
                <span class="bg-violet-800 p-2 text-white cursor-pointer" @click="showPopup(ingrediente)">Foto</span>
              </td>
              <td v-else></td>
            </tr>
            <div v-if="isDropdownVisible" class="popup-overlay" @click="closeDropdown">
              <div class="popup" @click.stop>
                <h2 class="text-black">Cambiar Proveedors</h2>
                <Dropdown v-model="selectedValue"
                  :options="proveedores.map(proveedor => ({ value: proveedor.nombre, label: proveedor.nombre }))"
                  :defaultOption="{ value: '', label: 'Selecciona un proveedor' }" :required="true" />
                <div class="flex justify-around">
                  <button @click="confirmProveedorChange(currentEditingIngrediente, selectedValue, closeDropdown)"
                    class="bg-green-500 text-white py-2 px-4 rounded">Confirmar</button>
                  <button class="bg-red-500 text-white py-2 px-4 rounded" @click="closeDropdown">Cancelar</button>
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
        <button class="close-button" @click="closePopupAndResetImage">X</button>
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
            <button :disabled="currentImageIndex == 0" @click="prevImage(currentImageIndex === 1)"
              :class="{ 'disabled-button': currentImageIndex === 0 }">
              ◀
            </button>
            <!-- Next Button -->
            <button :disabled="currentImageIndex == 1"
              @click="nextImage(currentImageIndex === 0 && (selectedPopupIngrediente?.image_url_2 || selectedPopupIngrediente?.proveedor_opcion_b))"
              :class="{ 'disabled-button': currentImageIndex == 1 }">
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import API_URL from "../../config";
import BaseButton from "../../components/BaseButton.vue";
import Dropdown from "../../components/Dropdown.vue";
import useProveedores from '../../composables/shared/useProveedores';
import usePopup from '../../composables/shared/usePopup';
import useDragAndDrop from '../../composables/CompraManejo/useDragAndDrop';
import usePlaneacionCompra from '../../composables/CompraManejo/usePlaneacionCompra';
import usePlaneacionComputed from '../../composables/CompraManejo/usePlaneacionComputed';
import useImageNavigation from '../../composables/shared/useImageNavigation';
import useToggleApi from '../../composables/shared/useToggleApi';
import useDropdown from "../../composables/shared/useDropdown";
import useSorting from "../../composables/shared/useSorting";
import usePlaneacionActions from "../../composables/CompraManejo/usePlaneacionActions";

/* ====== Section A: Core Declarations and State ====== */

// Core Data Management
const { planeacionCompra, fetchPlaneacionCompra, isLoaded } = usePlaneacionCompra()
const { proveedores, fetchProveedores } = useProveedores();
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");

// Computed Properties
const { groupedByProveedor, moralOrders, bosquesOrders } = usePlaneacionComputed(planeacionCompra)

// View Toggles
const showSummary = ref(false); // State to toggle views
const { popupVisible, selectedItem: selectedPopupIngrediente, showPopup, closePopup } = usePopup();
const { isDropdownVisible, selectedValue, toggleDropdown, selectOption, closeDropdown } = useDropdown();

// Navigation and Drag-and-Drop
const {
  currentImageIndex,
  nextImage,
  prevImage,
  resetImageIndex,
} = useImageNavigation();
const { startDrag, handleDrop } = useDragAndDrop();

// Sorting and Utilities
const { sortItems, defaultComparator } = useSorting();
const getSortedIngredientes = (ingredientes) => {
  return sortItems(ingredientes, defaultComparator);
};
const { isLoading, toggleApiState } = useToggleApi(API_URL);

// Helper Functions
const toggleView = () => {
  if (!isAdmin.value) return;
  showSummary.value = !showSummary.value;
};

/* ====== Section B: Functions for Component Logic ====== */

// Initialization and Lifecycle
onMounted(() => {
  fetchPlaneacionCompra();
  fetchProveedores();
  if (!isAdmin.value) {
    showSummary.value = true;
  }
});

// State and Reactive Variables
const currentEditingIngrediente = ref(null); // Holds the ingrediente being edited

// Utility/Helper Functions
const closePopupAndResetImage = () => {
  closePopup(); // Close the popup
  resetImageIndex(); // Reset the image index
};

// API Interaction and State Modifiers
const { toggleYaComprado, toggleEntregado, confirmProveedorChange } = usePlaneacionActions(API_URL);

// Popup/Dropdown and Interaction Logic
const openProveedorPopup = (ingrediente) => {
  currentEditingIngrediente.value = ingrediente;
  selectedValue.value = ingrediente.proveedor; // Default to the current proveedor
  toggleDropdown(); // Show the dropdown
};
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
