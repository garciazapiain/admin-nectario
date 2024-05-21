<template>
  <div>
    <h1>Consumo de insumos</h1>
    <router-link :to="cargarVentasRoute">
      <button>Cargar ventas</button>
    </router-link>
  </div>
</template>

<script>
export default {
  name: "ConsumoInsumos",
  computed: {
    cargarVentasRoute() {
      return this.$route.path + '/cargarventa';
    },
  },
};
</script>

<style scoped>
</style>