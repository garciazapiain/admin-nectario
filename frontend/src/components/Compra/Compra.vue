<template>
  <div>
    <h1>Compra</h1>
    <div class="update-info">
      <p class="update-text">
        Última actualización Moral:
        <span class="timestamp">{{ lastUpdate("moral") }}</span>
      </p>
      <p class="update-text">
        Última actualización Bosques:
        <span class="timestamp">{{ lastUpdate("bosques") }}</span>
      </p>
    </div>
    <div>
      <div>
        <h2>Filtros:</h2>
        <label for="proveedor">Proveedor:</label>
        <select id="proveedor" v-model="selectedProveedor">
          <option value="">Todos</option>
          <option
            v-for="proveedor in proveedores"
            :value="proveedor.id"
            :key="proveedor.id"
          >
            {{ proveedor.nombre }}
          </option>
        </select>
      </div>
      <input v-model="searchTerm" placeholder="Buscar insumo" />
    </div>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Moral</th>
          <th>Bosques</th>
          <th>Proveedor</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(ingredient, index) in filteredIngredients"
          :key="index"
          :class="{ 'highlight-row': ingredient.producto_clave }"
        >
          <td>{{ ingredient.nombre }}</td>
          <td>{{ ingredient.unidad }}</td>
          <td>{{ getInventory("moral", ingredient.id_ingrediente) }}</td>
          <td>{{ getInventory("bosques", ingredient.id_ingrediente) }}</td>
          <td>{{ getProveedorName(ingredient.proveedor_id) }}</td>
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
    };
  },
  methods: {
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

      return ingredients;
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
    const response = await fetch("http://localhost:3000/api/ingredientes");
    if (response.ok) {
      this.ingredients = await response.json();
      this.ingredients.sort((a, b) => {
        // Sort by producto_clave first (true values come first)
        if (a.producto_clave !== b.producto_clave) {
          return b.producto_clave - a.producto_clave;
        }
        // If producto_clave is the same, sort alphabetically
        return a.nombre.localeCompare(b.nombre);
      });
    } else {
      console.error("HTTP error:", response.status);
    }

    const submissionsResponse = await fetch(
      "http://localhost:3000/api/submissions"
    );
    if (submissionsResponse.ok) {
      this.submissions = await submissionsResponse.json();
    } else {
      console.error("HTTP error:", submissionsResponse.status);
    }

    const proveedoresResponse = await fetch(
      "http://localhost:3000/api/proveedores"
    );
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
.highlight-row {
  background-color: rgb(97, 133, 145);
  font-weight: bold;
  color: black;
}
</style>