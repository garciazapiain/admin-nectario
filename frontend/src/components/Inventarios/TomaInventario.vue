<template>
  <div>
    <div v-if="submitMessage" :class="submitMessage.type">
      {{ submitMessage.text }}
    </div>
    <h1>Inventario {{ store }}</h1>
    <div class="update-info">
      <p class="update-text">
        Última actualización:
        <span class="timestamp">{{ lastUpdate() }}</span>
      </p>
    </div>
    <div class="filtros-container">
      <h2>Filtros:</h2>
      <label for="insumos">Tipo Insumos:</label>
      <select class="filterBar" id="insumos" v-model="selectedInsumosTipo">
        <option value="Producto clave">Producto clave</option>
        <option value="Todos">Todos</option>
      </select>
    </div>
    <input
      v-model="searchTerm"
      placeholder="Buscar ingrediente..."
      class="search-bar"
    />
    <!-- ... -->
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Cantidad</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(ingrediente, index) in filteredIngredients"
          :key="index"
          :class="{ 'highlight-row': ingrediente.producto_clave }"
        >
          <td>{{ ingrediente.nombre }}</td>
          <td>{{ ingrediente.unidad }}</td>
          <td>
            <div class="input-row">
              <input
                v-model.number="ingrediente.cantidad_inventario"
                min="0"
                @change="updateSubmitData(ingrediente)"
              />
            </div>
            <div class="button-row-parent">
              <div class="button-row">
                <div class="button-container">
                  <button
                    class="button-increase-decrease"
                    @click="decreaseQuantity(ingrediente)"
                  >
                    -
                  </button>
                </div>
                <div class="button-container">
                  <button
                    class="button-increase-decrease"
                    @click="increaseQuantity(ingrediente)"
                  >
                    +
                  </button>
                </div>
              </div>
              <div class="">
                <button
                  class="button-suficiente"
                  @click="setSufficient(ingrediente)"
                >
                  NO URGE
                </button>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="sticky-submit-wrapper">
      <button class="button-resetear" @click="confirmReset">Resetear</button>
      <button class="button-actualizar" @click="submitForm">Actualizar</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import moment from "moment-timezone";
import "moment/locale/es";
const router = useRouter();
const handleClickIngrediente = (idIngrediente) => {
  router.push(`/ingrediente/${idIngrediente}`);
};
</script>

