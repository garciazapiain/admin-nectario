<script setup>
import API_URL from "../../config";
import IngredientForm from "./IngredientForm.vue";
import SubPlatilloForm from "../Subplatillos/SubPlatilloForm.vue";
import { ref } from "vue";
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");

</script>
<template>
  <div>
    <div v-if="isEditingName">
      <input type="text" v-model="newName" />
      <button @click="handleSaveName">Guardar</button>
    </div>
    <div v-else>
      <h1>{{ platillo.nombre }}</h1>
      <div class="platilloButtonContainer">
        <button v-if="isAdmin || !recetaBloqueada" @click="isEditingName = true">Editar nombre</button>
        <button @click="handleDuplicatePlatillo">Duplicar Platillo</button>
        <button v-if="isAdmin" class="bg-red-500" @click="handleDeletePlatillo">Borrar</button>
      </div>
    </div>
    <!-- <p>Unidades vendidas:{{ platillo.unidades_vendidas }}</p> -->
    <div>
      <input type="checkbox" id="includeSubplatillos" v-model="includeSubplatillos" />
      <label for="includeSubplatillos">DESGLOCAR CON SUBPLATILLOS</label>
    </div>
    <table>
      <thead>
        <tr>
          <th>INGREDIENTE</th>
          <th>UNIDAD</th>
          <th>CANTIDAD</th>
          <th>$/CANTIDAD</th>
          <th v-if="isAdmin || !recetaBloqueada">BORRAR</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(ingrediente, index) in aggregatedIngredients" :key="index">
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
              {{ ingrediente.cantidad.toFixed(2) }}
              <button v-if="isAdmin || !recetaBloqueada" @click="handleOpenEditIngredient(index)">Editar</button>
            </div>
          </td>
          <td>
            <!-- If includeSubplatillos is false or ingrediente.is_subplatillo is false, show the price normally -->
            <span v-if="!includeSubplatillos">
              ${{ (ingrediente.precio * ingrediente.cantidad).toFixed(2) }}
            </span>

            <!-- If includeSubplatillos is true and ingrediente.is_subplatillo is true, show the info icon with a tooltip -->
            <div v-else class="info-icon-wrapper">
              <i class="info-icon">ℹ️</i>
              <!-- Tooltip -->
              <div class="tooltip">
                Para ver esta columna, quita la opción de desgloce por subplatillos.
              </div>
            </div>
          </td>
          <td v-if="isAdmin || !recetaBloqueada">
            <!-- If ingrediente.isSubplatillo is false, show the delete button -->
            <button v-if="!ingrediente.is_subplatillo || includeSubplatillos"
              @click="handleDeleteIngredient(ingrediente)">Borrar</button>
            <!-- If ingrediente.isSubplatillo is true, show the info icon with a tooltip -->
            <div v-else class="info-icon-wrapper">
              <i class="info-icon">ℹ️</i>
              <!-- Tooltip -->
              <div class="tooltip">
                Este ingrediente forma parte de un subplatillo. Para eliminar este ingrediente, primero elimina el
                subplatillo al que pertenece.
              </div>
            </div>
          </td>
        </tr>
      </tbody>
      <p v-if=!includeSubplatillos>COSTO TOTAL: $ {{ totalCost.toFixed(2) }}</p>
    </table>

    <!-- Flexbox Container for Ingredient and SubPlatillo Forms -->
    <div class="form-container">
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
          let cantidad = ingrediente.is_subplatillo
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
        // console.log(total);
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
          `${API_URL}/platillo/${id}?includeSubplatillos=${this.includeSubplatillos}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.platillo = data;
        this.recetaBloqueada = data.receta_bloqueada;
      } catch (error) {
        console.error("Error:", error);
      }
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
        this.$router.push(`/subplatillo/${id}`);
      } else {
        this.$router.push(`/ingrediente/${idStr}`);
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
        console.log(`Cantidad nueva: ${data.cantidad}`);
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
        console.log(data.message);
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
        console.log(data.message);
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
        const response = await fetch(`${API_URL}/platillo/${idPlatillo}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data.message);
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
  display: flex; /* Use flex to arrange IngredientForm and SubPlatilloForm side by side */
  justify-content: space-between;
  align-items: flex-start; /* Align items to the start */
  gap: 20px; /* Add some spacing between forms */
  margin-top: 20px; /* Add some top margin */
  padding-bottom: 100px; /* Add extra space at the bottom for scrolling */
  overflow-x: auto; /* Enable horizontal scrolling if needed */
  overflow-y: auto; /* Enable vertical scrolling */
  max-height: 500px; /* Limit the height to enable scrolling */
}
</style>