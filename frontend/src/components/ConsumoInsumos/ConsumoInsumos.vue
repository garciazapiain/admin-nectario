<template>
  <div>
    <h1>Consumo de insumos</h1>
    <input type="date" v-model="startDate" :max="today" />
    <input type="date" v-model="endDate" :max="today" />
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <div>
      <h2>Seleccionar por semana</h2>
      <select v-model="selectedWeek" @change="updateDateRange">
        <option v-for="week in weeks" :key="week.value" :value="week.value" :disabled="week.disabled">{{ week.label }}
        </option>
      </select>
    </div>
    <table>
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Unidad</th>
          <th>Proveedor</th>
          <th>Consumido (Moral)</th>
          <th>Consumido (Bosques)</th>
          <th>Total consumido sin merma</th>
          <th>Total consumido real</th>
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
          <td>{{ (item.total_consumido_total / (1 - Number(item.merma))).toFixed(2) }}</td>
          <td>$ {{ item.precio }}</td>
          <td>$ {{ ((item.total_consumido_total / (1 - Number(item.merma))) * item.precio).toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="button-container">
      <button className="bg-blue-800" @click="fetchConsumptionData">Obtener data</button>
      <button className="bg-green-400" @click="exportToExcel" v-if="filteredConsumptionData.length > 0">Exportar a
        Excel</button>
      <router-link :to="cargarVentasRoute">
        <button className="bg-green-400">Cargar ventas</button>
      </router-link>
    </div>
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
      today: new Date().toISOString().split('T')[0],
      selectedWeek: null,
      weeks: []
    };
  },
  computed: {
    cargarVentasRoute() {
      return this.$route.path + "/cargarventa";
    },
    filteredConsumptionData() {
      return this.consumptionData.sort((a, b) => b.total_consumido_dinero - a.total_consumido_dinero);
    },
  },
  methods: {
    generateWeeks() {
      const weeks = [];
      const startDate = new Date(new Date().getFullYear(), 0, 1);
      while (startDate.getDay() !== 1) {
        startDate.setDate(startDate.getDate() + 1);
      }
      const endDate = new Date(this.today);

      while (startDate <= endDate) {
        const weekStart = new Date(startDate);
        const weekEnd = new Date(startDate);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // If the week ends after today, adjust it to end on today
        let isIncompleteWeek = false;
        if (weekEnd > endDate) {
          weekEnd.setDate(endDate.getDate());
          isIncompleteWeek = true;
        }

        let label;
        if (weekStart.getMonth() !== weekEnd.getMonth()) {
          label = `${weekStart.getDate()} de ${weekStart.toLocaleString('es-ES', { month: 'long' })} al ${weekEnd.getDate()} de ${weekEnd.toLocaleString('es-ES', { month: 'long' })}`;
        } else {
          label = `${weekStart.getDate()} al ${weekEnd.getDate()} de ${weekStart.toLocaleString('es-ES', { month: 'long' })}`;
        }

        weeks.push({
          value: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`,
          label: label,
          disabled: isIncompleteWeek // Mark this week as disabled if it's incomplete
        });

        startDate.setDate(startDate.getDate() + 7);
      }

      this.weeks = weeks.reverse();
    },
    updateDateRange() {
      if (this.selectedWeek) {
        const [start, end] = this.selectedWeek.split('_');
        this.startDate = start;
        this.endDate = end;
      }
    },
    exportToExcel() {
      // Prepare data for export including the adjusted columns
      const dataForExport = this.filteredConsumptionData.map(item => ({
        "Insumo": item.nombre,
        "Unidad": item.unidad,
        "Proveedor": item.proveedor,
        "Consumido (Moral)": item.total_consumido_moral.toFixed(2),
        "Consumido (Bosques)": item.total_consumido_bosques.toFixed(2),
        "Total consumido sin merma": item.total_consumido_total.toFixed(2),
        "Total consumido real": (item.total_consumido_total / (1 - Number(item.merma))).toFixed(2),
        "Precio / unidad": `$ ${item.precio}`,
        "$ Total": `$ ${((item.total_consumido_total / (1 - Number(item.merma))) * item.precio).toFixed(2)}`
      }));

      // Create the worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(dataForExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      // Write the workbook and trigger download
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;
      saveAs(new Blob([buf], { type: "application/octet-stream" }), "consumo_insumos.xlsx");
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
      if (results.moral && results.bosques) {
        for (const ingredient of results.moral) {
          const sameIngredientInBosques = results.bosques.find(
            (i) => i.id_ingrediente === ingredient.id_ingrediente
          );
          const total_consumido_moral = parseFloat(ingredient.total_consumido);
          const total_consumido_bosques = sameIngredientInBosques
            ? parseFloat(sameIngredientInBosques.total_consumido)
            : 0;
          const total_consumido_total = total_consumido_moral + total_consumido_bosques;
          combinedData.push({
            id_ingrediente: ingredient.id_ingrediente,
            nombre: ingredient.nombre,
            precio: ingredient.precio,
            unidad: ingredient.unidad,
            proveedor: ingredient.proveedor,
            producto_clave: ingredient.producto_clave,
            merma: ingredient.merma,
            total_consumido_moral: total_consumido_moral,
            total_consumido_bosques: total_consumido_bosques,
            total_consumido_total: total_consumido_total,
            total_consumido_dinero: total_consumido_total * ingredient.precio,
          });
        }
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
  mounted() {
    this.generateWeeks();
  }
};
</script>


<style scoped>
.button-container {
  display: flex;
  gap: 10px;
  /* Adjust the gap as needed */
}

button {
  padding: 10px 20px;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}
</style>