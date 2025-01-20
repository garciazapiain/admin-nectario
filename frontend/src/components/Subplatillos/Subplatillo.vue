<script setup>
import { useRouter } from "vue-router";
import { ref, computed } from "vue";
import API_URL from "../../config";  // Import the API URL configuration
import IngredientForm from "../Platillos/IngredientForm.vue";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faLock, faUnlock } from '@fortawesome/free-solid-svg-icons'
import { library } from "@fortawesome/fontawesome-svg-core"; // Import the library function
library.add(faLock, faUnlock)

const router = useRouter();
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");

// Define reactive references
const subplatillo = ref({});
const ingredientes = ref([]);  // Define ingredientes here as a ref
const isEditingName = ref(false);
const isEditingRendimiento = ref(false);
const newName = ref("");
const newRendimiento = ref("");
const recetaBloqueada = ref(true);
const editIndex = ref(-1);
const editValue = ref(0);

// Computed property to get existing ingredient IDs
const existingIngredientIds = computed(() => {
  return subplatillo.value.ingredients
    ? subplatillo.value.ingredients.map((i) => i.id_ingrediente)
    : [];
});

// Function to handle ingredient clicks
const handleClickIngrediente = (idIngrediente) => {
  router.push(`/ingredientes/${idIngrediente}`);
};

// Function to open the ingredient editing mode
const handleOpenEditIngredient = (index) => {
  editIndex.value = index;
  editValue.value = subplatillo.value.ingredients[index].cantidad;
};

// Function to reset the ingredient editing value
const resetEditValue = () => {
  editValue.value = "0";
  editIndex.value = -1;
};

// Function to save edited ingredient quantity
const handleSaveEditIngredient = async () => {
  const idSubPlatillo = router.currentRoute.value.params.id;
  const idIngrediente = subplatillo.value.ingredients[editIndex.value].id_ingrediente;
  const cantidad = editValue.value;

  try {
    const response = await fetch(
      `${API_URL}/subplatillos/${idSubPlatillo}/ingredientes/${idIngrediente}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cantidad }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    fetchData(); // Refresh the data after a successful edit
  } catch (error) {
    console.error("Error:", error);
  }

  editIndex.value = -1;
};

// Function to delete an ingredient
const handleDeleteIngredient = async (ingrediente) => {
  const idSubPlatillo = router.currentRoute.value.params.id;
  const idIngrediente = ingrediente.id_ingrediente;

  try {
    const response = await fetch(
      `${API_URL}/subplatillos/${idSubPlatillo}/ingredientes/${idIngrediente}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    fetchData(); // Refresh the data after a successful delete
  } catch (error) {
    console.error("Error:", error);
  }
};

// Function to save the new name of the subplatillo
const handleSaveName = async () => {
  const idSubPlatillo = router.currentRoute.value.params.id;
  try {
    const response = await fetch(`${API_URL}/subplatillos/${idSubPlatillo}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre: newName.value }), // Send only the name
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    subplatillo.value.nombre = data.nombre;
    isEditingName.value = false;
    fetchData();
  } catch (error) {
    console.error("Error:", error);
  }
};


const handleSaveRendimiento = async () => {
  const idSubPlatillo = router.currentRoute.value.params.id;
  try {
    const response = await fetch(`${API_URL}/subplatillos/${idSubPlatillo}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rendimiento: newRendimiento.value }), // Send only the rendimiento
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    subplatillo.value.rendimiento = data.rendimiento;
    isEditingRendimiento.value = false;
    fetchData();
  } catch (error) {
    console.error("Error:", error);
  }
};

