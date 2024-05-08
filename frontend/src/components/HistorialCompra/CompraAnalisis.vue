<template>
  <div>
    <h1>Compra Analisis</h1>
    <p>Fecha:{{order.fecha}}</p>
    <p># Ticket:{{order.folio}}</p>
    <p>Proveedor:{{order.emisor}}</p>
    <table>
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Unidad</th>
          <th>Cantidad Comprada</th>
          <th>Precio promedio / unidad</th>
          <th>Total importe</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in order.items" :key="item.id">
          <td>{{ item.nombre }}</td>
          <td>{{ item.unidad }}</td>
          <td>{{ item.quantity }}</td>
          <td>${{ (item.total_price / item.quantity).toFixed(2) }}</td>
          <td>${{ item.total_price }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "CompraAnalisis",
  data() {
    return {
      order: {
        items: [],
        emisor: "",
        fecha: "",
        ticket: "",
      },
    };
  },
  async created() {
    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";
    const id = this.$route.params.id; // Get the id from the route params
    const response = await fetch(`${API_URL}/historialcompra/compra/${id}`);
    this.order = await response.json();
  },
};
</script>

<style scoped>
/* Add any custom styles here */
</style>