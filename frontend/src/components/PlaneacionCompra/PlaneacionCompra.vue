<template>
  <div v-if="!isReady" class="loading-message">
    Cargando página...
  </div>
  <div v-else>
    <h1>Planeación de Compras</h1>
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
            <tr v-for="(item, index) in planeacionCompra" :key="index">
              <td>{{ item.nombre }}</td>
              <td v-if="isAdmin" data-label="Proveedor">
                <select v-model="item.proveedor" class="editable-dropdown">
                  <option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.nombre">
                    {{ proveedor.nombre }}
                  </option>
                </select>
              </td>
              <td v-if="userName === 'moral' || isAdmin" data-label="Cantidad Moral">
                <input type="text" v-model="item.surtirMoral" class="editable-input" />
              </td>
              <td v-if="userName === 'campestre' || isAdmin" data-label="Cantidad Campestre">
                <input type="text" v-model="item.surtirCampestre" class="editable-input" />
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
        <div>
          <!-- Submit Button -->
          <button class="button-submit" @click="submitPlaneacionCompra">Guardar Planeación</button>
        </div>
        <button v-if="isAdmin" class="button-clear" @click="clearPlaneacionCompra">
          Limpiar Planeación de Compra
        </button>
      </div>
    </div>

    <!-- Search Bar -->
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
              <button class="button-add" @click="addToPlaneacion(ingrediente)">Agregar</button>
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
      proveedor_opcion_b: item.proveedor_opcion_b
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
  // Use `id_ingrediente` for strict comparison to ensure correct match
  const existingItem = planeacionCompra.value.find(
    (item) => item.id_ingrediente == ingrediente.id_ingrediente
  );

  if (existingItem) {
    // Update the existing entry with new values
    existingItem.proveedor = ingrediente.proveedor || existingItem.proveedor;
    existingItem.surtirMoral = ingrediente.surtirMoral || existingItem.surtirMoral;
    existingItem.surtirCampestre = ingrediente.surtirCampestre || existingItem.surtirCampestre;

  } else {
    // Add a new entry if it doesn't exist
    planeacionCompra.value.push({
      id_ingrediente: ingrediente.id_ingrediente,
      nombre: ingrediente.nombre,
      proveedor: ingrediente.proveedor || "", // Default if missing
      surtirMoral: ingrediente.surtirMoral || "", // Default if missing
      surtirCampestre: ingrediente.surtirCampestre || "", // Default if missing
      image_url: ingrediente.image_url,
      image_url_2: ingrediente.image_url_2,
      moral_demanda_semanal: Number(ingrediente.moral_demanda_semanal),
      bosques_demanda_semanal: Number(ingrediente.bosques_demanda_semanal),
      proveedor_opcion_b: ingrediente.proveedor_opcion_b
    });

    console.log("Added new ingredient:", ingrediente);
  }
};

/**
 * Remove an ingredient from the planeacionCompra array
 */
const removeFromPlaneacion = async (index) => {
  const itemToRemove = planeacionCompra.value[index];

  try {
    const response = await fetch(`${API_URL}/planeacion_compra/${itemToRemove.id_ingrediente}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: Failed to delete item`);
    }

    const result = await response.json();
    console.log('Item deleted:', result);

    // Remove item from local state
    planeacionCompra.value.splice(index, 1);
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Error al eliminar el elemento.');
  }
};

/**
 * Computed property for filtering ingredients based on searchTerm
 */
const filteredIngredients = computed(() => {
  // Filter ingredients based on the search term
  let filtered = ingredientes.value;
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    filtered = filtered.filter((ingrediente) =>
      ingrediente.nombre.toLowerCase().includes(term)
    );
  }

  // Exclude ingredients already in planeacionCompra
  return filtered.filter(
    (ingrediente) =>
      !planeacionCompra.value.some(
        (item) => item.id_ingrediente === ingrediente.id_ingrediente
      )
  );
});

/**
 * Submit Planeacion Compra to the API
 */
const submitPlaneacionCompra = async () => {
  try {
    for (const item of planeacionCompra.value) {
      // Check if the ingredient already exists in the backend
      const checkResponse = await fetch(`${API_URL}/planeacion_compra/${item.id_ingrediente}`);

      if (checkResponse.status === 404) {
        // If not found, create a new record using POST
        const createResponse = await fetch(`${API_URL}/planeacion_compra`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_ingrediente: item.id_ingrediente,
            nombre: item.nombre,
            proveedor: item.proveedor,
            surtirMoral: item.surtirMoral,
            surtirCampestre: item.surtirCampestre,
            image_url: item.image_url,
            image_url_2: item.image_url_2,
            moral_demanda_semanal: item.demandaMoral,
            bosques_demanda_semanal: item.demandaBosques,
            proveedor_opcion_b: item.proveedor_opcion_b
          }),
        });

        if (!createResponse.ok) {
          throw new Error(`Error creating record: ${createResponse.status}`);
        }

        console.log("Record created:", await createResponse.json());
      } else if (checkResponse.ok) {
        // If found, update the record using PUT
        const updateResponse = await fetch(`${API_URL}/planeacion_compra/${item.id_ingrediente}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: item.nombre,
            proveedor: item.proveedor,
            surtirMoral: item.surtirMoral,
            surtirCampestre: item.surtirCampestre,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error(`Error updating record: ${updateResponse.status}`);
        }

        console.log("Record updated:", await updateResponse.json());
      } else {
        throw new Error(`Unexpected error: ${checkResponse.status}`);
      }
    }

    alert("Planeación de compra guardada con éxito!");
  } catch (error) {
    console.error("Error during submission:", error);
    alert("Error al guardar la planeación de compra.");
  }
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

.planeacion-container th,
.planeacion-container td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.editable-input {
  width: 200px;
  text-align: center;
  padding: 5px;
  height: 2rem;
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
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.button-submit:hover {
  background-color: #45a049;
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

@media (max-width: 768px) {

  /* Make table columns stack vertically */
  table,
  thead,
  tbody,
  th,
  td,
  tr {
    display: block;
  }

  thead {
    display: none;
    /* Hide table headers on small screens */
  }

  tr {
    border-bottom: 1px solid #ddd;
    /* Add borders for separation */
    margin-bottom: 10px;
  }

  td {
    text-align: left;
    justify-content: space-between;
    padding: 6px;
    border: none;
    font-size: 1.5rem;
  }

  td::before {
    content: attr(data-label);
    font-weight: bold;
    padding-right: 10px;
  }

  /* Buttons */
  .button-remove,
  .button-submit,
  .button-clear {
    width: 30%;
    margin: 5px 0;
    font-size: 1.5rem;
  }
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
