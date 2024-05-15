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
        <div className="filtros-container">
          <label for="proveedor">Proveedor:</label>
          <select class="filterBar" id="proveedor" v-model="selectedProveedor">
            <option value="">Todos</option>
            <option
              v-for="proveedor in sortedProveedores"
              :value="proveedor.id"
              :key="proveedor.id"
            >
              {{ proveedor.nombre }}
            </option>
          </select>
          <label for="insumos">Tipo Insumos:</label>
          <select
            class="filterBar"
            id="insumos-tipo"
            v-model="selectedInsumosTipo"
          >
            <option value="Lista Peligro">Lista Peligro</option>
            <option value="Todos">Todos</option>
          </select>
          <label for="insumos">Estatus Insumos:</label>
          <select class="filterBar" id="insumos" v-model="selectedInsumos">
            <option value="Urgente">Urgente</option>
            <option value="Todos">Todos</option>
          </select>
          <div className="orderRouteCheckbox">
            <input
              type="checkbox"
              id="sort"
              v-model="orderRouteCheckbox"
              :disabled="selectedProveedor === ''"
            />
            <label for="sort">Ruta de tienda</label>
          </div>
          <div className="duracionDiasSuministro">
            <label for="duracion">Duracion dias de suministro:</label>
            <input
              type="number"
              id="duracion"
              v-model="duracionDiasSuministro"
              min="1"
            />
          </div>
        </div>
        <div class="flex-row">
          Presupuesto Estimado Suministro:
          <p class="large-text">${{ totalPresupuestoSuministro }}</p>
        </div>
      </div>
      <input
        class="search-bar"
        v-model="searchTerm"
        placeholder="Buscar insumo"
      />
    </div>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Exi. Moral</th>
          <th>Exi. Campestre</th>
          <th>Proveedor</th>
          <th>Estatus</th>
          <th>Surtir Moral</th>
          <th>Surtir Campestre</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(ingredient, index) in filteredIngredients"
          :key="index"
          :class="{ 'highlight-row': ingredient.producto_clave }"
        >
          <td style="font-size: 20px">
            {{ ingredient.nombre }}
            <i class="info-icon" @click="logIngredientName(ingredient.nombre)"
              >i</i
            >
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
            <select class="small-text" v-model="ingredient.proveedor_id">
              <option
                v-for="proveedor in proveedores"
                :value="proveedor.id"
                :key="proveedor.id"
              >
                {{ proveedor.nombre }}
              </option>
            </select>
          </td>
          <td>
            <select
              v-model="ingredient.estatus"
              @change="
                actualizarEstatus(ingredient.id_ingrediente, ingredient.estatus)
              "
              :style="estatusColor(ingredient.estatus)"
            >
              <option
                v-for="estatus in listaEstatus"
                :key="estatus"
                :value="estatus"
              >
                {{ estatus }}
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
</template>

<script>
export default {
  name: "Compra",
  data() {
    return {
      ingredients: [],
      submissions: [],
      proveedores: [],
      selectedProveedor: "",
      searchTerm: "",
      selectedInsumos: "Urgente",
      selectedInsumosTipo: "Todos",
      orderRouteCheckbox: false,
      duracionDiasSuministro: 3,
      listaEstatus: [
        "No Comprado",
        "Comprado",
        "Transferir Campestre a Moral",
        "Transferir Moral a Campestre",
        "Pausar compra",
        "Suficiente producto",
      ],
    };
  },
  methods: {
    actualizarEstatus(ingredientId, newStatus) {
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";
      fetch(`${API_URL}/ingredientes/individual/estatusupdate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientId, newStatus }),
      });
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
      // console.log("storeSubmissions:", storeSubmissions);
      if (storeSubmissions.length > 0) {
        const lastSubmission = storeSubmissions.reduce((latest, current) =>
          new Date(latest.timestamp) > new Date(current.timestamp)
            ? latest
            : current
        );
        // console.log("lastSubmission:", lastSubmission);
        const lastUpdate = new Date(lastSubmission.timestamp).toLocaleString();
        // console.log("lastUpdate:", lastUpdate);
        return lastUpdate;
      } else {
        return "N/A";
      }
    },
    logIngredientName(name) {
      console.log("Hey", name);
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
          return { backgroundColor: "yellow", color: "black" };
        case "Pausar compra":
        case "Comprado":
        case "Suficiente producto":
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

      if (this.selectedInsumos === "Urgente") {
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

      console.log(this.orderRouteCheckbox);

      if (this.orderRouteCheckbox) {
        ingredients.sort((a, b) => a.store_route_order - b.store_route_order);
      }

      console.log(ingredients);

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
              moralDemand = Number(
                this.calculateInventoryDemand("moral", ingredient)
              );
              bosquesDemand = Number(
                this.calculateInventoryDemand("bosques", ingredient)
              );
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
    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";
    const response = await fetch(`${API_URL}/ingredientes`);
    if (response.ok) {
      this.ingredients = await response.json();
      const estatusOrder = [
        "No Comprado",
        "Transferir Campestre a Moral",
        "Transferir Moral a Campestre",
        "Pausar compra",
        "Comprado",
        "Suficiente producto",
      ];
      this.ingredients.sort((a, b) => {
        // Sort by estatus first
        const estatusA = estatusOrder.indexOf(a.estatus);
        const estatusB = estatusOrder.indexOf(b.estatus);
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

    const submissionsResponse = await fetch(`${API_URL}/submissions`);
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
      console.log(`Latest submission for store ${store}:`, latestSubmission);
    });
  },
};
</script>

<style scoped>
.filterBar {
  margin-left: 10px;
  height: 2rem;
  font-size: 1rem;
  width: 50%;
}
.search-bar {
  width: 50%;
  padding: 10px;
  font-size: 16px;
}
.highlight-row {
  background-color: rgb(97, 133, 145);
  font-weight: bold;
  color: black;
}
.filtros-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  widows: 100%;
}
.orderRouteCheckbox {
  display: flex;
  flex-direction: row;
}
.large-text {
  font-size: 2em; /* Adjust as needed */
}
.flex-column {
  display: flex;
  flex-direction: column;
}

.small-text {
  font-size: 0.8em; /* Adjust as needed */
}

.info-icon {
  background: white;
  border-radius: 50%;
  width: 2rem;
  padding: 5px;
}
</style>