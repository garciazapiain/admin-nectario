<template>
  <div>
    <h1>Consumo de insumos</h1>
    <input type="date" v-model="startDate" />
    <input type="date" v-model="endDate" />
    <button @click="fetchConsumptionData">Obtener data</button>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <table>
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Unidad</th>
          <th>Proveedor</th>
          <th>Consumido (Moral)</th>
          <th>Constumido (Bosques)</th>
          <th>Total consumido</th>
          <th>Precio / unidad</th>
          <th>$ Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredConsumptionData" :key="item.id_ingrediente">
          <td>{{ item.nombre }}</td>
          <td>{{ item.unidad }}</td>
          <td>{{ item.proveedor }}</td>
          <td>{{ item.total_consumido_moral.toFixed(2) }}</td>
          <td>{{ item.total_consumido_bosques.toFixed(2) }}</td>
          <td>{{ item.total_consumido_total.toFixed(2) }}</td>
          <td>$ {{ item.precio }}</td>
          <td>$ {{ item.total_consumido_dinero.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
    <button @click="exportToExcel" v-if="filteredConsumptionData.length > 0">Export to Excel</button>
    <router-link :to="cargarVentasRoute">
      <button>Cargar ventas</button>
    </router-link>
  </div>
</template>

<script>
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import API_URL from "../../config";

export default {
  name: "ConsumoInsumos",
  data() {
    return {
      startDate: null,
      endDate: null,
      consumptionData: [],
      errorMessage: null,
    };
  },
  computed: {
    cargarVentasRoute() {
      return this.$route.path + "/cargarventa";
    },
    filteredConsumptionData() {
      return this.consumptionData.sort((a, b) => b.total_consumido_dinero - a.total_consumido_dinero);
      // return this.consumptionData.filter((item) => item.producto_clave);
    },
  },
  methods: {
    exportToExcel() {
      const ws = XLSX.utils.json_to_sheet(this.filteredConsumptionData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;
      saveAs(new Blob([buf], { type: "application/octet-stream" }), 'data.xlsx');
    },
    async fetchConsumptionData() {
      this.errorMessage = null; // Reset the error message before fetching data

      if (!this.startDate || !this.endDate) {
        this.errorMessage = "Ambas fechas deben ser seleccionadas.";
        setTimeout(() => {
          this.errorMessage = null;
        }, 5000);
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
        const total_consumido_moral = parseFloat(ingredient.total_consumido);
        const total_consumido_bosques = sameIngredientInBosques
          ? parseFloat(sameIngredientInBosques.total_consumido)
          : 0;
        const total_consumido_total = total_consumido_moral + total_consumido_bosques;
        combinedData.push({
          nombre: ingredient.nombre,
          precio: ingredient.precio,
          unidad: ingredient.unidad,
          proveedor: ingredient.proveedor,
          producto_clave: ingredient.producto_clave,
          total_consumido_moral: total_consumido_moral,
          total_consumido_bosques: total_consumido_bosques,
          total_consumido_total: total_consumido_total,
          total_consumido_dinero: total_consumido_total * ingredient.precio,
        });
      }
      this.consumptionData = combinedData;
      if (this.consumptionData.length === 0) {
        this.errorMessage = "No se encontró data en esas fechas.";
        setTimeout(() => {
          this.errorMessage = null;
        }, 5000);
      }
    },
  },
};
</script>

<style scoped></style>