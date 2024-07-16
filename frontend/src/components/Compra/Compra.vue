<template>
  <div>
    <h1>Compra</h1>
    <div class="update-info">
      <p class="update-text">
        Última actualización Moral:
        <span class="timestamp">{{ lastUpdate("moral") }}</span>
      </p>
      <p class="update-text">
        Última actualización Campestre:
        <span class="timestamp">{{ lastUpdate("bosques") }}</span>
      </p>
    </div>
    <div>
      <div>
        <h2>Filtros:</h2>
        <div className="flex flex-col w-3/4 justify-center items-center">
          <label for="proveedor">Proveedor:</label>
          <select class="filterBar" id="proveedor" v-model="selectedProveedor">
            <option value="">Todos</option>
            <option v-for="proveedor in sortedProveedores" :value="proveedor.id" :key="proveedor.id">
              {{ proveedor.nombre }}
            </option>
          </select>
          <label for="insumos">Tipo Insumos:</label>
          <select class="filterBar" id="insumos-tipo" v-model="selectedInsumosTipo">
            <option value="Lista Peligro">Lista Peligro</option>
            <option value="Todos">Todos</option>
          </select>
          <label for="insumos">Urgencia suministro insumos:</label>
          <select class="filterBar" id="insumos" v-model="selectedUrgencia">
            <option value="Urgente">Urgente</option>
            <option value="Todos">Todos</option>
          </select>
          <label for="insumos">Estatus insumos:</label>
          <select class="filterBar" id="insumos" v-model="selectedEstatusFilter">
            <option value="Todos">Todos</option>
            <option v-for="status in listaEstatus" :value="status" :key="status">
              {{ status }}
            </option>
          </select>
          <div className="flex flex-row">
            <input type="checkbox" id="sort" v-model="orderRouteCheckbox" :disabled="selectedProveedor === ''" />
            <label for="sort">Ruta de tienda</label>
          </div>
          <div className="duracionDiasSuministro">
            <label for="duracion">Duracion dias de suministro:</label>
            <input type="number" id="duracion" v-model="duracionDiasSuministro" min="1" />
          </div>
        </div>
        <div class="flex-row">
          Presupuesto Estimado Suministro:
          <p class="text-2xl">${{ totalPresupuestoSuministro }}</p>
        </div>
      </div>
      <button @click="exportToWhatsApp">Exportar a WhatsApp</button>
      <input class="p-4 text-lg" v-model="searchTerm" placeholder="Buscar insumo" />
    </div>
    <div class="table-container">
      <table class="w-full min-w-[400px] border-collapse">
        <thead>
          <tr>
            <th>
              <input type="checkbox" @change="toggleSelectAll($event)" />
            </th>
            <th>Nombre</th>
            <th>Unidad</th>
            <th>Exi. Moral</th>
            <th>Exi. Campestre</th>
            <th>Proveedor</th>
            <th>Estatus Moral</th>
            <th>Estatus Campestre</th>
            <th>Surtir Moral</th>
            <th>Surtir Campestre</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ingredient, index) in filteredIngredients" :key="index"
            :class="{ 'bg-[#618591] font-bold text-black': ingredient.producto_clave }">
            <td>
              <input type="checkbox" :id="`check-${ingredient.id_ingrediente}`"
                :checked="isChecked(ingredient.id_ingrediente)" @change="toggleCheck(ingredient.id_ingrediente)">
            </td>
            <td style="font-size: 20px">
              {{ ingredient.nombre }}
            </td>
            <td style="font-size: 20px">{{ ingredient.unidad }}</td>
            <td style="font-size: 20px">
              {{ getInventory("moral", ingredient.id_ingrediente) }}
            </td>
            <td style="font-size: 20px">
              {{ getInventory("bosques", ingredient.id_ingrediente) }}
            </td>
            <td>
              <!-- {{ getProveedorName(ingredient.proveedor_id) }} -->
              <select class="text-xs" v-model="ingredient.proveedor_id">
                <option v-for="proveedor in proveedores" :value="proveedor.id" :key="proveedor.id">
                  {{ proveedor.nombre }}
                </option>
              </select>
            </td>
            <td>
              <select v-model="ingredient.estatus_moral" @change="
                actualizarEstatus(
                  ingredient.id_ingrediente,
                  ingredient.estatus_moral,
                  'moral'
                )
                " :style="estatusColor(ingredient.estatus_moral)">
                <option v-for="estatus_moral in listaEstatus" :key="estatus_moral" :value="estatus_moral">
                  {{ estatus_moral }}
                </option>
              </select>
            </td>
            <td>
              <select v-model="ingredient.estatus_bosques" @change="
                actualizarEstatus(
                  ingredient.id_ingrediente,
                  ingredient.estatus_bosques,
                  'bosques'
                )
                " :style="estatusColor(ingredient.estatus_bosques)">
                <option v-for="estatus_bosques in listaEstatus" :key="estatus_bosques" :value="estatus_bosques">
                  {{ estatus_bosques }}
                </option>
              </select>
            </td>
            <td style="font-size: 20px">
              {{ calculateInventoryDemand("moral", ingredient) }}
            </td>
            <td style="font-size: 20px">
              {{ calculateInventoryDemand("bosques", ingredient) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import API_URL from "../../config";
export default {
  name: "Compra",
  data() {
    return {
      ingredients: [],
      submissions: [],
      proveedores: [],
      selectedProveedor: "",
      searchTerm: "",
      selectedUrgencia: "Urgente",
      selectedInsumosTipo: "Todos",
      orderRouteCheckbox: false,
      duracionDiasSuministro: 3,
      selectedEstatusFilter: "Todos",
      listaEstatus: [
        "No Comprado",
        "Comprado",
        "Transferir Campestre a Moral",
        "Transferir Moral a Campestre",
        "Transferir de CEDIS",
        "Recibido",
        "Pausar compra",
        "Suficiente producto",
      ],
      checkedIngredients: []
    };
  },
  methods: {
    isChecked(ingredientId) {
      // Simply checks if the ingredient ID is in the array
      return this.checkedIngredients.includes(ingredientId);
    },
    toggleSelectAll(event) {
      if (event.target.checked) {
        this.checkedIngredients = this.filteredIngredients.map(ingredient => ingredient.id_ingrediente);
      } else {
        this.checkedIngredients = [];
      }
    },
    toggleCheck(ingredientId) {
      const index = this.checkedIngredients.indexOf(ingredientId);
      if (index === -1) {
        // If the ingredient ID is not in the array, add it
        this.checkedIngredients.push(ingredientId);
      } else {
        // If the ingredient ID is in the array, remove it
        this.checkedIngredients.splice(index, 1);
      }
      console.log(this.checkedIngredients)
    },
    exportToWhatsApp() {
      const phoneNumber = '+420774187964'; // The phone number you want to send the message to

      // Filter the ingredients to those that need to be exported and are checked
      const filteredIngredients = this.filteredIngredients.filter(ingredient => {
        const isNeeded = (this.getInventory("moral", ingredient.id_ingrediente) !== "Suficiente" ||
          this.getInventory("bosques", ingredient.id_ingrediente) !== "Suficiente") &&
          this.isChecked(ingredient.id_ingrediente);
        return isNeeded;
      });
      // Check if there are any ingredients to send
      if (filteredIngredients.length === 0) {
        alert("No ingredients selected to send.");
        return;
      }
      // Group ingredients by status to format the message
      const groupedByEstatus = filteredIngredients.reduce((acc, ingredient) => {
        const { estatus_moral, estatus_bosques } = ingredient;
        const estatus = estatus_moral === "Transferir de CEDIS" || estatus_bosques === "Transferir de CEDIS"
          ? "Transferir de CEDIS"
          : estatus_moral === "Transferir Campestre a Moral" || estatus_bosques === "Transferir Campestre a Moral"
            ? "Transferir Campestre a Moral"
            : estatus_moral === "Transferir Moral a Campestre" || estatus_bosques === "Transferir Moral a Campestre"
              ? "Transferir Moral a Campestre"
              : null;
        if (!acc[estatus]) {
          acc[estatus] = [];
        }
        acc[estatus].push(ingredient);
        return acc;
      }, {});
      const messageParts = [];
      // Include Transferir de CEDIS section if it exists
      if (groupedByEstatus["Transferir de CEDIS"]) {
        messageParts.push("TRANSFERENCIA CEDIS:\n" + this.formatIngredientsList(groupedByEstatus["Transferir de CEDIS"]));
      }
      // Include sections for individual proveedores
      Object.keys(groupedByEstatus).forEach(estatus => {
        if (!["Transferir de CEDIS", "Transferir Campestre a Moral", "Transferir Moral a Campestre"].includes(estatus)) {
          messageParts.push(`COMPRA DEL DIA:\n` + this.formatCompraDelDia(groupedByEstatus[estatus]));
        }
      });
      // Include sections for other estatus
      ["Transferir Campestre a Moral", "Transferir Moral a Campestre"].forEach(estatus => {
        if (groupedByEstatus[estatus]) {
          messageParts.push(`${estatus}:\n` + this.formatIngredientsList(groupedByEstatus[estatus]));
        }
      });
      // Encode the message
      const message = encodeURIComponent(`RESUMEN SUMINISTRO DEL DÍA:\n\n${messageParts.join('\n\n')}`);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      // Open the WhatsApp URL
      window.open(whatsappUrl, '_blank'); // This will open WhatsApp Web or the WhatsApp app with the pre-filled message for the specified number
    },

    formatCompraDelDia(ingredients) {
      const groupedByProveedor = ingredients.reduce((acc, ingredient) => {
        const { proveedor } = ingredient;
        if (!acc[proveedor]) {
          acc[proveedor] = [];
        }
        acc[proveedor].push(ingredient);
        return acc;
      }, {});

      let result = "";

      Object.keys(groupedByProveedor).forEach(proveedor => {
        result += `${proveedor}:\n`;
        groupedByProveedor[proveedor].forEach(ingredient => {
          result += `- ${this.formatIngredient(ingredient)}\n`;
        });
        result += "----\n";
      });

      return result;
    },

    formatIngredient(ingredient) {
      return `${ingredient.nombre} ${ingredient.unidad} Moral: ${this.getInventory("moral", ingredient.id_ingrediente)}, Campestre: ${this.getInventory("bosques", ingredient.id_ingrediente)}`;
    },

    formatIngredientsList(ingredients) {
      return ingredients.map(ingredient => {
        const moralInventory = this.getInventory("moral", ingredient.id_ingrediente);
        const bosquesInventory = this.getInventory("bosques", ingredient.id_ingrediente);
        return `- ${ingredient.nombre} ${ingredient.unidad} Moral: ${moralInventory}, Campestre: ${bosquesInventory}`;
      }).join('\n');
    },
    async actualizarEstatus(ingredientId, newStatus, store) {
      try {
        const response = await fetch(`${API_URL}/ingredientes/individual/estatusupdate/${store}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingredientId, newStatus, store }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        // Update the local state to reflect the change
        const ingredient = this.ingredients.find(ing => ing.id_ingrediente === ingredientId);
        if (store === 'moral') {
          ingredient.estatus_moral = newStatus;
        } else if (store === 'bosques') {
          ingredient.estatus_bosques = newStatus;
        }
      } catch (error) {
        console.error('Error updating status:', error);
      }
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
    calculateInventoryDemand(type, ingredient) {
      let demand =
        (ingredient[`${type}_demanda_semanal`] * this.duracionDiasSuministro) /
        7;
      let inventory =
        typeof this.getInventory(type, ingredient.id_ingrediente) === "string"
          ? this.getInventory(type, ingredient.id_ingrediente) === "Suficiente"
            ? 0
            : demand
          : demand - this.getInventory(type, ingredient.id_ingrediente);
      return Math.max(0, inventory).toFixed(1);
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
    getProveedorName(id) {
      const proveedor = this.proveedores.find(
        (proveedor) => proveedor.id === id
      );
      return proveedor ? proveedor.nombre : "N/A";
    },
    lastUpdate(store) {
      const storeSubmissions = this.submissions.filter(
        (submission) => submission.store === store
      );
      if (storeSubmissions.length > 0) {
        const lastSubmission = storeSubmissions.reduce((latest, current) =>
          new Date(latest.timestamp) > new Date(current.timestamp)
            ? latest
            : current
        );
        const lastUpdate = new Date(lastSubmission.timestamp).toLocaleString();
        return lastUpdate;
      } else {
        return "N/A";
      }
    },
    getIngredientStatus(ingredientId) {
      // const submission = this.lastSubmission(store);
      // if (!submission) {
      //   return "N/A";
      // }
      // console.log(submission);
      // if (
      //   this.filteredIngredients.some(
      //     (ingredient) => ingredient.id_ingrediente === ingredientId
      //   )
      // ) {
      //   console.log(ingredientId)
      // }
    },
    estatusColor(estatus) {
      switch (estatus) {
        case "No Comprado":
          return { backgroundColor: "lightcoral", color: "white" };
        case "Transferir Moral a Campestre":
        case "Transferir Campestre a Moral":
        case "Transferir de CEDIS":
          return { backgroundColor: "yellow", color: "black" };
        case "Comprado":
          return { backgroundColor: "lightgreen", color: "black" };
        case "Pausar compra":
        case "Suficiente producto":
          return { backgroundColor: "red", color: "white" };
        case "Recibido":
          return { backgroundColor: "green", color: "white" };
        default:
          return {};
      }
    },
    cambiarProveedor() {
      console.log("cambiar proveedor");
    },
  },
  computed: {
    todaysSubmissions() {
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];

      return this.submissions.filter((submission) => {
        const submissionDate = new Date(submission.timestamp);
        const submissionDateString = submissionDate.toISOString().split("T")[0];
        // console.log(submissionDateString, todayString); // Log the dates (for debugging purposes
        return submissionDateString === todayString;
      });
    },
    filteredIngredients() {
      let ingredients = this.ingredients;

      ingredients = ingredients.filter(
        (ingredient) => ingredient.proveedor_id !== 1
      );

      if (this.selectedProveedor) {
        ingredients = ingredients.filter(
          (ingredient) => ingredient.proveedor_id === this.selectedProveedor
        );
      }

      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        ingredients = ingredients.filter((ingredient) =>
          ingredient.nombre.toLowerCase().includes(term)
        );
      }

      if (this.selectedUrgencia === "Urgente") {
        ingredients = ingredients.filter((ingredient) => {
          const moralInventory = this.getInventory(
            "moral",
            ingredient.id_ingrediente
          );
          const bosquesInventory = this.getInventory(
            "bosques",
            ingredient.id_ingrediente
          );
          return (
            moralInventory !== "Suficiente" || bosquesInventory !== "Suficiente"
          );
        });
      }

      if (this.selectedInsumosTipo === "Lista Peligro") {
        ingredients = ingredients.filter((ingredient) => {
          return ingredient.producto_clave;
        });
      }

      if (this.selectedEstatusFilter !== "Todos") {
        ingredients = ingredients.filter((ingredient) => {
          return (
            ingredient.estatus_moral === this.selectedEstatusFilter ||
            ingredient.estatus_bosques === this.selectedEstatusFilter
          );
        });
      }

      if (this.orderRouteCheckbox) {
        ingredients.sort((a, b) => a.store_route_order - b.store_route_order);
      }

      ingredients.sort((a, b) => {
        const aStatusIndex = Math.min(
          this.listaEstatus.indexOf(a.estatus_moral),
          this.listaEstatus.indexOf(a.estatus_bosques)
        );
        const bStatusIndex = Math.min(
          this.listaEstatus.indexOf(b.estatus_moral),
          this.listaEstatus.indexOf(b.estatus_bosques)
        );
        return aStatusIndex - bStatusIndex;
      });

      return ingredients;
    },
    sortedProveedores() {
      // Create a Set of unique proveedor_id values from the ingredientes in all submissions
      const proveedorIds = new Set();
      this.filteredIngredients.forEach((ingredient) => {
        proveedorIds.add(ingredient.proveedor_id);
      });

      // Filter the proveedores based on whether their id is in the Set
      const filteredProveedores = this.proveedores.filter((proveedor) => {
        const isMatch = proveedorIds.has(proveedor.id);
        // if (!isMatch) {
        //   console.log("No match for proveedor id:", proveedor.id);
        // }
        return isMatch;
      });

      const order = ["HEB", "COSTCO", "SAMS", "WALMART"];
      return filteredProveedores.sort((a, b) => {
        if (order.includes(a.nombre) && order.includes(b.nombre)) {
          return order.indexOf(a.nombre) - order.indexOf(b.nombre);
        }
        if (order.includes(a.nombre)) {
          return -1;
        }
        if (order.includes(b.nombre)) {
          return 1;
        }
        return a.nombre.localeCompare(b.nombre);
      });
    },
    totalPresupuestoSuministro() {
      return this.filteredIngredients
        .reduce((total, ingredient) => {
          let moralDemand = 0;
          let bosquesDemand = 0;

          if (ingredient.cantidad !== "Suficiente") {
            if (typeof ingredient.cantidad === "string") {
              moralDemand = 0;
              bosquesDemand = 0;
            } else {
              if (
                ingredient.estatus_moral === "No Comprado" ||
                ingredient.estatus_moral === "Comprado"
              ) {
                moralDemand = Number(
                  this.calculateInventoryDemand("moral", ingredient)
                );
              }
              if (
                ingredient.estatus_bosques === "No Comprado" ||
                ingredient.estatus_bosques === "Comprado"
              ) {
                bosquesDemand = Number(
                  this.calculateInventoryDemand("bosques", ingredient)
                );
              }
            }
          }
          return total + (moralDemand + bosquesDemand) * ingredient.precio;
        }, 0)
        .toFixed(1);
    },
  },
  watch: {
    todaysSubmissions: {
      handler(newVal, oldVal) {
        // Call getInventory for each submission and each ingredient
        newVal.forEach((submission) => {
          this.ingredients.forEach((ingredient) => {
            this.getInventory(submission.store, ingredient.id);
          });
        });
      },
      deep: true,
    },
  },
  async mounted() {
    const response = await fetch(`${API_URL}/ingredientes`);
    if (response.ok) {
      this.ingredients = await response.json();
      const estatusOrder = [
        "No Comprado",
        "Transferir Campestre a Moral",
        "Transferir Moral a Campestre",
        "Transferir de Cedis",
        "Comprado",
        "Recibido",
        "Suficiente producto",
        "Pausar compra",
      ];
      this.ingredients.sort((a, b) => {
        // Sort by estatus first
        const estatusA = estatusOrder.indexOf(a.estatus_moral);
        const estatusB = estatusOrder.indexOf(b.estatus_moral);
        if (estatusA !== estatusB) {
          return estatusA - estatusB;
        }
        // If estatus is the same, sort by producto_clave (true values come first)
        if (a.producto_clave !== b.producto_clave) {
          return b.producto_clave - a.producto_clave;
        }
        // here
        // If producto_clave is the same, sort alphabetically
        return a.nombre.localeCompare(b.nombre);
      });
    } else {
      console.error("HTTP error:", response.status);
    }

    const submissionsResponse = await fetch(`${API_URL}/submissions/all-submissions`);
    if (submissionsResponse.ok) {
      this.submissions = await submissionsResponse.json();
    } else {
      console.error("HTTP error:", submissionsResponse.status);
    }

    const proveedoresResponse = await fetch(`${API_URL}/proveedores`);
    if (proveedoresResponse.ok) {
      let proveedores = await proveedoresResponse.json();
      // Filter out the provider with id 1
      this.proveedores = proveedores.filter((proveedor) => proveedor.id !== 1);
    } else {
      console.error("HTTP error:", proveedoresResponse.status);
    }
    // Get unique stores
    const stores = [
      ...new Set(this.submissions.map((submission) => submission.store)),
    ];

    // Log the latest submission for each store
    stores.forEach((store) => {
      const latestSubmission = this.lastSubmission(store);
    });
  },
};
</script>

<style scoped>
.filterBar {
  @apply ml-2 h-8 text-base w-1/2;
}

.table-container {
  /* Container width set to 80% of the viewport */
  max-width: 100%;
  /* Ensures it doesn't exceed the viewport width */
  overflow-x: auto;
  /* Enables horizontal scrolling */
  margin: 1rem auto;
  /* Centers the table container and adds vertical spacing */
  display: block;
  /* Ensures the container behaves as a block for centering */
}

</style>