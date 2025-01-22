<template>
  <div v-if="!isReady" class="loading-message">
    Cargando página...
  </div>
  <div v-else>
    <div>
      <div v-if="submitMessage" :class="submitMessage.type">
        {{ submitMessage.text }}
      </div>
      <div class="sticky-icon" @click="goDownPage">
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="feather feather-arrow-down">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
      <h1>Lista Peligro - {{ store === "bosques" ? "Campestre" : store === "moral" ? "Moral" : "CEDIS" }}</h1>
      <div class="update-info">
        <p class="update-text">
          Última actualización:
          <span class="timestamp">{{ lastUpdate() }}</span>
        </p>
      </div>
      <!-- <div class="filtros-container">
        <h2>Filtros:</h2>
        <label for="insumos">Tipo Insumos:</label>
        <select class="filterBar" id="insumos" v-model="selectedInsumosTipo">
          <option value="Lista Peligro">Lista peligro</option>
          <option value="Todos">Todos</option>
        </select>
        <label for="proveedores">Proveedores:</label>
        <select class="filterBar" id="proveedores" v-model="selectedProveedor">
          <option value="">Todos</option>
          <option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.nombre">
            {{ proveedor.nombre }}
          </option>
        </select>
      </div> -->
      <input v-model="searchTerm" placeholder="Buscar ingrediente..." class="search-bar" />
      <!-- <div class="checkbox-container" v-if="isAdmin">
        <input type="checkbox" id="inventarioCheckbox" v-model="selectedInventarioOption" class="checkbox-input" />
        <label for="inventarioCheckbox" class="checkbox-label">
          <span class="checkbox-custom"></span> Inventario semanal
        </label>
      </div> -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Unidad</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ingrediente, index) in filteredIngredients" :key="index">
              <td class="text-white" style="font-size: 20px">{{ ingrediente.nombre }}</td>
              <td class="text-white" style="font-size: 20px">{{ ingrediente.unidad }}</td>
              <td class="text-white">
                <div class="input-row">
                  <input v-model.number="ingrediente.cantidad_inventario" min="0"
                    @change="updateSubmitData(ingrediente)" />
                </div>
                <div class="button-row-parent">
                  <div class="button-row">
                    <div class="button-container">
                      <button class="button-increase-decrease" @click="decreaseQuantity(ingrediente)">
                        -
                      </button>
                    </div>
                    <div class="button-container">
                      <button class="button-increase-decrease" @click="increaseQuantity(ingrediente)">
                        +
                      </button>
                    </div>
                  </div>
                  <div v-if="!ingrediente.producto_clave">
                    <button class="button-suficiente" @click="setSufficient(ingrediente)">
                      Suficiente
                    </button>
                  </div>
                  <div class="">
                    <button class="button-agotado" @click="setAgotado(ingrediente)">
                      Agotado
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="sticky-submit-wrapper">
        <BaseButton bgColor="bg-red-600" textColor="text-white" fontSize="text-lg" v-if="isAdmin" @click="confirmReset">
          Resetear
        </BaseButton>
        <BaseButton bgColor="bg-green-800" textColor="text-white" fontSize="text-lg" @click="submitForm">Actualizar</BaseButton>
        <BaseButton bgColor="bg-green-500" textColor="text-white" fontSize="text-lg" v-if="isAdmin" @click="sendWhatsAppMessage">Whatsapp</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import moment from "moment-timezone";
import "moment/locale/es";
import { ref } from "vue";
import API_URL from "../../config";
import BaseButton from "../../components/BaseButton.vue";

const router = useRouter();
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");
</script>

