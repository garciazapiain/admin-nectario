<script setup>
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
    : "http://localhost:3000/api";
import { useRouter } from "vue-router";
import * as XLSX from 'xlsx'; // Import XLSX
import { ref } from "vue";
import ArrowToPageNavigateDown from "../../components/ArrowToPageNavigateDown.vue";
import SearchBar from "../../components/SearchBar.vue";

const isAdmin = ref(localStorage.getItem("isAdmin") === "true");

const router = useRouter();
const handleClickPlatillo = (idPlatillo) => {
  router.push(`/platillos/${idPlatillo}`);
};
</script>

<template>
  <div>
    <ArrowToPageNavigateDown />
    <h1>Platillos</h1>
    <div class="flex justify-evenly">
      <BaseButton bgColor="bg-violet-800" textColor="text-white" fontSize="text-base" @click="exportToExcel">Exportar a
        Excel</BaseButton>
      <!-- New Button to Show Cost Calculation -->
      <BaseButton bgColor="bg-violet-800" textColor="text-white" fontSize="text-base" @click="calculateCosts">Sacar
        costo
        de venta</BaseButton>
      <!-- Spinner -->
      <div v-if="showCostsLoading" class="spinner">
        <p>Cargando costos de venta...</p>
      </div>
    </div>
    <div>
      <p>Importar desde excel platillos</p>
      <input v-if="isAdmin" type="file" @change="importFromExcel" />
    </div>

    <SearchBar v-model="searchTerm" placeholder="Buscar platillo..."></SearchBar>

    <table>
      <thead>
        <tr>
          <th>Nombre platillo</th>
          <th>Clave SoftRest POS</th>
          <!-- Conditionally render columns based on showCosts state -->
          <th v-if="showCosts">Costo total</th>
          <th>Precio piso</th>
          <th v-if="showCosts">% Costo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(platillo, index) in filteredPlatillos" :key="index">
          <td @click="handleClickPlatillo(platillo.id_platillo)">
            {{ platillo.nombre }}
          </td>
          <td>
            <div class="editRow" v-if="editIndexClavePos !== index">
              {{ platillo.clavepos }}
              <SmallBaseButton bgColor="bg-violet-800 text-white" textColor="text-black" fontSize="text-base" v-if="isAdmin"
                @click="editIndexClavePos = index">
                Editar
              </SmallBaseButton>
            </div>
            <div v-else>
              <input type="number" min="0" v-model="editValueClavePos" />
              <SmallBaseButton bgColor="bg-violet-800 text-white" textColor="text-black" fontSize="text-base"
                @click="saveEditClavePos(platillo)">Guardar</SmallBaseButton>
              <SmallBaseButton bgColor="bg-red-600 text-white" textColor="text-black" fontSize="text-base"
                @click="editIndexClavePos = -1">Cancelar</SmallBaseButton>
            </div>
          </td>
          <!-- Conditionally render "Costo total" based on showCosts state -->
          <td v-if="showCosts">${{ platillo.costoTotal ? platillo.costoTotal.toFixed(2) : '' }}</td>
          <td>
            <div class="editRow" v-if="editIndexPrecio !== index">
              {{ platillo.precio_piso !== null ? `$${platillo.precio_piso.toFixed(2)}` : '' }}
              <SmallBaseButton bgColor="bg-violet-800 text-white" textColor="text-black" fontSize="text-base" v-if="isAdmin"
                @click="editIndexPrecio = index">
                Editar
              </SmallBaseButton>
            </div>
            <div v-else>
              <input type="number" min="0" v-model="editValuePrecio" />
              <SmallBaseButton bgColor="bg-violet-800 text-white" textColor="text-black" fontSize="text-base"
                @click="saveEditPrecio(platillo)">Guardar</SmallBaseButton>
              <SmallBaseButton bgColor="bg-red-600 text-white" textColor="text-black" fontSize="text-base"
                @click="editIndexPrecio = -1">Cancelar</SmallBaseButton>
            </div>
          </td>
          <!-- Conditionally render "% Costo" based on showCosts state -->
          <td v-if="showCosts">
            {{ platillo.precio_piso !== null && platillo.costoTotal ? `${((platillo.costoTotal / platillo.precio_piso) *
              100).toFixed(0)}%` : '' }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add Platillo Form -->
    <h2>Agregar nuevo platillo</h2>
    <form id="agregarPlatilloForm" @submit.prevent="agregarPlatillo"
      class="flex flex-col space-y-4 p-6 bg-white shadow-lg rounded-lg">
      <!-- Input for Nombre -->
      <input v-model="nuevoPlatillo.nombre" placeholder="Nombre de platillo" required
        class="w-full h-12 px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />

      <!-- Submit Button -->
      <BaseButton bgColor="bg-violet-800" textColor="text-white" fontSize="text-base" type="submit"
        class="w-full h-12 flex items-center justify-center bg-violet-800 text-white rounded-lg hover:bg-violet-900 transition-all">
        Agregar Platillo
      </BaseButton>
    </form>
  </div>
</template>

<script>
import * as XLSX from 'xlsx'; // Import XLSX
import BaseButton from "../../components/BaseButton.vue";
import SmallBaseButton from "../../components/SmallBaseButton.vue";

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
      editIndexPrecio: -1,  // Add state for editing 'precio'
      editValuePrecio: "",  // Add input value for editing 'precio'
      showCosts: false,
      showCostsLoading: false
    };
  },
  methods: {
    async updatePlatillo(idPlatillo, updatedData) {
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";

      const response = await fetch(
        `${API_URL}/platillos/${idPlatillo}/update-with-excel-import`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    },
    async processPlatilloEntry(platillo) {
      // Check if platillo already exists based on clavepos or nombre
      const existingPlatillo = this.platillos.find(p =>
        p.clavepos === platillo.clavepos || p.nombre === platillo.nombre
      );

      if (existingPlatillo) {
        // If platillo exists (either by clavepos or nombre), update it
        await this.updatePlatillo(existingPlatillo.id_platillo, platillo);
      } else {
        // If platillo does not exist, add it
        await this.agregarPlatilloToDB(platillo);
      }
    },
    async saveEditClavePos(platillo) {
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";

      const encodedClavepos = encodeURIComponent(this.editValueClavePos);
      const checkResponse = await fetch(`${API_URL}/platillos/check-clave-pos?clavepos=${encodedClavepos}`);

      const existingPlatillo = await checkResponse.json();

      if (existingPlatillo.length > 0 && existingPlatillo[0].id_platillo !== platillo.id_platillo) {
        alert("Error: Clave SoftRest POS ya existe");
        return; // Exit function if clavepos exists
      }

      platillo.clavepos = this.editValueClavePos; // Update value

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
    async saveEditPrecio(platillo) {
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";

      platillo.precio_piso = parseFloat(this.editValuePrecio); // Update the value

      const response = await fetch(
        `${API_URL}/platillos/${platillo.id_platillo}/precio`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ precio_piso: platillo.precio_piso }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.editIndexPrecio = -1; // Close edit mode
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
      // Get the newly created platillo from the response
      const newPlatillo = await response.json();
      // Redirect to the new platillo route
      this.$router.push(`/platillos/${newPlatillo.id_platillo}`);
    },
    exportToExcel() {
      const data = this.filteredPlatillos.map(platillo => {
        let exportData = {
          Nombre: platillo.nombre,
          'Clave soft pos': platillo.clavepos,
          'Precio': platillo.precio_piso
        };

        // Include Costo Total and % Costo only if showCosts is true
        if (this.showCosts) {
          exportData['Costo total'] = platillo.costoTotal ? platillo.costoTotal.toFixed(2) : '';
          exportData['% Costo'] = platillo.precio_piso !== null && platillo.costoTotal
            ? `${((platillo.costoTotal / platillo.precio_piso) * 100).toFixed(0)}%`
            : '';
        }

        return exportData;
      });

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
            clavepos: row['Clave soft pos'],
            precio_piso: parseFloat(row['Precio']) // Include Precio from Excel
          }))
          .filter(platillo => platillo.nombre && platillo.nombre.trim() !== "");

        // Update the database with the imported data
        for (const platillo of validPlatillos) {
          await this.processPlatilloEntry(platillo);
        }

        // Update the local state
        this.platillos = validPlatillos;
        location.reload();
      };
      reader.readAsArrayBuffer(file);
    },
    async agregarPlatilloToDB(platillo) {
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
    },
    calculateTotalCost(ingredients) {
      let aggregatedIngredients = {};

      // Aggregating ingredients considering subplatillos and their parts
      ingredients.forEach((ingrediente) => {
        // Calculate the quantity considering if it's part of a subplatillo
        let cantidad = ingrediente.is_part_of_subplatillo
          ? (ingrediente.cantidad / ingrediente.rendimiento) *
          (ingrediente.subplatillo_cantidad ? ingrediente.subplatillo_cantidad : 1)
          : ingrediente.cantidad;

        // Aggregate ingredients
        if (aggregatedIngredients[ingrediente.id_ingrediente]) {
          aggregatedIngredients[ingrediente.id_ingrediente].cantidad += parseFloat(cantidad);
        } else {
          aggregatedIngredients[ingrediente.id_ingrediente] = {
            ...ingrediente,
            cantidad: parseFloat(cantidad),
          };
        }
      });

      // Calculate the total cost
      let total = 0;
      Object.values(aggregatedIngredients).forEach((ingrediente) => {
        total += ingrediente.precio * ingrediente.cantidad;
      });

      return total;
    },
    async calculateCosts() {
      this.showCosts = true;  // Set showCosts to true to display the columns
      this.showCostsLoading = true;
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";

      // Fetch ingredients and calculate costs
      for (const platillo of this.platillos) {
        const ingredientsResponse = await fetch(`${API_URL}/platillos/${platillo.id_platillo}`);
        if (ingredientsResponse.ok) {
          try {
            const ingredientsData = await ingredientsResponse.json();

            if (ingredientsData && ingredientsData.ingredients && Array.isArray(ingredientsData.ingredients)) {
              platillo.ingredientes = ingredientsData.ingredients;
              platillo.costoTotal = this.calculateTotalCost(platillo.ingredientes); // Calculate total cost
            } else {
              console.warn(`Expected ingredients data to be an array for platillo ID ${platillo.id_platillo}, but got:`, ingredientsData);
              platillo.ingredientes = [];
              platillo.costoTotal = 0;
            }

          } catch (error) {
            console.error(`Failed to parse ingredients JSON for platillo ID ${platillo.id_platillo}:`, error);
            platillo.ingredientes = [];
            platillo.costoTotal = 0;
          }
        } else {
          const errorText = await ingredientsResponse.text();
          console.error(`Error fetching ingredients for platillo ID ${platillo.id_platillo}: ${errorText}`);
          platillo.ingredientes = [];
          platillo.costoTotal = 0;
        }
      }
      this.showCostsLoading = false;
    },
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

      this.platillos = data; // Set the fetched platillos data

    } catch (error) {
      console.error("Error fetching platillos:", error);
    }
  }
};
</script>

<style scoped>
.editRow {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.spinner {
  text-align: center;
  font-size: 1.5rem;
  margin-top: 20px;
}
</style>
