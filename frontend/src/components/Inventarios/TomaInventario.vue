<template>
    <div>
      <div v-if="submitMessage" :class="submitMessage.type">
        {{ submitMessage.text }}
      </div>
      <!-- <button @click="verifyChangeIngredientCount">Check</button> -->
      <div class="sticky-icon" @click="goDownPage">
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="feather feather-arrow-down">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
      <h1>Toma de Inventario - {{ store === "bosques" ? "Campestre" : "Moral" }}</h1>
      <div class="update-info">
        <p class="update-text">
          Última actualización:
          <span class="timestamp">{{ lastUpdate() }}</span>
        </p>
      </div>
      <div v-if="isAdmin" class="filtros-container">
        <h2>Filtros:</h2>
        <label for="insumos">Tipo Insumos:</label>
        <select class="filterBar" id="insumos" v-model="selectedInsumosTipo">
          <option value="Lista Peligro">Lista peligro</option>
          <option value="Transferencias">Transferencias</option>
          <option value="Todos">Todos</option>
        </select>
        <label for="proveedores">Proveedores:</label>
        <select class="filterBar" id="proveedores" v-model="selectedProveedor">
          <option value="">Todos</option>
          <option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.nombre">
            {{ proveedor.nombre }}
          </option>
        </select>
        <label for="frecuencias_inventario">Frecuencia Inventario:</label>
        <select class="filterBar" id="frecuencias_inventario" v-model="selectedFrecuencia">
          <option value="">Todos</option>
          <option value="inicio_primer_turno">Inicio primer turno</option>
          <option value="inicio_segundo_turno">Inicio segundo turno</option>
          <option value="fin_segundo_turno">Fin segundo turno</option>
        </select>
      </div>
      <input v-model="searchTerm" placeholder="Buscar ingrediente..." class="search-bar" />
      <!-- ... -->
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
                  <!-- <div class="">
                    <button
                      class="button-casiNoHay"
                      @click="setCasiNoHay(ingrediente)"
                    >
                      Casi no hay
                    </button>
                  </div> -->
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
        <button v-if="isAdmin" class="button-resetear" @click="confirmReset">
          Resetear
        </button>
        <button class="button-actualizar" @click="submitForm">Actualizar</button>
        <button v-if="isAdmin" class="button-whatsapp" @click="sendWhatsAppMessage">Whatsapp</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from "vue-router";
  import moment from "moment-timezone";
  import "moment/locale/es";
  import { ref } from "vue";
  import API_URL from "../../config";
  
  const router = useRouter();
  const isAdmin = ref(localStorage.getItem("isAdmin") === "true");
  const handleClickIngrediente = (idIngrediente) => {
    router.push(`/ingrediente/${idIngrediente}`);
  };
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
        proveedor: "",
        proveedores: [], // For the select dropdown
        selectedFrecuencia: "",
        submitData: [], // new state for data to be submitted
        submissions: [], // Add this line
        isScrollingDown: false,
        lastScrollPosition: 0,
        submitMessage: null,
        selectedInsumosTipo: "Lista Peligro",
        selectedProveedor: "",
        selectedInsumos: "Todos",
        sucural: "",
      };
    },
    created() {
      let pathArray = window.location.pathname.split("/");
      this.sucursal =
        pathArray[pathArray.length - 1] === "moral" ? "moral" : "bosques";
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
        if (this.selectedInsumos === "Urgente") {
          ingredients = ingredients.filter((ingredient) => {
            const storeInventory = this.getInventory(
              this.store,
              ingredient.id_ingrediente
            );
            return storeInventory !== "Suficiente";
          });
        }
        if (this.proveedor) {
          ingredients = ingredients.filter(
            (ingrediente) => ingrediente.proveedor === this.proveedor
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
        // Filter ingredients based on selectedFrecuencia
        ingredients = ingredients.filter(
          (ingrediente) =>
            !ingrediente.frecuencias_inventario.includes("no_inventarear")
        );
        if (this.selectedFrecuencia) {
          ingredients = ingredients.filter((ingrediente) =>
            ingrediente.frecuencias_inventario.includes(this.selectedFrecuencia)
          );
        }
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
          console.log(`Checking ingredient: ${ingrediente.nombre} with cantidad_inventario: ${ingrediente.cantidad_inventario}`);
          return ingrediente.cantidad_inventario !== "Suficiente";
        });
  
        // Log the filtered ingredients
        console.log("Filtered Ingredients after filter:", filteredIngredientes);
  
        // Check if there are any ingredients to send
        if (filteredIngredientes.length === 0) {
          console.log("No ingredients to send.");
          alert("No ingredients to send.");
          return;
        }
  
        // Map the filtered ingredients to the desired format
        const messageParts = filteredIngredientes.map(ingrediente => {
          console.log(`Processing ingredient: ${ingrediente.nombre} ${ingrediente.cantidad_inventario} ${ingrediente.unidad}`);
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
      verifyChangeIngredientCount() {
        const originalIngredientesArray = Object.values(
          this.originalIngredientes
        );
        const ingredientesArray = Object.values(this.ingredientes);
  
        this.changedIngredients = ingredientesArray
          .filter((ingrediente) => {
            const originalIngrediente = originalIngredientesArray.find(
              (original) => original.id_ingrediente === ingrediente.id_ingrediente
            );
            const isChanged =
              originalIngrediente &&
              ingrediente.cantidad_inventario !==
              originalIngrediente.cantidad_inventario;
            return isChanged;
          })
          .map((ingrediente) => ingrediente.id_ingrediente);
        if (this.changedIngredients.length > 0) {
          this.updateIngredientStatus(this.store);
        }
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
        // console.log(this.submitData); // Log submitData every time it gets updated
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
          console.log("Reset cancelled or invalid option entered.");
        }
      },
      // Dummy function for resetting only non-key products
      resetNonKeyProducts(store) {
        this.submitData.forEach((item) => {
          // Check if producto_clave is not true (handles both false and undefined/null cases)
          console.log("Checking item:", item, item.producto_clave)
          if (!item.producto_clave) {
            console.log(item.nombre, item.producto_clave, "is not a key product")
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
        fetch(`${API_URL}/submissions/new-submission`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSubmit),
        })
          .then((response) => response.json())
          .then((data) => {
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
        this.verifyChangeIngredientCount();
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
      setCasiNoHay(ingrediente) {
        ingrediente.cantidad_inventario = "Casi no hay";
        this.updateSubmitData(ingrediente);
      },
      setAgotado(ingrediente) {
        ingrediente.cantidad_inventario = 0;
        this.updateSubmitData(ingrediente);
      },
      async updateIngredientStatus(store) {
        const response = await fetch(
          `${API_URL}/ingredientes/estatusupdate/${store}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ingredientIds: this.changedIngredients,
              newStatus: "No comprado",
            }),
          }
        );
  
        if (!response.ok) {
          console.error("Failed to update ingredient status", response);
        } else {
          console.log("Successfully updated ingredient status");
        }
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
      const response = await fetch(`${API_URL}/ingredientes`);
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
        // Filter out the provider with id 1
        this.proveedores = proveedores.filter((proveedor) => proveedor.id !== 1);
      } else {
        console.error("HTTP error:", proveedoresResponse.status);
      }
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
  
  .button-suficiente {
    width: 100%;
    height: 50px;
    font-size: 20px;
    margin: 5px;
    border: #2cb92c solid 3px;
    background-color: #242424;
    color: white;
  }
  
  .button-casiNoHay {
    width: 100%;
    height: 50px;
    font-size: 20px;
    margin: 5px;
    border: #d5cb09 solid 3px;
    background-color: #242424;
    color: white;
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
  
  .button-resetear {
    width: fit-content;
    /* Increase width */
    height: fit-content;
    /* Increase height */
    font-size: 20px;
    /* Increase font size */
    margin: 5px;
    background-color: red;
    border: white solid 1px;
    color: white;
  }
  
  .button-actualizar {
    width: fit-content;
    /* Increase width */
    height: fit-content;
    /* Increase height */
    font-size: 20px;
    /* Increase font size */
    margin: 5px;
    background-color: rgb(8, 73, 8);
    color: white;
    border: white solid 1px;
  }
  
  .button-whatsapp {
    width: fit-content;
    /* Increase width */
    height: fit-content;
    /* Increase height */
    font-size: 20px;
    /* Increase font size */
    margin: 5px;
    background-color: #2cb92c;
    color: white;
    border: white solid 1px;
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
  </style>