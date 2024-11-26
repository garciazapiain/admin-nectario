<template>
  <div>
    <h1>Gestión de Planeación de Compra</h1>
    <div v-if="!isLoaded" class="loading-message">Cargando datos...</div>
    <div v-else>
      <div v-for="(ingredientes, proveedor) in groupedByProveedor" :key="proveedor">
        <!-- Headline for each proveedor -->
        <h2>{{ proveedor }}</h2>
        <!-- Table for each proveedor -->
        <table class="table">
          <thead>
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Surtir Moral</th>
              <th>Surtir Bosques</th>
              <th>Ver foto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ingrediente in ingredientes" :key="ingrediente.id_ingrediente">
              <td>
                <input type="checkbox" :checked="ingrediente.ya_comprado" @change="toggleYaComprado(ingrediente)" />
              </td>
              <td :class="{ 'line-through text-gray-500': ingrediente.ya_comprado }">{{ ingrediente.nombre }}</td>
              <td :class="{ 'line-through text-gray-500': ingrediente.ya_comprado }">{{ ingrediente.surtir_moral }}</td>
              <td :class="{ 'line-through text-gray-500': ingrediente.ya_comprado }">{{ ingrediente.surtir_campestre }}
              </td>
              <td class="clickable-row" v-if="ingrediente.image_url" @click="showPopup(ingrediente)">
                <span class="bg-blue-800 p-2 text-white cursor-pointer">Ver foto</span>
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
    });

    if (!response.ok) throw new Error(`Error ${response.status}: Failed to update ya_comprado`);

    // Update the local state
    ingrediente.ya_comprado = newValue;
  } catch (error) {
    console.error("Error updating ya_comprado:", error);
  }
};


// Fetch data on component mount
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
