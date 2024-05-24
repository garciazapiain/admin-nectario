<template>
  <div>
    <h1>Consumo de insumos</h1>
    <input type="date" v-model="startDate" />
    <input type="date" v-model="endDate" />
    <button @click="fetchConsumptionData">Obtener data</button>
    <table>
      <thead>
        <tr>
          <th>Ingredient Name</th>
          <th>Unit</th>
          <th>Total Consumed (Moral)</th>
          <th>Total Consumed (Bosques)</th>
          <th>Total Consumed (Moral + Bosques)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredConsumptionData" :key="item.id_ingrediente">
          <td>{{ item.nombre }}</td>
          <td>{{ item.unidad }}</td>
          <td>{{ item.total_consumido_moral }}</td>
          <td>{{ item.total_consumido_bosques }}</td>
          <td>
            {{
              (
                item.total_consumido_moral + item.total_consumido_bosques
              ).toFixed(2)
            }}
          </td>
        </tr>
      </tbody>
    </table>
    <router-link :to="cargarVentasRoute">
      <button>Cargar ventas</button>
    </router-link>
  </div>
</template>

<script>
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
    : "http://localhost:3000/api";
export default {
  name: "ConsumoInsumos",
  data() {
    return {
      startDate: null,
      endDate: null,
      consumptionData: [],
    };
  },
  computed: {
    cargarVentasRoute() {
      return this.$route.path + "/cargarventa";
    },
    filteredConsumptionData() {
      return this.consumptionData
      // return this.consumptionData.filter((item) => item.producto_clave);
    },
  },
  methods: {
    async fetchConsumptionData() {
      if (!this.startDate || !this.endDate) {
        console.error("Both start date and end date must be selected.");
        return;
      }

      const stores = ["moral", "bosques"];
      const results = {};

      for (const store of stores) {
        try {
          const response = await fetch(
            `${API_URL}/consumption/${store}?startDate=${this.startDate}&endDate=${this.endDate}`
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          results[store] = data; // Store the data for each store in the results object
        } catch (error) {
          console.error("Fetch error:", error);
        }
      }
      const combinedData = [];
      for (const ingredient of Object.values(results.moral)) {
        const sameIngredientInBosques = results.bosques.find(
          (i) => i.id_ingrediente === ingredient.id_ingrediente
        );
        combinedData.push({
          nombre: ingredient.nombre,
          unidad: ingredient.unidad,
          producto_clave: ingredient.producto_clave,
          total_consumido_moral: parseFloat(ingredient.total_consumido),
          total_consumido_bosques: sameIngredientInBosques
            ? parseFloat(sameIngredientInBosques.total_consumido)
            : 0,
        });
      }
      this.consumptionData = combinedData;
    },
  },
};
</script>

<style scoped>
</style>