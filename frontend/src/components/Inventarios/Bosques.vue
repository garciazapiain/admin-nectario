<template>
  <div>
    <h1>Bosques</h1>
    <!-- ... -->
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Cantidad</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(ingrediente, index) in filteredIngredients" :key="index">
          <td>{{ ingrediente.nombre }}</td>
          <td>{{ ingrediente.unidad }}</td>
          <td>
            <input
              type="number"
              v-model.number="ingrediente.cantidad_inventario"
              min="0"
            />
            <button @click="increaseQuantity(ingrediente)">+</button>
            <button @click="decreaseQuantity(ingrediente)">-</button>
          </td>
        </tr>
      </tbody>
    </table>
    <button @click="submitForm">Submit</button>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
const handleClickIngrediente = (idIngrediente) => {
  router.push(`/ingrediente/${idIngrediente}`);
};
</script>

<script>
export default {
  name: "Ingredientes",
  data() {
    return {
      ingredientes: [],
      searchTerm: "",
      proveedor: "",
      store: "bosques",
      submitData: [], // new state for data to be submitted
    };
  },
  computed: {
    filteredIngredients() {
      let ingredients = this.ingredientes;
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        ingredients = ingredients.filter((ingrediente) =>
          ingrediente.nombre.toLowerCase().includes(term)
        );
      }
      if (this.proveedor) {
        ingredients = ingredients.filter(
          (ingrediente) => ingrediente.proveedor === this.proveedor
        );
      }
      return ingredients;
    },
  },
  methods: {
    increaseQuantity(ingrediente) {
      ingrediente.cantidad_inventario++;
      this.updateSubmitData(ingrediente);
    },
    decreaseQuantity(ingrediente) {
      if (ingrediente.cantidad_inventario > 0) {
        ingrediente.cantidad_inventario--;
        this.updateSubmitData(ingrediente);
      }
    },
    updateSubmitData(ingrediente) {
      const index = this.submitData.findIndex(
        (i) => i.nombre === ingrediente.nombre
      );
      if (index > -1) {
        this.submitData[index] = {
          ...this.submitData[index],
          cantidad_inventario: ingrediente.cantidad_inventario,
        };
      } else {
        this.submitData.push({
          id_ingrediente: ingrediente.id_ingrediente,
          nombre: ingrediente.nombre,
          unidad: ingrediente.unidad,
          cantidad_inventario: ingrediente.cantidad_inventario,
          proveedor: ingrediente.proveedor,
        });
      }
      console.log(this.submitData); // Log submitData every time it gets updated
    },
    submitForm() {
      const date = new Date();
      const timestamp = date.toISOString(); // Convert date to ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)

      const dataToSubmit = {
        store: this.store,
        timestamp, // Add timestamp to dataToSubmit
        ingredients: this.submitData,
      };

      // Send a POST request to the server
      fetch("http://localhost:3000/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      })
        .then((response) => response.json())
        .then((data) => console.log(data))
        .catch((error) => {
          console.error("Error:", error);
        });
    },
  },
  async mounted() {
    const response = await fetch("http://localhost:3000/api/ingredientes");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    this.ingredientes = await response.json();
    this.ingredientes.forEach((ingrediente) => {
      ingrediente.cantidad_inventario = 0; // Initialize cantidad for each ingredient
      this.updateSubmitData(ingrediente); // Initialize submitData
    });
    this.ingredientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
  },
};
</script>

<style scoped>
</style>