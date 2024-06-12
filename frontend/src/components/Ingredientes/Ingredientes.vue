<template>
  <div>
    <div class="fixed top-2.5 right-2.5 z-50 cursor-pointer" @click="goDownPage">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="60"
        height="60"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="feather feather-arrow-down"
      >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <polyline points="19 12 12 19 5 12"></polyline>
      </svg>
    </div>
    <h1>Insumos</h1>
    <input v-model="searchTerm" placeholder="Search" />
    <select v-model="proveedor">
      <option value="">All</option>
      <option value="FRUTEX">FRUTEX</option>
    </select>
    <table>
      <thead>
        <tr>
          <th>Código del insumo</th>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Precio</th>
          <th>Proveedor</th>
          <!-- <th>Total usado</th>
          <th>Total $ Comprado</th> -->
          <!-- <th>Total usado / año</th> -->
          <!-- <th>Total $ Comprado / año</th> -->
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
          <td>{{ ingrediente.proveedor }}</td>
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
          </td>
          <td>
            ${{
              new Intl.NumberFormat().format(
                (ingrediente.total_usado * ingrediente.precio * 52).toFixed(2)
              )
            }}
          </td> -->
        </tr>
      </tbody>
    </table>
    <div class="w-full max-w-2xl mx-auto p-5 shadow-lg rounded-lg">
      <h2>Agregar Insumo</h2>
      <form @submit.prevent="agregarIngrediente" class="flex flex-col">
        <input
          v-model="nuevoIngrediente.nombre"
          placeholder="Nombre"
          required
          class="input-field "
        />
        <select class="select-field " v-model="nuevoIngrediente.unidad" required>
          <option disabled value="">Unidad</option>
          <option v-for="unidad in unidades" :key="unidad" :value="unidad">
            {{ unidad }}
          </option>
        </select>
        <input
          v-model="nuevoIngrediente.precio"
          placeholder="Precio"
          required
          class="input-field "
        />
        <select
          v-model="nuevoIngrediente.proveedor_id"
          @change="setProveedorNombre"
          required
          class="select-field"
        >
          <option disabled value="">Proveedor</option>
          <option
            v-for="proveedor in proveedores"
            :key="proveedor.id"
            :value="proveedor.id"
            required
          >
            {{ proveedor.nombre }}
          </option>
        </select>
        <button type="submit" class="py-2.5 px-5 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-700">Agregar Insumo</button>
      </form>
    </div>
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
import API_URL from "../../config";

export default {
  name: "Ingredientes",
  data() {
    return {
      ingredientes: [],
      nuevoIngrediente: {
        nombre: "",
        unidad: "",
        precio: "",
        proveedor: "",
        proveedor_id: "",
      },
      searchTerm: "",
      proveedor: "",
      proveedores: [],
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
    goDownPage() {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    },
    setProveedorNombre(event) {
      const selectedProveedorId = Number(event.target.value);
      const selectedProveedor = this.proveedores.find(
        (proveedor) => proveedor.id === selectedProveedorId
      );
      this.nuevoIngrediente.proveedor = selectedProveedor
        ? selectedProveedor.nombre
        : "";
    },
    async agregarIngrediente() {
      const response = await fetch(`${API_URL}/ingredientes/`, {
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
      this.nuevoIngrediente = {
        nombre: "",
        unidad: "",
        precio: "",
        proveedor: "",
        proveedor_id: "",
      };
      location.reload();
    },
  },
  async mounted() {
    try {
      const response = await fetch(`${API_URL}/unidades`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.unidades = await response.json();
    } catch (error) {
      console.error("Error:", error);
    }
    const response = await fetch(`${API_URL}/ingredientes/demanda`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    this.ingredientes = await response.json();
    this.ingredientes.sort(
      (a, b) => b.total_usado * b.precio - a.total_usado * a.precio
    );
    const responseProveedores = await fetch(`${API_URL}/proveedores`);
    if (!responseProveedores.ok) {
      throw new Error(`HTTP error! status: ${responseProveedores.status}`);
    }
    this.proveedores = await responseProveedores.json();
  },
};
</script>

<style scoped>
.input-field {
  @apply box-border w-full h-12 ml-0 text-base mb-4 p-2.5 rounded border border-gray-300;
}

.select-field {
  @apply box-border w-full h-12 text-base mb-4 p-2.5 rounded border border-gray-300;
}
</style>