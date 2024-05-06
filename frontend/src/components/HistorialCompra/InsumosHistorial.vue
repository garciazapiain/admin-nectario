<template>
  <div>
    <h1>Historial de Insumos</h1>
    <div v-for="ingredient in ingredients" :key="ingredient.nombre">
      <h2>{{ ingredient.nombre }}</h2>
      <p>Quantity: {{ ingredient.total_quantity }}</p>
      <p>Total Price: {{ ingredient.total_price }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      ingredients: [],
    };
  },
  async created() {
    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";
    // Fetch the data for each ingredient from your server
    const response = await fetch(`${API_URL}/historial_insumos`);
    this.ingredients = await response.json();
  },
};
</script>