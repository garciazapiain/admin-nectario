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
      <input type="date" id="startDate" v-model="startDate" />
      <label for="endDate">End Date:</label>
      <input type="date" id="endDate" v-model="endDate" :min="startDate" />
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

export default {
  name: "CargarVentas",
  data() {
    return {
      items: [],
      store: "",
      startDate: "",
      endDate: "",
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
      };
      reader.readAsArrayBuffer(file);
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
        const API_URL =
          process.env.NODE_ENV === "production"
            ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
            : "http://localhost:3000/api";
        const response = await fetch(`${API_URL}/consumoinsumos/cargarventas`, {
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
        });

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
</style>