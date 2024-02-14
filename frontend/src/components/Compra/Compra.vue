<template>
  <div>
    <h1>Compra</h1>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Proveedor</th>
          <th>Moral</th>
          <th>Bosques</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(ingredient, index) in ingredients" :key="index">
          <td>{{ ingredient.nombre }}</td>
          <td>{{ ingredient.unidad }}</td>
          <td>{{ ingredient.proveedor }}</td>
          <td>{{ getInventory("moral", ingredient.id_ingrediente) }}</td>
          <td>{{ getInventory("bosques", ingredient.id_ingrediente) }}</td>
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
    };
  },
  methods: {
    getInventory(store, ingredientId) {
      const submission = this.todaysSubmissions.find(
        (sub) => sub.store === store
      );
      if (!submission) {
        console.log(`No submission found for store: ${store}`);
        return "N/A";
      }

      const ingredient = submission.compra.find(
        (ing) => ing.id_ingrediente === ingredientId
      );
      if (!ingredient) {
        console.log(
          `No ingredient found for id: ${ingredientId} in store: ${store}`
        );
        return "N/A";
      }

      console.log(
        `Found ingredient: ${JSON.stringify(
          ingredient
        )} for id: ${ingredientId} in store: ${store}`
      );
      return ingredient.cantidad_inventario;
    },
  },
  computed: {
    todaysSubmissions() {
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];

      return this.submissions.filter((submission) => {
        const submissionDate = new Date(submission.timestamp);
        const submissionDateString = submissionDate.toISOString().split("T")[0];

        return submissionDateString === todayString;
      });
    },
  },
  watch: {
    todaysSubmissions(newVal) {
      console.log(newVal); // Log today's submissions
    },
  },
  async mounted() {
    const response = await fetch("http://localhost:3000/api/ingredientes");
    if (response.ok) {
      this.ingredients = await response.json();
    this.ingredients.sort((a, b) => a.nombre.localeCompare(b.nombre));
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
  },
};
</script>

<style scoped>
/* Add any custom styles here */
</style>