// Function to fetch subplatillo data
const fetchData = async () => {
  const id = router.currentRoute.value.params.id;
  try {
    const response = await fetch(`${API_URL}/subplatillos/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    subplatillo.value = data;
    newName.value = data.nombre; // Set the current name to input field
    newRendimiento.value = data.rendimiento; // Set the current rendimiento to input field
    recetaBloqueada.value = data.receta_bloqueada;
    console.log(recetaBloqueada)
  } catch (error) {
    console.error("Error:", error);
  }
};

// Function to fetch all ingredients
const fetchIngredientes = async () => {
  try {
    const response = await fetch(`${API_URL}/ingredientes`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    ingredientes.value = data;
  } catch (error) {
    console.error("Error:", error);
  }
};

// Computed property for total cost calculation
const totalCost = computed(() => {
  return subplatillo.value.ingredients
    ? subplatillo.value.ingredients.reduce(
      (total, ingrediente) => total + ingrediente.precio * ingrediente.cantidad,
      0
    )
    : 0;
});

const toggleRecetaBloqueada = async () => {
  const idSubPlatillo = router.currentRoute.value.params.id;
  try {
    const response = await fetch(`${API_URL}/subplatillos/${idSubPlatillo}/toggleRecetaBloqueada`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    recetaBloqueada.value = !recetaBloqueada; // Update the local state
  } catch (error) {
    console.error("Error toggling receta_bloqueada:", error);
  }
  window.location.reload()
}
// Fetch data on mount
fetchData();
fetchIngredientes();
</script>

<template>
  <div class="container">
    <!-- Title and Lock/Unlock Icons with Tooltip -->
    <div v-if="isEditingName">
      <input type="text" v-model="newName" />
      <button @click="handleSaveName">Guardar</button>
    </div>
    <div v-if="!isEditingName" class="flex sm:flex-row items-center mt-2">
      <h1 class="text-4xl mr-4 mb-2 sm:mb-0">{{ subplatillo.nombre }}</h1>
      <div class="tooltip-wrapper">
        <!-- For Admins: Clickable Icons -->
        <div v-if="isAdmin" class="flex items-center">
          <font-awesome-icon v-if="recetaBloqueada" :icon="['fas', 'lock']" class="tooltip-icon"
            @click="toggleRecetaBloqueada" />
          <font-awesome-icon v-else :icon="['fas', 'unlock']" class="tooltip-icon" @click="toggleRecetaBloqueada" />
          <!-- Conditional Tooltip Message for Admins -->
          <span class="tooltip-text">
            {{ recetaBloqueada ? 'Receta bloqueada, desbloqueala si quieres que otros usuarios puedan hacer cambios.'
              : 'Receta desbloqueada, otros usuarios pueden hacer cambios.' }}
          </span>
        </div>

        <!-- For Non-Admins: Non-Clickable Icons -->
        <div v-else class="flex items-center">
          <font-awesome-icon v-if="recetaBloqueada" :icon="['fas', 'lock']" class="tooltip-icon" />
          <font-awesome-icon v-else :icon="['fas', 'unlock']" class="tooltip-icon" />
          <!-- Conditional Tooltip Message for Non-Admins -->
          <span class="tooltip-text">
            {{ recetaBloqueada ? 'Receta bloqueada, contacta a tu Administrador para hacer cambios.' : 'Receta desbloqueada, puedes hacer cambios.' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Edit Name Button -->
    <div class="flex justify-center mt-2">
      <button v-if="isAdmin || !recetaBloqueada" @click="isEditingName = true" class="mb-2 sm:mb-0">Editar
        nombre</button>
    </div>

    <!-- Ingredients Table -->
    <div class="overflow-auto mt-4">
      <table class="w-full text-sm sm:text-base">
        <thead>
          <tr>
            <th>Ingredientes</th>
            <th>Unidad</th>
            <th>Cantidad</th>
            <th>$/Cantidad</th>
            <th v-if="isAdmin || !recetaBloqueada">Borrar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ingrediente, index) in subplatillo.ingredients" :key="index">
            <td @click="handleClickIngrediente(ingrediente.id_ingrediente)">
              {{ ingrediente.nombre }}
            </td>
            <td>{{ ingrediente.unidad }}</td>
            <td>
              <div class="editRow" v-if="editIndex === index">
                <div class="inputRow">
                  <input type="number" min=".001" v-model="editValue" step=".25" />
                  <button @click="resetEditValue">X</button>
                </div>
                <button @click="handleSaveEditIngredient">Guardar</button>
              </div>
              <div v-else>
                {{ ingrediente.cantidad }}
                <button v-if="isAdmin || !recetaBloqueada" @click="handleOpenEditIngredient(index)">Editar</button>
              </div>
            </td>
            <td>
              ${{ (ingrediente.precio * ingrediente.cantidad).toFixed(2) }}
            </td>
            <td v-if="isAdmin || !recetaBloqueada">
              <button @click="handleDeleteIngredient(ingrediente)">Borrar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Total Cost -->
    <p class="mt-4 text-left text-lg">COSTO TOTAL: ${{ totalCost.toFixed(2) }}</p>

    <!-- Edit Rendimiento Section -->
    <div class="text-lg mt-4 text-left">
      <div v-if="isEditingRendimiento">
        <input type="number" v-model="newRendimiento" step="0.01" min="0" />
        <button @click="handleSaveRendimiento">Guardar</button>
        <button @click="isEditingRendimiento = false">X</button>
      </div>
      <div class="text-left text-lg" v-else>
        <p class="text-left text-lg">RENDIMIENTO: {{ subplatillo.rendimiento }} {{ subplatillo.unidad }}</p>
        <button class="text-left text-lg" v-if="isAdmin || !recetaBloqueada" @click="isEditingRendimiento = true">Editar
          rendimiento</button>
      </div>
    </div>

    <!-- Cost Per Unit -->
    <p class="mt-4 text-left">COSTO / {{ subplatillo.unidad }}: ${{ (totalCost / subplatillo.rendimiento).toFixed(2) }}
    </p>

    <!-- Ingredient Form -->
    <IngredientForm v-if="!recetaBloqueada" class="text-left" :ingredientes="ingredientes"
      :existingIngredientIds="existingIngredientIds"
      :postUrl="`${API_URL}/subplatillos/${$route.params.id}/ingredientes`" @ingredientAdded="fetchData" />
  </div>
</template>

<style scoped>
.container {
  padding: 1rem;
  margin: 0 auto;
  max-width: 100%;
}

.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip-icon {
  cursor: pointer;
}

.tooltip-text {
  visibility: hidden;
  width: 220px;
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 5px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -110px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip-wrapper:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

.editRow {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 1.5rem;
}

.inputRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Responsive styles for smaller screens */
@media (max-width: 640px) {
  .container {
    padding: 0.5rem;
  }

  .platilloButtonContainer {
    flex-direction: column;
    align-items: stretch;
  }

  .tooltip-text {
    width: 180px;
  }

  .form-container {
    flex-direction: column;
    gap: 10px;
  }

  .tooltip-wrapper {
    margin-top: 10px;
  }
}
</style>
