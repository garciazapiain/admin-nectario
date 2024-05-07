<template>
  <div>
    <h1>Resumen Existencias Lista Peligro</h1>
    <p>Ultima actualización Moral: {{ lastUpdatedMoral }}</p>
    <p>Ultima actualización Campestre: {{ lastUpdatedCampestre }}</p>
    <table>
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Unidad</th>
          <th>Moral</th>
          <th>Campestre</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ingredient in ingredients" :key="ingredient.id">
          <td>{{ ingredient.nombre }}</td>
          <td>{{ ingredient.unidad }}</td>
          <td>{{ getInventory("moral", ingredient.id_ingrediente) }}</td>
          <td>{{ getInventory("bosques", ingredient.id_ingrediente) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "ResumenExistencias",
  data() {
    return {
      submissions: [],
      ingredients: [], // You need to fetch the ingredients data
    };
  },
  async created() {
    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";
    const submissionsResponse = await fetch(`${API_URL}/submissions`);
    if (submissionsResponse.ok) {
      this.submissions = await submissionsResponse.json();
    } else {
      console.error("HTTP error:", submissionsResponse.status);
    }
    // Fetch the ingredients data
    const response = await fetch(`${API_URL}/ingredientes`);
    if (response.ok) {
      this.ingredients = await response.json();
      this.ingredients = this.ingredients
        .filter((ingredient) => ingredient.producto_clave)
        .sort((a, b) => {
          // If estatus is the same, sort by producto_clave (true values come first)
          if (a.producto_clave !== b.producto_clave) {
            return b.producto_clave - a.producto_clave;
          }
          // If producto_clave is the same, sort alphabetically
          return a.nombre.localeCompare(b.nombre);
        });
    } else {
      console.error("HTTP error:", response.status);
    }
  },
  computed: {
    lastUpdatedMoral() {
      const lastSubmission = this.lastSubmission("moral");
      return lastSubmission
        ? new Date(lastSubmission.timestamp).toLocaleString()
        : "N/A";
    },
    lastUpdatedCampestre() {
      const lastSubmission = this.lastSubmission("bosques");
      return lastSubmission
        ? new Date(lastSubmission.timestamp).toLocaleString()
        : "N/A";
    },
  },
  methods: {
    getInventory(storeName, ingredientId) {
      const submission = this.lastSubmission(storeName);

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
  },
};
</script>

<style scoped>
/* Add any custom styles here */
</style>