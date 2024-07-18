<script setup>
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
    : "http://localhost:3000/api";
import { useRouter } from "vue-router";
import * as XLSX from 'xlsx'; // Import XLSX

const router = useRouter();
const handleClickPlatillo = (idPlatillo) => {
  router.push(`/platillo/${idPlatillo}`);
};
</script>

<template>
  <div>
    <h1>Platillos</h1>
    <input v-model="searchTerm" placeholder="Search" />
    <button @click="exportToExcel">Export to Excel</button>
    <input type="file" @change="importFromExcel" />
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Clave soft pos</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(platillo, index) in filteredPlatillos" :key="index">
          <td @click="handleClickPlatillo(platillo.id_platillo)">
            {{ platillo.nombre }}
          </td>
          <td>
            <div class="editClaveRow" v-if="editIndexClavePos !== index">
              {{ platillo.clavepos }}
              <button @click="editIndexClavePos = index">Editar</button>
            </div>
            <div v-else>
              <input type="number" min="0" v-model="editValueClavePos" />
              <button @click="saveEditClavePos(platillo)">Guardar</button>
              <button @click="editIndexClavePos = -1">Cancelar</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <form @submit.prevent="agregarPlatillo">
      <input v-model="nuevoPlatillo.nombre" placeholder="Nombre" required />
      <button type="submit">Agregar Platillo</button>
    </form>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'; // Import XLSX

export default {
  name: "Platillos",
  data() {
    return {
      platillos: [],
      nuevoPlatillo: {
        nombre: "",
      },
      searchTerm: "",
      editIndexClavePos: -1,
      editValueClavePos: "",
    };
  },
  methods: {
    async saveEditClavePos(platillo) {
      console.log(this.editValueClavePos); // Log new value
      platillo.clavepos = this.editValueClavePos; // Update value

      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";

      const response = await fetch(
        `${API_URL}/platillos/${platillo.id_platillo}/clavepos`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(platillo),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.editIndexClavePos = -1; // Close edit mode
    },
    async agregarPlatillo() {
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";
      const response = await fetch(`${API_URL}/platillos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.nuevoPlatillo),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.platillos.push(this.nuevoPlatillo);
      this.nuevoPlatillo = {};
      location.reload();
    },
    exportToExcel() {
      const data = this.filteredPlatillos.map(platillo => ({
        Nombre: platillo.nombre,
        'Clave soft pos': platillo.clavepos
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Platillos');
      XLSX.writeFile(wb, 'platillos.xlsx');
    },
    async importFromExcel(event) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Filter out entries with null, undefined, or empty nombre
        const validPlatillos = jsonData
          .map(row => ({
            nombre: row['Nombre'],
            clavepos: row['Clave soft pos']
          }))
          .filter(platillo => platillo.nombre && platillo.nombre.trim() !== "");

        // Update the database with the imported data
        for (const platillo of validPlatillos) {
          await this.agregarPlatilloToDB(platillo);
        }

        // Update the local state
        this.platillos = validPlatillos;
        location.reload();
      };
      reader.readAsArrayBuffer(file);
    },
    async agregarPlatilloToDB(platillo) {
      console.log(platillo, 'hello');
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";
      const response = await fetch(`${API_URL}/platillos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(platillo),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }
  },
  computed: {
    filteredPlatillos() {
      // Add this computed property
      if (!this.searchTerm) {
        return this.platillos;
      }
      const term = this.searchTerm.toLowerCase();
      return this.platillos.filter((platillo) =>
        platillo.nombre.toLowerCase().includes(term)
      );
    },
  },
  async mounted() {
    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";
    try {
      const response = await fetch(`${API_URL}/platillos`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Data is not an array");
      }
      this.platillos = data;
    } catch (error) {
      console.error(error);
    }
  },
};
</script>

<style scoped>
.editClaveRow {
  display: flex;
  flex-direction: column;
  font-size: 1.5rem;
}
.editClaveRow button {
  margin-top: 5px;
  font-size: 0.8rem;
}
</style>
