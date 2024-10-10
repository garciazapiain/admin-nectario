<template>
  <div>
    <h1>Cargar Ventas</h1>
    <input type="file" @change="onFileChange" />
    <div v-if="items.length">
      <label for="store">Store:</label>
      <select id="store" v-model="store">
        <option value="moral">Moral</option>
        <option value="bosques">Bosques</option>
      </select>
      <label for="startDate">Start Date:</label>
      <input type="date" id="startDate" v-model="startDate" :max="today" />
      <label for="endDate">End Date:</label>
      <input type="date" id="endDate" v-model="endDate" :min="startDate" :max="today" />
      <h2>Seleccionar por semana</h2>
      <select v-model="selectedWeek" @change="updateDateRange">
        <option v-for="week in weeks" :key="week.value" :value="week.value">{{ week.label }}</option>
      </select>
      <button @click="saveSalesData">Guardar Data</button>
    </div>
    <table v-if="items.length">
      <thead>
        <tr>
          <th>Clave</th>
          <th>Descripcion</th>
          <th>Cantidad</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.clavepos">
          <td>{{ item.clavepos }}</td>
          <td>{{ item.descripcion }}</td>
          <td>{{ item.cantidad }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import * as XLSX from "xlsx";
import API_URL from "../../config";
import { fetchWithAuth } from '/src/utils/fetchWithAuth.js';

export default {
  name: "CargarVentas",
  data() {
    return {
      items: [],
      store: "",
      startDate: "",
      endDate: "",
      today: new Date().toISOString().split('T')[0],
      selectedWeek: null,
      weeks: []
    };
  },
  methods: {
    onFileChange(e) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: ["clavepos", "descripcion", "cantidad"],
        });
        this.items = jsonData.slice(1); // Skip the first row
        this.generateWeeks(); // Generate weeks after data is loaded
      };
      reader.readAsArrayBuffer(file);
    },
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
        if (weekEnd > endDate) {
          weekEnd.setDate(endDate.getDate());
        }
        weeks.push({
          value: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`,
          label: `${weekStart.getDate()} al ${weekEnd.getDate()} de ${weekStart.toLocaleString('es-ES', { month: 'long' })}`
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
    async saveSalesData() {
      if (
        !this.store ||
        !this.startDate ||
        !this.endDate ||
        !this.items.length
      ) {
        alert(
          "Please fill all fields and upload an Excel file before logging data."
        );
      } else {
        const response = await fetchWithAuth(`${API_URL}/consumoinsumos/cargarventas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            store: this.store,
            startDate: this.startDate,
            endDate: this.endDate,
            items: this.items,
          }),
        },false);

        if (!response.ok) {
          console.error("HTTP error", response.status);
        } else {
          console.log("Data successfully inserted");
        }
      }
    },
  },
};
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
}

th {
  background-color: #2e970b;
}

h2 {
  margin-top: 20px;
}

select {
  margin-bottom: 20px;
}
</style>