<script>
export default {
  name: "TomaInventario",
  props: ["store"],
  data() {
    return {
      ingredientes: [],
      searchTerm: "",
      proveedor: "",
      submitData: [], // new state for data to be submitted
      submissions: [], // Add this line
      isScrollingDown: false,
      lastScrollPosition: 0,
      submitMessage: null,
      selectedInsumosTipo: "Todos",
    };
  },
  computed: {
    filteredIngredients() {
      let ingredients = this.ingredientes;
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        ingredients = ingredients.filter((ingrediente) =>
          ingrediente.nombre.toLowerCase().includes(term)
        );
      }
      if (this.proveedor) {
        ingredients = ingredients.filter(
          (ingrediente) => ingrediente.proveedor === this.proveedor
        );
      }
      // Exclude ingredients with proveedor_id === 1
      ingredients = ingredients.filter(
        (ingrediente) => ingrediente.proveedor_id !== 1
      );
      // Filter ingredients based on selectedInsumos
      if (this.selectedInsumosTipo === "Producto clave") {
        ingredients = ingredients.filter((ingredient) => {
          return ingredient.producto_clave;
        });
      }
      return ingredients;
    },
  },
  methods: {
    increaseQuantity(ingrediente) {
      if (ingrediente.cantidad_inventario === "Suficiente") {
        ingrediente.cantidad_inventario = 0.5;
      } else {
        ingrediente.cantidad_inventario += 0.5;
      }
      this.updateSubmitData(ingrediente);
    },
    decreaseQuantity(ingrediente) {
      if (ingrediente.cantidad_inventario === "Suficiente") {
        ingrediente.cantidad_inventario = 0;
      } else if (ingrediente.cantidad_inventario > 0) {
        ingrediente.cantidad_inventario -= 0.5;
      }
      this.updateSubmitData(ingrediente);
    },
    updateSubmitData(ingrediente) {
      const index = this.submitData.findIndex(
        (i) => i.nombre === ingrediente.nombre
      );
      if (index > -1) {
        this.submitData[index] = {
          ...this.submitData[index],
          cantidad_inventario: ingrediente.cantidad_inventario,
        };
      } else {
        this.submitData.push({
          id_ingrediente: ingrediente.id_ingrediente,
          nombre: ingrediente.nombre,
          unidad: ingrediente.unidad,
          cantidad_inventario: ingrediente.cantidad_inventario,
          proveedor: ingrediente.proveedor,
        });
      }
      // console.log(this.submitData); // Log submitData every time it gets updated
    },
    confirmReset() {
      if (window.confirm("Are you sure you want to reset?")) {
        this.resetForm()
        // Perform the reset action here
      }
    },
    resetForm() {
      // Reset all cantidad_inventario values to "Suficiente"
      this.submitData.forEach((item) => {
        item.cantidad_inventario = "Suficiente";
        this.updateSubmitData(item);
      });

      // Call submitForm method
      this.submitForm();
      setTimeout(() => {
        location.reload();
      }, 2000);
    },
    submitForm() {
      const date = new Date();
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are 0-based in JavaScript
      const day = String(date.getUTCDate()).padStart(2, "0");
      const hours = String(date.getUTCHours()).padStart(2, "0");
      const minutes = String(date.getUTCMinutes()).padStart(2, "0");

      const timestamp = `${year}-${month}-${day}T${hours}:${minutes}:00.000Z`; // YYYY-MM-DDTHH:mm:ss.sssZ
      const dateInTimeZone = moment(timestamp)
        .tz("America/Mexico_City")
        .locale("es");
      const formattedDate = dateInTimeZone.format("MMMM D YYYY, HH:mm");

      const dataToSubmit = {
        store: this.store,
        timestamp: formattedDate, // Add timestamp to dataToSubmit
        ingredients: this.submitData,
      };
      // Send a POST request to the server
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";
      fetch(`${API_URL}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          this.submitMessage = {
            type: "success-message",
            text: "Actualización exitosa",
          };
          // Make successMessage disappear after 5 seconds
          setTimeout(() => {
            this.submitMessage = null;
          }, 5000);
        })
        .catch((error) => {
          console.error("Error:", error);
          this.submitMessage = {
            type: "error-message",
            text: "Error al actualizar",
          };
          setTimeout(() => {
            this.submitMessage = null;
          }, 5000);
        });
    },
    lastUpdate() {
      const storeSubmissions = this.submissions.filter(
        (submission) => submission.store === this.store
      );
      if (storeSubmissions.length > 0) {
        const lastSubmission = storeSubmissions.reduce((latest, current) =>
          new Date(latest.timestamp) > new Date(current.timestamp)
            ? latest
            : current
        );
        return new Date(lastSubmission.timestamp).toLocaleString();
      } else {
        return "N/A";
      }
    },
    setSufficient(ingrediente) {
      ingrediente.cantidad_inventario = "Suficiente";
      this.updateSubmitData(ingrediente);
    },
  },
  async mounted() {
    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";
    const response = await fetch(`${API_URL}/ingredientes`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    this.ingredientes = await response.json();

    const responseSubmissions = await fetch(`${API_URL}/submissions`);
    if (!responseSubmissions.ok) {
      throw new Error(`HTTP error! status: ${responseSubmissions.status}`);
    }
    this.submissions = await responseSubmissions.json();

    const storeSubmissions = this.submissions.filter(
      (submission) => submission.store === this.store
    );
    let latestSubmission = null;
    if (storeSubmissions.length > 0) {
      latestSubmission = storeSubmissions.reduce((latest, current) =>
        new Date(latest.timestamp) > new Date(current.timestamp)
          ? latest
          : current
      );
    }

    this.ingredientes.forEach((ingrediente) => {
      if (latestSubmission && latestSubmission.compra) {
        const ingredientData = latestSubmission.compra.find(
          (i) => i.id_ingrediente === ingrediente.id_ingrediente
        );
        ingrediente.cantidad_inventario = ingredientData
          ? ingredientData.cantidad_inventario
          : 0;
      } else {
        ingrediente.cantidad_inventario = 0; // Initialize cantidad for each ingredient
      }
      this.updateSubmitData(ingrediente); // Initialize submitData
    });

    this.ingredientes.sort((a, b) => {
      // Sort by producto_clave first (true values come first)
      if (a.producto_clave !== b.producto_clave) {
        return b.producto_clave - a.producto_clave;
      }
      // If producto_clave is the same, sort alphabetically
      return a.nombre.localeCompare(b.nombre);
    });
  },
};
</script>

<style scoped>
.filtros-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.search-bar {
  width: 50%;
  padding: 10px;
  font-size: 16px;
}
.filterBar {
  margin-left: 10px;
  height: 2rem;
  font-size: 1rem;
  width: 50%;
}
.highlight-row {
  background-color: rgb(97, 133, 145);
  font-weight: bold;
  color: black;
}
input {
  width: 70%;
  height: 2.5rem;
  text-align: center;
  font-size: 1.5rem;
}
.button-container {
  width: 100%;
  height: 2.5rem;
  margin: 10px;
  display: flex;
  justify-content: center;
}

.button-suficiente {
  width: 100%;
  height: 50px;
  font-size: 20px;
  margin: 5px;
  border: #a94442 solid 3px;
}

.button-resetear {
  width: fit-content; /* Increase width */
  height: fit-content; /* Increase height */
  font-size: 20px; /* Increase font size */
  margin: 5px;
  background-color: red;
  border: white solid 1px;
  color: white;
}

.button-actualizar {
  width: fit-content; /* Increase width */
  height: fit-content; /* Increase height */
  font-size: 20px; /* Increase font size */
  margin: 5px;
}

.button-increase-decrease {
  width: 50px; /* Increase width */
  height: 50px; /* Increase height */
  font-size: 20px; /* Increase font size */
  margin: 5px;
  display: flex; /* Add this line */
  justify-content: center; /* Add this line */
  align-items: center; /* Add this line */
}
.button-row-parent {
  display: flex;
  flex-direction: column;
}
.button-row {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}
.sticky-submit-wrapper {
  position: sticky;
  bottom: 0;
  height: 80px;
  width: 100%;
  margin: 0;
  display: flex;
  justify-content: center;
  background-color: darkgray;
}
.success-message {
  position: fixed;
  top: 50px;
  right: 10px;
  background-color: #dff0d8;
  color: #3c763d;
  padding: 10px;
  border-radius: 5px;
}
.error-message {
  position: fixed;
  top: 50px;
  right: 10px;
  background-color: #f2dede;
  color: #a94442;
  padding: 10px;
  border-radius: 5px;
}
</style>