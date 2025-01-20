<script setup>
import API_URL from "../../config";
import IngredientForm from "./IngredientForm.vue";
import SubPlatilloForm from "../Subplatillos/SubPlatilloForm.vue";
import { ref } from "vue";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faLock, faUnlock } from '@fortawesome/free-solid-svg-icons'
import { library } from "@fortawesome/fontawesome-svg-core"; // Import the library function
library.add(faLock, faUnlock)
const isAdmin = ref(localStorage.getItem("isAdmin") === "true"); // Define isAdmin as a reactive reference

</script>
<template>
  <div class="container">
    <!-- Title and Lock/Unlock Icons with Tooltip -->
    <div v-if="isEditingName">
      <input type="text" v-model="newName" />
      <button @click="handleSaveName">Guardar</button>
    </div>
    <div v-if="!isEditingName" class="flex sm:flex-row items-center mt-2">
      <h1 class="text-4xl mb-2 mr-4 sm:mb-0">{{ platillo.nombre }}</h1>
      <div class="tooltip-wrapper">
        <!-- For Admins: Clickable Icons -->
        <div v-if="isAdmin" class="flex items-center">
          <font-awesome-icon v-if="recetaBloqueada" :icon="['fas', 'lock']" class="tooltip-icon"
            @click="toggleRecetaBloqueada" />
          <font-awesome-icon v-else :icon="['fas', 'unlock']" class="tooltip-icon" @click="toggleRecetaBloqueada" />
          <span class="tooltip-text">
            {{ recetaBloqueada ? 'Receta bloqueada, desbloqueala si quieres que otros usuarios puedan hacer cambios.' :
            'Receta desbloqueada, otros usuarios pueden hacer cambios.' }}
          </span>
        </div>

        <!-- For Non-Admins: Non-Clickable Icons -->
        <div v-else class="flex items-center">
          <font-awesome-icon v-if="recetaBloqueada" :icon="['fas', 'lock']" class="tooltip-icon" />
          <font-awesome-icon v-else :icon="['fas', 'unlock']" class="tooltip-icon" />
          <span class="tooltip-text">
            {{ recetaBloqueada ? 'Receta bloqueada, contacta a tu Administrador para hacer cambios.' : 'Receta desbloqueada, puedes hacer cambios.' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Edit, Duplicate, and Delete Buttons -->
    <div class="platilloButtonContainer flex flex-col sm:flex-row items-center mt-2">
      <button v-if="isAdmin || !recetaBloqueada" class="mb-2 sm:mb-0 sm:mr-2" @click="isEditingName = true">Editar
        nombre</button>
      <button v-if="isAdmin" class="mb-2 sm:mb-0 sm:mr-2" @click="handleDuplicatePlatillo">Duplicar Platillo</button>
      <button v-if="isAdmin" class="bg-red-500 mb-2 sm:mb-0" @click="handleDeletePlatillo">Borrar</button>
    </div>

    <!-- <input type="checkbox" id="includeSubplatillos" v-model="includeSubplatillos" />
    <label for="includeSubplatillos">DESGLOCAR CON SUBPLATILLOS</label> -->

    <!-- Ingredients Table -->
    <div class="overflow-auto mt-4">
      <table class="w-full text-sm sm:text-base">
        <thead>
          <tr>
            <th>Ingrediente</th>
            <th>Unidad</th>
            <th>Cantidad</th>
            <th>$/Cantidad</th>
            <th v-if="isAdmin || !recetaBloqueada">Borrar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ingrediente, index) in aggregatedIngredients" :key="index">
            <td @click="handleClickIngrediente(ingrediente.id_ingrediente)">
              {{ ingrediente.nombre }}{{ ingrediente.is_subplatillo ? ` (Subplatillo)` : "" }}
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
                {{ ingrediente.cantidad.toFixed(3) }}
                <button
                  v-if="(isAdmin || !recetaBloqueada) && !ingrediente.is_part_of_subplatillo && !ingrediente.is_subplatillo"
                  @click="handleOpenEditIngredient(index)">
                  Editar
                </button>
                <!-- Information for ingrediente part of subplatillo -->
                <div v-if="(isAdmin || !recetaBloqueada) && ingrediente.is_part_of_subplatillo"
                  class="info-icon-wrapper">
                  <i class="info-icon">ℹ️</i>
                  <div class="tooltip">
                    Este ingrediente es parte de un subplatillo para modificar cantidad,
                    hacerlo en subplatillo correspondiente.
                  </div>
                </div>
                <!-- Information for ingrediente is a subplatillo -->
                <div v-if="(isAdmin || !recetaBloqueada) && ingrediente.is_subplatillo" class="info-icon-wrapper">
                  <i class="info-icon">ℹ️</i>
                  <div class="tooltip">
                    Para modificar cantidad de subplatillo, borrarlo y agregarlo nuevamente.
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span v-if="!ingrediente.is_subplatillo">
                ${{ (ingrediente.precio * ingrediente.cantidad).toFixed(2) }}
              </span>
              <div v-else class="info-icon-wrapper">
                <i class="info-icon">ℹ️</i>
                <div class="tooltip">
                  Este es un subplatillo, para consultar costo hacer click en el nombre
                </div>
              </div>
            </td>
            <td v-if="isAdmin || !recetaBloqueada">
              <button v-if="!ingrediente.is_part_of_subplatillo"
                @click="handleDeleteIngredient(ingrediente)">Borrar</button>
              <div v-else class="info-icon-wrapper">
                <i class="info-icon">ℹ️</i>
                <div class="tooltip">
                  Este ingrediente forma parte de un subplatillo. Para eliminar este ingrediente, primero eliminalo del
                  subplatillo al que pertenece.
                </div>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr v-if="!includeSubplatillos">
            <td colspan="4" class="text-left text-lg">COSTO TOTAL: ${{ totalCost.toFixed(2) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Ingredients and SubPlatillo Forms -->
    <div v-if="isAdmin || !recetaBloqueada"
      class="form-container flex flex-col gap-4 sm:flex-row items-start overflow-auto mt-4">
      <IngredientForm :ingredientes="ingredientes" :existingIngredientIds="existingIngredientIds"
        :postUrl="`${API_URL}/platillos/${$route.params.id}/ingredientes`" @ingredientAdded="fetchData" />
      <SubPlatilloForm :subPlatillos="subPlatillos" :existingSubPlatilloIds="existingSubPlatilloIds"
        @subPlatilloAdded="fetchData" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      platillo: {},
      includeSubplatillos: false,
      ingredientes: [],
      selectedIngredients: [],
      subPlatillos: [],
      mensajeError: "",
      ingredienteAgregadoExitosamente: "",
      searchTerm: "",
      API_URL: API_URL,
      editIndex: -1,
      editValue: 0,
      isEditingName: false,
      newName: "",
      recetaBloqueada: true
    };
  },
  components: {
    IngredientForm,
    SubPlatilloForm,
  },
  computed: {
    aggregatedIngredients() {
      let ingredients = {};
      if (this.platillo && this.platillo.ingredients) {
        this.platillo.ingredients.forEach((ingrediente) => {
          let cantidad = ingrediente.is_part_of_subplatillo
            ? (ingrediente.cantidad / ingrediente.rendimiento) *
            (ingrediente.subplatillo_cantidad
              ? ingrediente.subplatillo_cantidad
              : 1)
            : ingrediente.cantidad;

          if (ingredients[ingrediente.id_ingrediente]) {
            ingredients[ingrediente.id_ingrediente].cantidad +=
              parseFloat(cantidad);
          } else {
            ingredients[ingrediente.id_ingrediente] = {
              ...ingrediente,
              cantidad: parseFloat(cantidad),
            };
          }
        });
      }
      return Object.values(ingredients);
    },
    existingIngredientIds() {
      return this.platillo.ingredients
        ? this.platillo.ingredients.map((i) => i.id_ingrediente)
        : [];
    },
    existingSubPlatilloIds() {
      return this.platillo.subPlatillos
        ? this.platillo.subPlatillos.map((s) => s.id_subplatillo)
        : [];
    },
    totalCost() {
      let total = 0;
      this.aggregatedIngredients.forEach((ingrediente) => {
        total += ingrediente.precio * ingrediente.cantidad;
      });
      return total;
    },
  },
  async mounted() {
    this.fetchData();
    this.fetchIngredientes();
    this.fetchSubPlatillos();
  },
  watch: {
    includeSubplatillos() {
      this.fetchData();
    },
  },
  methods: {
    async fetchData() {
      const id = this.$route.params.id;
      try {
        const response = await fetch(
          `${API_URL}/platillos/${id}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.platillo = data;
        this.newName = data.nombre
        this.recetaBloqueada = data.receta_bloqueada;
      } catch (error) {
        console.error("Error:", error);
      }
    },
    async toggleRecetaBloqueada() {
      const idPlatillo = this.$route.params.id;

      try {
        const response = await fetch(`${API_URL}/platillos/${idPlatillo}/toggleRecetaBloqueada`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.recetaBloqueada = data.receta_bloqueada; // Update the local state
      } catch (error) {
        console.error("Error toggling receta_bloqueada:", error);
      }
      window.location.reload()
    },
    async handleSaveName() {
      const idPlatillo = this.$route.params.id;
      const nombre = this.newName;

      try {
        const response = await fetch(`${API_URL}/platillos/${idPlatillo}/cambiarnombre`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nombre }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.platillo.nombre = data.nombre;
        this.isEditingName = false;
        this.fetchData();
      } catch (error) {
        console.error("Error:", error);
      }
    },
    async fetchIngredientes() {
      try {
        const response = await fetch(`${API_URL}/ingredientes/demanda`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.ingredientes = data;
      } catch (error) {
        console.error("Error:", error);
      }
    },
    async fetchSubPlatillos() {
      try {
        const response = await fetch(`${API_URL}/subplatillos`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.subPlatillos = data;
      } catch (error) {
        console.error("Error:", error);
      }
    },
    handleClickIngrediente(idIngrediente) {
      const idStr = String(idIngrediente);
      if (idStr.startsWith("sub_")) {
        const id = idStr.replace("sub_", "");
        this.$router.push(`/subplatillos/${id}`);
      } else {
        this.$router.push(`/ingredientes/${idStr}`);
      }
    },
    handleOpenEditIngredient(index) {
      this.editIndex = index;
      this.editValue = this.aggregatedIngredients[index].cantidad;
    },
    resetEditValue() {
      this.editValue = "0";
      this.editIndex = -1;
    },
    async handleSaveEditIngredient() {
      const idPlatillo = this.$route.params.id;
      const idIngrediente =
        this.aggregatedIngredients[this.editIndex].id_ingrediente;
      const cantidad = this.editValue;

      try {
        const response = await fetch(
          `${API_URL}/platillos/${idPlatillo}/ingredientes/${idIngrediente}`,
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

        const data = await response.json();
        this.fetchData();
      } catch (error) {
        console.error("Error:", error);
      }

      this.editIndex = -1;
    },
    async handleDeleteIngredient(ingrediente) {
      const idPlatillo = this.$route.params.id;
      const idIngrediente = ingrediente.id_ingrediente;

      try {
        const response = await fetch(
          `${API_URL}/platillos/${idPlatillo}/ingredientes/${idIngrediente}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.fetchData(); // Refresh the data after a successful delete
      } catch (error) {
        console.error("Error:", error);
      }
    },
    // Add this method to your methods object
    async handleDuplicatePlatillo() {
      const idPlatillo = this.$route.params.id;

      try {
        const response = await fetch(
          `${API_URL}/platillos/${idPlatillo}/duplicate`,
          {
            method: "POST",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        location.reload();
      } catch (error) {
        console.error("Error:", error);
      }
    },
    async handleDeletePlatillo() {
      const idPlatillo = this.$route.params.id;

      // Add confirmation dialog
      const isConfirmed = confirm("¿Estás seguro de que deseas eliminar este platillo? Esta acción no se puede deshacer.");

      if (!isConfirmed) {
        return; // Exit if user cancels the delete action
      }

      try {
        const response = await fetch(`${API_URL}/platillos/${idPlatillo}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Instead of reloading, use Vue Router to redirect or reload component data
        this.$router.push('/platillos'); // Use the correct path for your platillo list page
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while deleting the platillo. Please try again."); // Provide user feedback
      }
    },
  },
};
</script>



<style scoped>
h2,
p,
div {
  margin: 0.5rem 0;
}

.container {
  padding: 1rem;
  margin: 0 auto;
  max-width: 100%;
}

.editRow {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 1.5rem;
}

.editRow>button {
  width: 80%;
}

.inputRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.platilloButtonContainer {
  display: flex;
  justify-content: space-between;
  margin: 1rem 0;
}

.info-icon-wrapper {
  position: relative;
  display: inline-block;
}

.info-icon {
  cursor: pointer;
  font-style: normal;
  /* Ensures the info icon is styled correctly */
}

.tooltip {
  visibility: hidden;
  width: 220px;
  /* Adjust width as needed */
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 5px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  /* Position the tooltip above the icon */
  left: 50%;
  margin-left: -110px;
  /* Center the tooltip */
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  /* Ensures the tooltip doesn't interfere with hover */
}

.info-icon-wrapper:hover .tooltip {
  visibility: visible;
  opacity: 1;
}

.form-container {
  display: flex;
  /* Use flex to arrange IngredientForm and SubPlatilloForm side by side */
  justify-content: space-between;
  align-items: flex-start;
  /* Align items to the start */
  gap: 20px;
  /* Add some spacing between forms */
  margin-top: 20px;
  /* Add some top margin */
  padding-bottom: 100px;
  /* Add extra space at the bottom for scrolling */
  overflow-x: auto;
  /* Enable horizontal scrolling if needed */
  overflow-y: auto;
  /* Enable vertical scrolling */
  max-height: 500px;
  /* Limit the height to enable scrolling */
}

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