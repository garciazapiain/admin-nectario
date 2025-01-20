<template>
  <div>
    <!-- Title with the ingredient name -->
    <h1 v-if="history[0]">{{ history[0].nombre }} - HISTORIAL</h1>

    <!-- Date range picker -->
    <div>
      <label for="start-date">Start Date:</label>
      <input type="date" v-model="startDate" @change="filterDataByDate" />
      <label for="end-date">End Date:</label>
      <input type="date" v-model="endDate" @change="filterDataByDate" />
    </div>

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
    <table v-if="filteredHistory.length">
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
        <tr v-for="item in filteredHistory" :key="item.id">
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
      filteredHistory: [],
      currentPrice: null,
      unidad: null,
      averagePrice: 0,
      priceChange: 0,
      startDate: null,
      endDate: null,
      chart: null,
    };
  },
  async mounted() {
    this.id = this.$route.params.id;

    try {
      const response = await fetch(`${API_URL}/historial_insumos/insumo/${this.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.history = await response.json();
      this.filteredHistory = this.history; // Initialize with all history

      const totalPriceSum = this.history.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
      const totalQuantitySum = this.history.reduce((sum, item) => sum + parseFloat(item.quantity), 0);

      this.averagePrice = (totalPriceSum / totalQuantitySum).toFixed(2);

      const priceResponse = await fetch(`${API_URL}/ingredientes/${this.id}`);
      if (!priceResponse.ok) {
        throw new Error(`HTTP error! status: ${priceResponse.status}`);
      }
      const ingredientData = await priceResponse.json();
      this.currentPrice = ingredientData.precio;
      this.unidad = ingredientData.unidad;

      this.priceChange = ((this.currentPrice - this.averagePrice) / this.averagePrice) * 100;

      this.createPriceFluctuationGraph();
    } catch (error) {
      console.error("Error:", error);
    }
  },
  methods: {
    filterDataByDate() {
      if (this.startDate && this.endDate) {
        this.filteredHistory = this.history.filter(item => {
          const itemDate = new Date(item.fecha);
          return itemDate >= new Date(this.startDate) && itemDate <= new Date(this.endDate);
        });
      } else {
        this.filteredHistory = this.history;
      }

      this.updatePriceFluctuationGraph();
    },
    createPriceFluctuationGraph() {
      const ctx = document.getElementById('priceFluctuationChart').getContext('2d');

      if (this.chart) {
        this.chart.destroy(); // Destroy previous chart instance to avoid overlap
      }

      this.chart = new Chart(ctx, {
        type: 'line',
        data: this.getChartData(),
        options: {
          scales: {
            x: {
              type: 'time',
              time: {
                unit: this.filteredHistory.length <= 3 ? 'day' : 'month', // Adjust based on the number of points
              },
            },
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    },
    updatePriceFluctuationGraph() {
      if (this.chart) {
        this.chart.destroy(); // Destroy the existing chart instance
      }
      this.createPriceFluctuationGraph(); // Re-create the chart with updated data
    },
    getChartData() {
      const dates = this.filteredHistory.map(item => item.fecha);
      const prices = this.filteredHistory.map(item => (item.total_price / item.quantity).toFixed(2));

      return {
        labels: dates,
        datasets: [{
          label: 'Precio promedio por insumo',
          data: prices,
          borderColor: 'blue',
          fill: false,
        }],
      };
    },
  },
};
</script>
