<template>
  <div>
    <!-- Title with the ingredient name -->
    <h1 v-if="history[0]">{{ history[0].nombre }} - HISTORIAL</h1>

    <!-- Header with "Costo en recetas" analysis -->
    <div v-if="currentPrice">
      <p>Costo en recetas ${{ currentPrice }} / {{ unidad }}</p>
      <p>Precio promedio histórico: ${{ averagePrice }} / {{ unidad }}</p>
      <p>
        Cambio porcentual: 
        <span :class="priceChange >= 0 ? 'positive' : 'negative'">
          {{ priceChange.toFixed(2) }}%
        </span>
      </p>
    </div>

    <!-- Historical data table -->
    <table v-if="history.length">
      <thead>
        <tr>
          <th>Número ticket</th>
          <th>Fecha</th>
          <th>Proveedor</th>
          <th>Cantidad</th>
          <th>Precio promedio por insumo</th>
          <th>Importe Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in history" :key="item.id">
          <td>{{ item.folio }}</td>
          <td>{{ item.fecha }}</td>
          <td>{{ item.emisor }}</td>
          <td>{{ item.quantity }}</td>
          <td>${{ (item.total_price / item.quantity).toFixed(2) }}</td>
          <td>${{ item.total_price }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No se encontró historia para este ingrediente.</p>

    <!-- Graph for price fluctuations -->
    <div>
      <canvas id="priceFluctuationChart"></canvas>
    </div>
  </div>
</template>

<script>
import API_URL from "../../config";
import { Chart, registerables } from 'chart.js'; // Import Chart.js
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

export default {
  data() {
    return {
      id: null,
      history: [],
      currentPrice: null,
      unidad:null,
      averagePrice: 0,
      priceChange: 0,
    };
  },
  async mounted() {
    // Retrieve the ID from the route
    this.id = this.$route.params.id;

    // Fetch historical data
    try {
      const response = await fetch(`${API_URL}/historial_insumos/insumo/${this.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.history = await response.json();

      // Ensure all quantities are treated as numbers
      const totalPriceSum = this.history.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
      const totalQuantitySum = this.history.reduce((sum, item) => sum + parseFloat(item.quantity), 0);

      // Calculate average historical price
      this.averagePrice = (totalPriceSum / totalQuantitySum).toFixed(2);

      // Fetch current price of the ingredient
      const priceResponse = await fetch(`${API_URL}/ingrediente/${this.id}`);
      if (!priceResponse.ok) {
        throw new Error(`HTTP error! status: ${priceResponse.status}`);
      }
      const ingredientData = await priceResponse.json();
      this.currentPrice = ingredientData.precio;
      this.unidad = ingredientData.unidad

      // Calculate percentage change
      this.priceChange = ((this.currentPrice - this.averagePrice) / this.averagePrice) * 100;

      // Initialize graph after fetching data
      this.createPriceFluctuationGraph();
    } catch (error) {
      console.error("Error:", error);
    }
  },
  methods: {
    createPriceFluctuationGraph() {
      const ctx = document.getElementById('priceFluctuationChart').getContext('2d');
      const dates = this.history.map(item => item.fecha);
      const prices = this.history.map(item => (item.total_price / item.quantity).toFixed(2));

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Precio promedio por insumo',
            data: prices,
            borderColor: 'blue',
            fill: false,
          }]
        },
        options: {
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'month'
              }
            },
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }
};
</script>
