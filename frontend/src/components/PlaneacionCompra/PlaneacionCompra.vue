<template>
  <div v-if="!isReady" class="loading-message">
    Cargando página...
  </div>
  <div v-else>
    <h1>Planeación de Compras{{ userName === 'moral' ? ' - Moral' : userName === 'campestre' ? ' - Campestre' : '' }}
    </h1>
    <!-- Selected Ingredients (Planeación de Compra) -->
    <div class="planeacion-container">
      <h2 class="text-xl">Ingredientes Seleccionados</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th v-if="isAdmin">Proveedor</th>
              <th v-if="userName === 'moral' || isAdmin">Surtir Moral</th>
              <th v-if="userName === 'campestre' || isAdmin">Surtir Campestre</th>
              <th>Eliminar</th>
              <th v-if="isAdmin">Pronóstico Demanda</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in filteredPlaneacionCompra" :key="index">
              <td className="text-lg">{{ item.nombre }}</td>
              <td v-if="isAdmin" data-label="Proveedor">
                <select v-model="item.proveedor" class="editable-dropdown">
                  <option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.nombre">
                    {{ proveedor.nombre }}
                  </option>
                </select>
              </td>
              <td class="cantidad-text" v-if="userName === 'moral' || isAdmin" data-label="Cantidad Moral">
                <input type="text" v-model="item.surtirMoral" @input="markAsModified(item)" class="editable-input" />
              </td>
              <td class="cantidad-text" v-if="userName === 'campestre' || isAdmin" data-label="Cantidad Campestre">
                <input type="text" v-model="item.surtirCampestre" @input="markAsModified(item)"
                  class="editable-input" />
              </td>
              <td data-label="">
                <button class="button-remove" @click="removeFromPlaneacion(index)">Eliminar</button>
              </td>
              <td v-if="isAdmin" data-label="Pronóstico Demanda">
                <button v-if="item.moral_demanda_semanal || item.bosques_demanda_semanal" class="bg-blue-600"
                  @click="openPopup(item)">
                  Pronóstico
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="button-container">
          <!-- Guardar Planeación -->
          <button class="button-submit" @click="submitPlaneacionCompra">
            <i class="fa fa-save"></i> Guardar
          </button>

          <!-- Exportar a WhatsApp -->
          <button class="button-whatsapp" @click="exportToWhatsApp">
            <i class="fa fa-whatsapp"></i> WhatsApp
          </button>
        </div>
        <button v-if="isAdmin" class="button-clear" @click="clearPlaneacionCompra">
          Limpiar Planeación de Compra
        </button>
      </div>
    </div>
    <!-- Search Bar -->
    <div class="search-container">
      <input v-model="searchTerm" placeholder="🔍 Buscar ingrediente..." class="search-bar" />
    </div>
    <!-- List of All Ingredients -->
    <div class="ingredients-container">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Unidad</th>
            <th v-if="isAdmin">Proveedor</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ingrediente in filteredIngredients" :key="ingrediente.id_ingrediente">
            <td>{{ ingrediente.nombre }}</td>
            <td>{{ ingrediente.unidad }}</td>
            <td v-if="isAdmin">{{ ingrediente.proveedor }}</td>
            <td>
              <div>
                <input v-if="userName === 'moral' || isAdmin" type="text" placeholder="Cantidad Moral"
                  v-model="ingrediente.tempSurtirMoral" class="editable-input" />
                <input v-if="userName === 'campestre' || isAdmin" type="text" placeholder="Cantidad Campestre"
                  v-model="ingrediente.tempSurtirCampestre" class="editable-input" />
                <button class="button-add" @click="addToPlaneacion(ingrediente)">Agregar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <PopupInsumo v-if="isPopupVisible" :ingrediente="selectedIngredient" @close="closePopup" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import API_URL from "../../config";
import PopupInsumo from "../Existencias/PopupInsumo.vue";

const isReady = ref(false);
const ingredientes = ref([]);
const planeacionCompra = ref([]);
const searchTerm = ref("");
const proveedores = ref([]); // List of providers
const isPopupVisible = ref(false); // Controls popup visibility
const selectedIngredient = ref(null); // Stores the selected ingredient for the popup
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");
const userName = ref(localStorage.getItem("userName"))

