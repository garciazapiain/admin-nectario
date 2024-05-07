<template>
  <div>
    <!-- // Add a title with the ingredient name -->
    <h1 v-if="history[0]">{{ history[0].nombre }} - HISTORIAL</h1>
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
          <td>${{ (item.total_price / item.quantity).toFixed(2)}}</td>
          <td>${{ item.total_price }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No se encontro historia para este ingrediente.</p>
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
      const response = await fetch(
        `${API_URL}/historial_insumos/insumo/${this.id}`
      );
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