<script>
export default {
  name: "ListaPeligro",
  props: ["store"],
  data() {
    return {
      ingredientes: [],
      originalIngredientes: [],
      searchTerm: "",
      proveedores: [], // For the select dropdown
      submitData: [], // new state for data to be submitted
      submissions: [], // Add this line
      isScrollingDown: false,
      lastScrollPosition: 0,
      submitMessage: null,
      selectedInsumosTipo: "Lista Peligro",
      selectedProveedor: "",
      sucural: "",
      selectedInventarioOption: null,
      isReady: false
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
      // Exclude ingredients with proveedor_id === 1
      ingredients = ingredients.filter(
        (ingrediente) =>
          ingrediente.proveedor_id !== 1 && ingrediente.proveedor_id !== 31
      );
      // Filter ingredients based on selectedInsumos
      if (this.selectedInsumosTipo === "Lista Peligro") {
        ingredients = ingredients.filter((ingredient) => {
          return ingredient.producto_clave;
        });
      }
      // Filter ingredients based on selectedProveedor
      if (this.selectedProveedor) {
        ingredients = ingredients.filter(
          (ingrediente) => ingrediente.proveedor === this.selectedProveedor
        );
      }
      ingredients = ingredients.filter(
        (ingrediente) =>
          !ingrediente.frecuencias_inventario.includes("no_inventarear")
      );
      if (this.selectedInsumosTipo == "Transferencias") {
        ingredients = ingredients.filter((ingredient) => {
          // Check the selected store first
          if (this.store === "moral") {
            const moralInventory = this.getInventory(
              "moral",
              ingredient.id_ingrediente
            );
            const bosquesInventory = this.getInventory(
              "bosques",
              ingredient.id_ingrediente
            );
            return (
              moralInventory === "Suficiente" &&
              bosquesInventory !== "Suficiente"
            );
          } else if (this.store === "bosques") {
            const moralInventory = this.getInventory(
              "moral",
              ingredient.id_ingrediente
            );
            const bosquesInventory = this.getInventory(
              "bosques",
              ingredient.id_ingrediente
            );
            return (
              moralInventory !== "Suficiente" &&
              bosquesInventory === "Suficiente"
            );
          }
          // If the selected store is not "moral" or "bosques", include the ingredient in the list
          return true;
        });
      }
      ingredients.sort((a, b) => {
        if (this.selectedInsumosTipo === "Lista Peligro") {
          // Sort by producto_clave first (true values come first)
          if (a.producto_clave !== b.producto_clave) {
            return b.producto_clave - a.producto_clave;
          }
          // If producto_clave is the same, sort alphabetically by nombre
          return a.nombre.localeCompare(b.nombre);
        } else {
          // Sort by orden_inventario, nulls last
          if (a.orden_inventario === null) return 1;
          if (b.orden_inventario === null) return -1;
          return a.orden_inventario - b.orden_inventario;
        }
      });
      return ingredients;
    },
  },
  methods: {
    sendWhatsAppMessage() {
      const phoneNumber = '+420774187964'; // The phone number you want to send the message to

      // Filter out ingredients with "Suficiente"
      const filteredIngredientes = this.ingredientes.filter(ingrediente => {
        return ingrediente.cantidad_inventario !== "Suficiente";
      });

      // Check if there are any ingredients to send
      if (filteredIngredientes.length === 0) {
        alert("No ingredients to send.");
        return;
      }

      // Map the filtered ingredients to the desired format
      const messageParts = filteredIngredientes.map(ingrediente => {
        return `${ingrediente.nombre} ${ingrediente.cantidad_inventario} ${ingrediente.unidad}`;
      });

      // Encode the message
      const message = encodeURIComponent(`${this.store} inventario:\n${messageParts.join('\n')}`);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

      const confirmation = window.confirm("¿Ya le picaste al botón de actualizar?");

      // If confirmed, open the WhatsApp URL
      if (confirmation) {
        window.open(whatsappUrl, '_blank'); // This will open WhatsApp Web or the WhatsApp app with the pre-filled message for the specified number
      }
    },
    goDownPage() {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    },
    increaseQuantity(ingrediente) {
      if (typeof ingrediente.cantidad_inventario === "string") {
        ingrediente.cantidad_inventario = 0.5;
      } else {
        ingrediente.cantidad_inventario += 0.5;
      }
      this.updateSubmitData(ingrediente);
    },
    decreaseQuantity(ingrediente) {
      if (typeof ingrediente.cantidad_inventario === "string") {
        ingrediente.cantidad_inventario = 0;
      } else if (ingrediente.cantidad_inventario > 0) {
        ingrediente.cantidad_inventario -= 0.5;
      }
      this.updateSubmitData(ingrediente);
    },
    getInventory(store, ingredientId) {
      const submission = this.lastSubmission(store);

      if (!submission) {
        return "N/A";
      }

      const ingredient = submission.compra.find(
        (ing) => ing.id_ingrediente === ingredientId
      );

      return ingredient ? ingredient.cantidad_inventario : "N/A";
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
          moral_demanda_semanal: ingrediente.moral_demanda_semanal,
          bosques_demanda_semanal: ingrediente.bosques_demanda_semanal,
          producto_clave: ingrediente.producto_clave,
        });
      }
    },
    confirmReset() {
      const resetOption = window.prompt('Type "1" to reset all products or "2" to reset only non-key products:', "1");
      if (resetOption === "1") {
        // Resets all products
        this.resetForm(this.store);
      } else if (resetOption === "2") {
        // Resets only non-key products
        this.resetNonKeyProducts(this.store);
      } else {
        // If user cancels or inputs an invalid option
        alert("Reset cancelled or invalid option entered.");
      }
    },
    // Dummy function for resetting only non-key products
    resetNonKeyProducts(store) {
      this.submitData.forEach((item) => {
        // Check if producto_clave is not true (handles both false and undefined/null cases)
        if (!item.producto_clave) {
          item.cantidad_inventario = "Suficiente";
          this.updateSubmitData(item);
        }
      });
      fetch(`${API_URL}/ingredientes/no-claves-resetestatus/${store}`, {
        method: "PUT",
      })
        .then(() => {
          // Call submitForm method
          this.submitForm();
          setTimeout(() => {
            location.reload();
          }, 2000);
        })
        .catch((err) => {
          console.error(err);
        });
      // Here you would implement the actual logic to reset only non-key products
    },
    resetForm(store) {
      // Reset all cantidad_inventario values to "Suficiente"
      this.submitData.forEach((item) => {
        item.cantidad_inventario = "Suficiente";
        this.updateSubmitData(item);
      });
      // Reset all ingredient statuses
      fetch(`${API_URL}/ingredientes/resetestatus/${store}`, {
        method: "PUT",
      })
        .then(() => {
          // Call submitForm method
          this.submitForm();
          setTimeout(() => {
            location.reload();
          }, 2000);
        })
        .catch((err) => {
          console.error(err);
        });
    },
    async submitForm() {
      const date = new Date();
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const hours = String(date.getUTCHours()).padStart(2, "0");
      const minutes = String(date.getUTCMinutes()).padStart(2, "0");

      const timestamp = `${year}-${month}-${day}T${hours}:${minutes}:00.000Z`;
      const dateInTimeZone = moment(timestamp)
        .tz("America/Mexico_City")
        .locale("es");
      const formattedDate = dateInTimeZone.format("MMMM D YYYY, HH:mm");

      const dataToSubmit = {
        store: this.store,
        timestamp: formattedDate,
        ingredients: this.submitData,
        selectedInventarioOption: this.selectedInventarioOption,  // This will determine if the checkbox was checked
      };

      try {
        // Submit the selected inventory option
        const response = await fetch(`${API_URL}/submissions/new-submission`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSubmit),
        });
        const result = await response.json();
        this.submitMessage = {
          type: "success-message",
          text: "Inventario actualizado con éxito",
        };
      } catch (error) {
        console.error("Error:", error);
        this.submitMessage = {
          type: "error-message",
          text: "Error al actualizar el inventario",
        };
      }
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
    setAgotado(ingrediente) {
      ingrediente.cantidad_inventario = 0;
      this.updateSubmitData(ingrediente);
    },
    lastSubmission(store) {
      const storeSubmissions = this.submissions.filter(
        (submission) => submission.store === store
      );

      if (storeSubmissions.length > 0) {
        return storeSubmissions.reduce((latest, current) =>
          new Date(latest.timestamp) > new Date(current.timestamp)
            ? latest
            : current
        );
      } else {
        return null;
      }
    },
  },
  async mounted() {
    try {
      const response = await fetch(`${API_URL}/ingredientes/producto-clave`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.ingredientes = data;

      const responseSubmissions = await fetch(`${API_URL}/submissions/all-submissions`);
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

      this.originalIngredientes = JSON.parse(JSON.stringify(this.ingredientes));

      const proveedoresResponse = await fetch(`${API_URL}/proveedores`);
      if (proveedoresResponse.ok) {
        let proveedores = await proveedoresResponse.json();
        this.proveedores = proveedores.filter((proveedor) => proveedor.id !== 1);
      } else {
        console.error("HTTP error:", proveedoresResponse.status);
      }

      // Set `isReady` to true after all data is fetched and processed
      this.isReady = true;
    } catch (error) {
      console.error("Error during data loading:", error);
    }
  }
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

.table-container {
  overflow: auto;
}

.button-agotado {
  width: 100%;
  height: 50px;
  font-size: 20px;
  margin: 5px;
  border: #d20f0f solid 3px;
  background-color: #242424;
  color: white;
}

.button-increase-decrease {
  width: 50px;
  /* Increase width */
  height: 50px;
  /* Increase height */
  font-size: 20px;
  /* Increase font size */
  margin: 5px;
  display: flex;
  /* Add this line */
  justify-content: center;
  /* Add this line */
  align-items: center;
  /* Add this line */
  background-color: #242424;
  color: white;
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

.sticky-icon {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
  cursor: pointer;
}

.inventario-options {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.inventario-label {
  margin-right: 15px;
  font-size: 16px;
}

.inventario-label input {
  margin-right: 5px;
}

.checkbox-container {
  display: flex;
  align-items: center;
}

.checkbox-input {
  display: none;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-size: 16px;
  cursor: pointer;
  user-select: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  background-color: #ccc;
  border-radius: 4px;
  margin-right: 8px;
  position: relative;
  transition: background-color 0.3s ease;
}

.checkbox-input:checked+.checkbox-label .checkbox-custom {
  background-color: #007bff;
}

.checkbox-input:checked+.checkbox-label .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 5px;
  border-left: 2px solid white;
  border-bottom: 2px solid white;
  transform: translate(-50%, -50%) rotate(-45deg);
}

.loading-message {
  text-align: center;
  font-size: 18px;
  padding: 20px;
  color: #666;
}
</style>