/**
 * Fetch all ingredients from the API on component mount
 */
const fetchIngredients = async () => {
  try {
    const response = await fetch(`${API_URL}/ingredientes`);
    if (!response.ok) throw new Error(`Error ${response.status}: Failed to fetch ingredients`);
    ingredientes.value = await response.json();
    isReady.value = true;
  } catch (error) {
    console.error("Error fetching ingredients:", error);
  }
};

/**
 * Fetch all planeacion_compra data
 */
const fetchPlaneacionCompra = async () => {
  try {
    const response = await fetch(`${API_URL}/planeacion_compra`);
    if (!response.ok) throw new Error(`Error ${response.status}: Failed to fetch planeacion_compra`);
    const data = await response.json();

    // Populate planeacionCompra with API data
    planeacionCompra.value = data.map((item) => ({
      id_ingrediente: item.id_ingrediente,
      nombre: item.nombre,
      proveedor: item.proveedor,
      surtirMoral: item.surtir_moral || "", // Use existing value or default to empty string
      surtirCampestre: item.surtir_campestre || "", // Use existing value or default to empty string
      moral_demanda_semanal: item.moral_demanda_semanal,
      bosques_demanda_semanal: item.bosques_demanda_semanal,
      proveedor_opcion_b: item.proveedor_opcion_b,
      image_url: item.image_url,
      image_url_2: item.image_url_2,
      added_moral: item.added_moral,
      added_campestre: item.added_campestre
    }));
    console.log("PlaneacionCompra loaded:", planeacionCompra.value);
  } catch (error) {
    console.error("Error fetching planeacion_compra:", error);
  }
};

/**
 * Fetch all proveedores data
 */
const fetchProveedores = async () => {
  try {
    const response = await fetch(`${API_URL}/proveedores`);
    if (!response.ok) throw new Error(`Error ${response.status}: Failed to fetch proveedores`);
    proveedores.value = await response.json();
  } catch (error) {
    console.error("Error fetching proveedores:", error);
  }
};

/**
 * Add an ingredient to the planeacionCompra array
 */
const addToPlaneacion = (ingrediente) => {
  const existingItem = planeacionCompra.value.find(
    (item) => item.id_ingrediente === ingrediente.id_ingrediente
  );

  const surtirMoralValue = ingrediente.tempSurtirMoral || ""; // Default to empty string if not provided
  const surtirCampestreValue = ingrediente.tempSurtirCampestre || ""; // Default to empty string if not provided

  if (existingItem) {
    existingItem.isModified = true;
    existingItem.proveedor = ingrediente.proveedor || existingItem.proveedor;
    existingItem.surtirMoral = surtirMoralValue || existingItem.surtirMoral;
    existingItem.surtirCampestre = surtirCampestreValue || existingItem.surtirCampestre;
    existingItem.added_moral = userName.value === 'moral' || isAdmin.value;
    existingItem.added_campestre = userName.value === 'campestre' || isAdmin.value;
  } else {
    planeacionCompra.value.push({
      id_ingrediente: ingrediente.id_ingrediente,
      nombre: ingrediente.nombre,
      proveedor: ingrediente.proveedor || "",
      surtirMoral: surtirMoralValue,
      surtirCampestre: surtirCampestreValue,
      image_url: ingrediente.image_url,
      image_url_2: ingrediente.image_url_2,
      moral_demanda_semanal: Number(ingrediente.moral_demanda_semanal),
      bosques_demanda_semanal: Number(ingrediente.bosques_demanda_semanal),
      proveedor_opcion_b: ingrediente.proveedor_opcion_b,
      added_moral: userName.value === 'moral' || isAdmin.value,
      added_campestre: userName.value === 'campestre' || isAdmin.value,
      isModified: true,
    });
  }

  // Clear temporary fields after adding
  ingrediente.tempSurtirMoral = "";
  ingrediente.tempSurtirCampestre = "";
};


/**
 * Remove an ingredient from the planeacionCompra array
 */
