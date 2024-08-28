<template>
  <div>
    <h1>Historial de Insumos</h1>
    <table>
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Cantidad</th>
          <th>Total gastado</th>
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
          <td>${{ ingredient.total_price }}</td>
          <td>${{ (ingredient.total_price / ingredient.total_quantity).toFixed(2) }}/{{ ingredient.unidad }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import API_URL from "../../config";

export default {
  data() {
    return {
      ingredients: [],
    };
  },
  async created() {
    // Fetch the data for each ingredient from your server
    const response = await fetch(`${API_URL}/historial_insumos`);
    this.ingredients = await response.json();
  },
};
</script>