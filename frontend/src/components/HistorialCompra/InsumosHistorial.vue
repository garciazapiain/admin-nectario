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
          <th>Costo en receta</th>
          <th>Diferencia %</th>
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
          <td>${{ ingredient.precio }}/{{ ingredient.unidad }}</td>
          <td :class="getDifferenceClass(ingredient)">
            {{ calculateDifferencePercentage(ingredient).toFixed(2) }}%
          </td>
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
  methods: {
    calculateDifferencePercentage(ingredient) {
      // Calculate the average price per unit
      const averagePrice = ingredient.total_price / ingredient.total_quantity;
      // Calculate the percentage difference between the average price and the current cost
      const difference = ((averagePrice - ingredient.precio) / ingredient.precio) * 100;
      return difference;
    },
    getDifferenceClass(ingredient) {
      const difference = this.calculateDifferencePercentage(ingredient);
      if (difference > 5) {
        return 'text-red-500';  // Class for positive difference (red)
      } else if (difference < -5) {
        return 'text-green-500';  // Class for negative difference (green)
      } else {
        return 'black-text-500';  // Class for neutral difference (black)
      }
    },
  },
};
</script>