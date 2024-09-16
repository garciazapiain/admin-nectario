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
  router.push(`/ingrediente/${idIngrediente}`);
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
    const response = await fetch(`${API_URL}/subplatillo/${id}`);
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

// Fetch data on mount
fetchData();
fetchIngredientes();
</script>

<template>
  <div>
    <div v-if="isEditingName">
      <input type="text" v-model="newName" />
      <button @click="handleSaveName">Guardar</button>
    </div>
    <div v-else>
      <div class="flex w-full justify-center">
        <h1>{{ subplatillo.nombre }}</h1>
        <div class="tooltip-wrapper">
          <!-- Lock icon with tooltip -->
          <font-awesome-icon v-if="recetaBloqueada" :icon="['fas', 'lock']" class="tooltip-icon" />
          <!-- Tooltip content -->
          <span class="tooltip-text">Receta bloqueada, contacta a tu Administrador para hacer cambios.</span>
        </div>
      </div>
      <div class="platilloButtonContainer">
        <button v-if="isAdmin || !recetaBloqueada" @click="isEditingName = true">Editar nombre</button>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Ingredientes</th>
          <th>Unidad</th>
          <th>Cantidad</th>
          <th>$/Cantidad</th>
          <th v-if="isAdmin || !recetaBloqueada">BORRAR</th>
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
    <p>COSTO TOTAL: ${{ totalCost.toFixed(2) }}</p>
    <div v-if="isEditingRendimiento">
      <input type="number" v-model="newRendimiento" step="0.01" min="0" />
      <button @click="handleSaveRendimiento">Guardar</button>
      <button @click="isEditingRendimiento = false">X</button>
    </div>
    <div v-else>
      <p>RENDIMIENTO: {{ subplatillo.rendimiento }} {{ subplatillo.unidad }}</p>
      <button v-if="isAdmin || !recetaBloqueada" @click="isEditingRendimiento = true">Editar rendimiento</button>
    </div>
    <p>
      COSTO / {{ subplatillo.unidad }}: ${{
        (totalCost / subplatillo.rendimiento).toFixed(2)
      }}
    </p>
    <IngredientForm :ingredientes="ingredientes" :existingIngredientIds="existingIngredientIds"
      :postUrl="`${API_URL}/subplatillos/${$route.params.id}/ingredientes`" @ingredientAdded="fetchData" />
  </div>
</template>

<style scoped>
.tooltip-wrapper {
  position: relative;
  /* Position relative to contain the tooltip */
  display: inline-block;
  /* Inline block for proper positioning */
}

.tooltip-icon {
  cursor: pointer;
  /* Make the cursor pointer to indicate interactivity */
}

.tooltip-text {
  visibility: hidden;
  /* Hidden by default */
  width: 220px;
  /* Width of the tooltip */
  background-color: #333;
  /* Background color */
  color: #fff;
  /* Text color */
  text-align: center;
  /* Centered text */
  border-radius: 5px;
  /* Rounded corners */
  padding: 5px;
  /* Padding around the text */
  position: absolute;
  /* Position relative to the wrapper */
  z-index: 1;
  /* Above other elements */
  bottom: 125%;
  /* Position above the icon */
  left: 50%;
  /* Center horizontally */
  margin-left: -110px;
  /* Center adjustment */
  opacity: 0;
  /* Invisible by default */
  transition: opacity 0.3s;
  /* Smooth transition */
}

.tooltip-wrapper:hover .tooltip-text {
  visibility: visible;
  /* Show on hover */
  opacity: 1;
  /* Fully opaque */
}
</style>