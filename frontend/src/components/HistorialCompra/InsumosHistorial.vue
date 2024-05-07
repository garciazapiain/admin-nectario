<template>
  <div>
    <h1>Historial de Insumos</h1>
    <table>
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Cantidad</th>
          <th>Precio total</th>
          <th>Precio promedio</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ingredient in ingredients" :key="ingredient.nombre">
          <td>
            <router-link :to="`${$route.path}/${ingredient.id_ingrediente}`">{{
              ingredient.nombre
            }}</router-link>
          </td>
          <td>{{ ingredient.total_quantity }}</td>
          <td>{{ ingredient.total_price }}</td>
          <td>{{ ingredient.total_price / ingredient.total_quantity }}</td>
        </tr>
      </tbody>
    </table>
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