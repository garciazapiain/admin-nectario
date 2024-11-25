<template>
    <div>
      <h1>Gestión de Planeación de Compra</h1>
      <div v-if="!isLoaded" class="loading-message">Cargando datos...</div>
      <div v-else>
        <div v-for="(ingredientes, proveedor) in groupedByProveedor" :key="proveedor">
          <!-- Headline for each proveedor -->
          <h2>{{ proveedor }}</h2>
          <!-- Table for each proveedor -->
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Surtir Moral</th>
                <th>Surtir Bosques</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ingrediente in ingredientes" :key="ingrediente.id_ingrediente">
                <td>{{ ingrediente.nombre }}</td>
                <td>{{ ingrediente.surtir_moral }}</td>
                <td>{{ ingrediente.surtir_campestre }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from "vue";
  import API_URL from "../../config";
  
  const planeacionCompra = ref([]);
  const isLoaded = ref(false);
  
  // Fetch data from the API
  const fetchPlaneacionCompra = async () => {
    try {
      const response = await fetch(`${API_URL}/planeacion_compra`);
      if (!response.ok) throw new Error(`Error ${response.status}: Failed to fetch data`);
      planeacionCompra.value = await response.json();
      isLoaded.value = true;
    } catch (error) {
      console.error("Error fetching planeacion_compra:", error);
    }
  };
  
  // Group data by proveedor
  const groupedByProveedor = computed(() => {
    return planeacionCompra.value.reduce((grouped, ingrediente) => {
      if (!grouped[ingrediente.proveedor]) {
        grouped[ingrediente.proveedor] = [];
      }
      grouped[ingrediente.proveedor].push(ingrediente);
      return grouped;
    }, {});
  });
  
  // Fetch data on component mount
  onMounted(() => {
    fetchPlaneacionCompra();
  });
  </script>
  
  <style scoped>
  .loading-message {
    font-size: 18px;
    color: gray;
  }
  
  .table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  
  .table th,
  .table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  
  </style>
  