const removeFromPlaneacion = async (index) => {
  const itemToRemove = planeacionCompra.value[index];

  try {
    const response = await fetch(`${API_URL}/planeacion_compra/${itemToRemove.id_ingrediente}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName: userName.value, // Pass the current userName (moral or campestre)
      }),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: Failed to delete item`);
    }

    const result = await response.json();
    // Remove item from local state if fully deleted
    if (result.message === 'Item successfully deleted') {
      planeacionCompra.value.splice(index, 1);
    } else {
      // Update local state for updated items
      planeacionCompra.value[index] = result.item;
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Error al eliminar el elemento.');
  }
};

// Exclude ingredients already in planeacionCompra with added flags as true
const filteredIngredients = computed(() => {
  // Filter ingredients based on the search term
  let filtered = ingredientes.value;

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter((ingrediente) =>
      ingrediente.nombre.toLowerCase().includes(term)
    );
  }

  // Filter logic for existing items
  filtered = filtered.filter((ingrediente) => {
    const existingItem = planeacionCompra.value.find(
      (item) => item.id_ingrediente === ingrediente.id_ingrediente
    );

    // Admins: Ignore added_moral and added_campestre flags
    if (isAdmin.value) {
      return !existingItem || (existingItem.added_campestre === false);
    }

    // Moral User: Filter out items already added by moral
    if (userName.value === 'moral') {
      return !existingItem || !existingItem.added_moral;
    }

    // Campestre User: Filter out items already added by campestre
    if (userName.value === 'campestre') {
      return !existingItem || !existingItem.added_campestre;
    }

    // Default fallback
    return false;
  });

  // Filter out items where `orden_inventario` is null
  filtered = filtered.filter((ingrediente) => ingrediente.orden_inventario !== null);

  // Sort by `orden_inventario` in ascending order
  return filtered.sort((a, b) => a.orden_inventario - b.orden_inventario);
});

const markAsModified = (item) => {
  item.isModified = true;
};

/**
 * Submit Planeacion Compra to the API
 */
const submitPlaneacionCompra = async () => {
  try {
    const itemsToSubmit = planeacionCompra.value.filter((item) => item.isModified);

    for (const item of itemsToSubmit) {
      const payload = {
        id_ingrediente: item.id_ingrediente,
        nombre: item.nombre,
        proveedor: item.proveedor,
        surtirMoral: item.surtirMoral || null, // Explicitly include these fields
        surtirCampestre: item.surtirCampestre || null,
        image_url: item.image_url,
        image_url_2: item.image_url_2,
        moral_demanda_semanal: item.demandaMoral,
        bosques_demanda_semanal: item.demandaBosques,
        proveedor_opcion_b: item.proveedor_opcion_b,
        added_moral: item.added_moral,
        added_campestre: item.added_campestre,
        userName: userName.value,
      };

      const checkResponse = await fetch(`${API_URL}/planeacion_compra/${item.id_ingrediente}`);

      if (checkResponse.status === 404) {
        await fetch(`${API_URL}/planeacion_compra`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${API_URL}/planeacion_compra/${item.id_ingrediente}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    }

    alert("Planeación de compra guardada con éxito!");

    // Reset isModified flags
    planeacionCompra.value = planeacionCompra.value.map((item) => ({
      ...item,
      isModified: false,
    }));
  } catch (error) {
    console.error("Error submitting planeación:", error);
  }
};

const filteredPlaneacionCompra = computed(() => {
  if (isAdmin.value) {
    // Admin can see all records
    return planeacionCompra.value;
  }

  // Filter based on userName
  return planeacionCompra.value.filter((item) => {
    if (userName.value === 'moral') {
      return item.added_moral; // Only show records with added_moral = true
    } else if (userName.value === 'campestre') {
      return item.added_campestre; // Only show records with added_campestre = true
    }
    return false; // Default case if userName doesn't match
  });
});

const exportToWhatsApp = () => {
  submitPlaneacionCompra()
  // Construct the WhatsApp message
  let message = `Planeación de Compras (${userName.value.toUpperCase()}):\n\n`;

  planeacionCompra.value.forEach((item) => {
    const surtir = userName.value === "moral" ? item.surtirMoral : item.surtirCampestre;
    if (surtir) {
      message += `Ingrediente: ${item.nombre}\nCantidad: ${surtir}\n\n`;
    }
  });

  if (message.trim() === "") {
    alert("No hay datos para exportar.");
    return;
  }

  // Append the summary link
  message += "Resumen disponible en: https://admin-nectario-7e327f081e09.herokuapp.com/compradeldia";

  // Encode the message for WhatsApp
  const encodedMessage = encodeURIComponent(message);
  const phoneNumber = "+420774187964";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  // Open WhatsApp Web with the message
  window.open(whatsappUrl, "_blank");
};

/**
 * Clear all data from the planeacion_compra table
 */
const clearPlaneacionCompra = async () => {
  const confirmClear = confirm("¿Estás seguro de que deseas eliminar toda la planeación de compra?");

  if (!confirmClear) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/planeacion_compra`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Error clearing planeacion_compra: ${response.status}`);
    }

    console.log("Planeación de compra cleared successfully");
    planeacionCompra.value = []; // Clear local state
    alert("Planeación de compra eliminada con éxito.");
  } catch (error) {
    console.error("Error clearing planeacion_compra:", error);
    alert("Error al eliminar la planeación de compra.");
  }
};

