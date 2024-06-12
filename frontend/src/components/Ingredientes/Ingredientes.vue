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
    <div class="sticky-icon" @click="goDownPage">
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
    <div class="form-container">
      <h2>Agregar Insumo</h2>
      <form @submit.prevent="agregarIngrediente" class="ingredient-form">
        <input
          v-model="nuevoIngrediente.nombre"
          placeholder="Nombre"
          required
        />
        <select v-model="nuevoIngrediente.unidad" required>
          <option disabled value="">Unidad</option>
          <option v-for="unidad in unidades" :key="unidad" :value="unidad">
            {{ unidad }}
          </option>
        </select>
        <input
          v-model="nuevoIngrediente.precio"
          placeholder="Precio"
          required
        />
        <select
          v-model="nuevoIngrediente.proveedor_id"
          @change="setProveedorNombre"
          required
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
        <button type="submit" class="submit-button">Agregar Insumo</button>
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
    totalCompradoSemana() {
      return this.filteredIngredients.reduce(
        (total, ingrediente) =>
          total + ingrediente.total_usado * ingrediente.precio,
        0
      );
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
.sticky-icon {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 1000;
  cursor: pointer;
}
.form-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.ingredient-form {
  display: flex;
  flex-direction: column;
}

.ingredient-form input,
.ingredient-form select {
  box-sizing: border-box;
  width: 100%;
  height: 3rem;
  font-size: 16px;
  margin: 0; /* Add this line */
  margin-bottom: 1rem;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.submit-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.submit-button:hover {
  background-color: #0056b3;
}
</style>