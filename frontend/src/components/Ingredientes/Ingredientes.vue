<template>
  <div>
    <!-- <p>
      Total $ Comprado:
      {{
        new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
        }).format(totalCompradoSemana)
      }}
    </p> -->
    <h1>Ingredientes</h1>
    <input v-model="searchTerm" placeholder="Search" />
    <select v-model="proveedor">
      <option value="">All</option>
      <option value="FRUTEX">FRUTEX</option>
    </select>
    <table>
      <thead>
        <tr>
          <th>Código del ingrediente</th>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Precio</th>
          <!-- <th>Total usado</th>
          <th>Total $ Comprado</th> -->
          <!-- <th>Total usado / año</th>
          <th>Total $ Comprado / año</th> -->
        </tr>
      </thead>
      <tbody>
        <tr
          @click="handleClickIngrediente(ingrediente.id_ingrediente)"
          v-for="(ingrediente, index) in filteredIngredients"
          :key="index"
        >
          <td>{{ ingrediente.id_ingrediente }}</td>
          <td>{{ ingrediente.nombre }}</td>
          <td>{{ ingrediente.unidad }}</td>
          <td>${{ ingrediente.precio }}</td>
          <!-- <td>
            {{ Math.round(ingrediente.total_usado) + " " + ingrediente.unidad }}
          </td>
          <td>
            ${{
              new Intl.NumberFormat().format(
                (ingrediente.total_usado * ingrediente.precio).toFixed(2)
              )
            }}
          </td> -->
          <!-- <td>
            {{
              Math.round(ingrediente.total_usado * 52) +
              " " +
              ingrediente.unidad
            }}
          </td> -->
          <!-- <td>
            ${{
              new Intl.NumberFormat().format(
                (ingrediente.total_usado * ingrediente.precio * 52).toFixed(2)
              )
            }}
          </td> -->
        </tr>
      </tbody>
    </table>
    <form @submit.prevent="agregarIngrediente">
      <input v-model="nuevoIngrediente.nombre" placeholder="Nombre" required />
      <input v-model="nuevoIngrediente.unidad" placeholder="Unidad" required />
      <input v-model="nuevoIngrediente.precio" placeholder="Precio" required />
      <button type="submit">Agregar Ingrediente</button>
    </form>
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
      nuevoIngrediente: {
        nombre: "",
        unidad: "",
        precio: "",
      },
      searchTerm: "",
      proveedor: "",
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
    totalCompradoSemana() {
      return this.filteredIngredients.reduce(
        (total, ingrediente) =>
          total + ingrediente.total_usado * ingrediente.precio,
        0
      );
    },
  },
  methods: {
    async agregarIngrediente() {
      const response = await fetch("http://localhost:3000/api/ingredientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.nuevoIngrediente),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.ingredientes.push(this.nuevoIngrediente);
      this.nuevoIngrediente = { nombre: "", unidad: "", precio: "" };
    },
  },
  async mounted() {
    const response = await fetch("http://localhost:3000/api/ingredientes");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    this.ingredientes = await response.json();
    this.ingredientes.sort(
      (a, b) => b.total_usado * b.precio - a.total_usado * a.precio
    );
  },
};
</script>

<style scoped>
</style>