const openPopup = (ingrediente) => {
  console.log(ingrediente)
  selectedIngredient.value = ingrediente;
  isPopupVisible.value = true;
};

const closePopup = () => {
  isPopupVisible.value = false;
  selectedIngredient.value = null;
};


// Fetch initial data on component mount
const fetchInitialData = async () => {
  await Promise.all([fetchIngredients(), fetchPlaneacionCompra(), fetchProveedores()]);
  isReady.value = true;
};

fetchInitialData();
</script>

<style scoped>
.table-container {
  /* Horizontal scrolling */
  -webkit-overflow-scrolling: touch;
  /* Smooth scroll on iOS */
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  white-space: nowrap;
  /* Prevent wrapping for larger screens */
  text-align: center;
  padding: 8px;
}

td div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.planeacion-container th,
.planeacion-container td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.cantidad-text {
  font-size: .5rem;
}

.editable-input {
  width: 120px;
  text-align: center;
  padding: 5px;
  height: 2rem;
  margin-bottom: 5px;
}

.button-remove {
  padding: 5px 10px;
  font-size: 14px;
  cursor: pointer;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
}

.button-remove:hover {
  opacity: 0.9;
}

.button-submit {
  padding: 15px 25px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.button-submit:hover {
  box-shadow: 0 4px 10px rgba(0, 123, 255, 0.5);
}

.button-whatsapp {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #25d366;
  color: white;
  border: 2px solid #25d366;
  border-radius: 5px;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.button-whatsapp:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 10px rgba(37, 211, 102, 0.5);
}

.button-container {
  display: flex;
  justify-content: space-evenly;
  margin-top: 20px;
}

.button-clear {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #dc3545;
  /* Red for warning */
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.button-clear:hover {
  background-color: #b22222;
  /* Darker red */
}

.button-whatsapp {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #25d366;
  /* WhatsApp green */
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.button-whatsapp:hover {
  background-color: #1da851;
  /* Darker WhatsApp green */
}

.planeacion-container {
  padding: 0.5rem;
}

/* Table Adjustments for Mobile */
@media (max-width: 768px) {

  table,
  thead,
  tbody,
  th,
  td,
  tr {
    display: block;
    width: 100%;
  }

  thead {
    display: none;
    /* Hide table headers */
  }

  tr {
    margin-bottom: 1rem;
    border-bottom: 1px solid #ddd;
    padding-bottom: 1rem;
  }

  td {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    font-size: 1.2rem;
  }

  td::before {
    content: attr(data-label);
    /* Add labels for data */
    font-weight: bold;
    text-transform: uppercase;
    flex: 1;
  }

  .editable-input {
    font-size: 1.5rem;
  }

  .button-remove {
    font-size: 1rem;
    padding: 0.5rem;
  }
}

.ingredients-container table tr td {
  padding: 1rem;
}

/* Search Container */
.search-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

/* Styled Search Bar */
.search-bar {
  width: 100%;
  max-width: 400px;
  /* Limit search bar width on larger screens */
  padding: 10px 15px;
  font-size: 22px;
  height: 3rem;
  border: 2px solid #ddd;
  border-radius: 25px;
  /* Rounded corners */
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Hover and Focus Effects */
.search-bar:hover,
.search-bar:focus {
  border-color: #4caf50;
  /* Highlight border */
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
  /* Subtle green glow */
}
</style>
