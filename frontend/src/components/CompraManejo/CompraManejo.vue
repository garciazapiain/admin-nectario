<template>
  <div>
    <h1 className="mb-10">Gestión de Planeación de Compra</h1>
    <div v-if="!isLoaded" class="loading-message">Cargando datos...</div>
    <div v-else>
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

    <!-- Popup -->
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

// Group data by proveedor
const groupedByProveedor = computed(() => {
  return planeacionCompra.value.reduce((grouped, ingrediente) => {
    if (!grouped[ingrediente.proveedor]) {
      grouped[ingrediente.proveedor] = [];
    }
    grouped[ingrediente.proveedor].push(ingrediente);
    return grouped;
  }, {});
});

// Show popup with ingredient image or missing photo message
const showPopup = (ingrediente) => {
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

// Close popup manually
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

// Rename `sortedIngredientes` to `getSortedIngredientes`
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

// Fetch data on component mount
onMounted(() => {
  fetchPlaneacionCompra();
});
</script>
