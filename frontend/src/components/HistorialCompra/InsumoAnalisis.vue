<template>
  <div>
    <h1>Insumo Analisis</h1>
    <p>ID: {{ id }}</p>
    <table v-if="history.length">
      <thead>
        <tr>
          <th>Purchase Order ID</th>
          <th>Quantity</th>
          <th>Price Per Item</th>
          <th>Total Price</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in history" :key="item.id">
          <td>{{ item.purchase_order_id }}</td>
          <td>{{ item.quantity }}</td>
          <td>{{ item.price_per_item }}</td>
          <td>{{ item.total_price }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No history found for this ingredient.</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      id: null,
      history: [],
    };
  },
  async mounted() {
    // Retrieve the ID from the route
    this.id = this.$route.params.id;

    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";

    // Make the API call
    try {
      const response = await fetch(`${API_URL}/historial_insumos/insumo/${this.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.history = await response.json();
    } catch (error) {
      console.error("Error:", error);
    }
  },
};
</script>