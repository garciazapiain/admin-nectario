<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
const handleClick = (platillo) => {
  if (platillo.type === "Platillo") {
    router.push(`/platillo/${platillo.id_platillo}`);
  } else {
    router.push(`/subplatillo/${platillo.id_platillo}`);
  }
};
</script>
<template>
  <div>
    <h1>{{ ingrediente.nombre }}</h1>
    <h2>Info del insumo: <button @click="showModal = true">Editar</button></h2>
    <div v-if="showModal" class="modal">
      <form @submit.prevent="editIngrediente" class="edit-form">
        <div class="form-group">
          <label for="nombre">Nombre:</label>
          <input id="nombre" v-model="ingredienteEditado.nombre" />
        </div>
        <div class="form-group">
          <label for="proveedor">Proveedor:</label>
          <select
            id="proveedor"
            v-model="ingredienteEditado.proveedor"
            @change="updateProveedor"
          >
            <option disabled value="">Selecciona un proveedor</option>
            <option
              v-for="proveedor in proveedores"
              :key="proveedor.id"
              :value="proveedor.nombre"
            >
              {{ proveedor.nombre }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="unidad">Unidad:</label>
          <select id="unidad" v-model="ingredienteEditado.unidad">
            <option disabled value="">Selecciona una unidad</option>
            <option
              v-for="(unidad, index) in unidades"
              :key="index"
              :value="unidad"
            >
              {{ unidad }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="precio">Precio:</label>
          <input id="precio" v-model="ingredienteEditado.precio" />
        </div>
        <div class="form-group">
          <label for="store_route_order">Orden ruta de tienda:</label>
          <input
            id="store_route_order"
            type="number"
            v-model.number="ingredienteEditado.store_route_order"
          />
        </div>
        <div class="form-group">
          <label for="lista_peligro">Lista peligro</label>
          <select
            id="lista_peligro"
            v-model="ingredienteEditado.producto_clave"
          >
            <option value="true">Si</option>
            <option value="false">No</option>
          </select>
        </div>
        <div class="form-group">
          <label for="orden_inventario">Orden toma de Inventario:</label>
          <input
            id="orden_inventario"
            type="number"
            step="0.1"
            v-model.number="ingredienteEditado.orden_inventario"
          />
        </div>
        <div class="form-group">
          <label for="store_route_order">Moral Demanda Semanal:</label>
          <input
            id="moral_demanda_semanal"
            type="number"
            step="0.01"
            v-model.number="ingredienteEditado.moral_demanda_semanal"
          />
        </div>
        <div class="form-group">
          <label for="store_route_order">Campestre Demanda Semanal:</label>
          <input
            id="bosques_demanda_semanal"
            type="number"
            step="0.01"
            v-model.number="ingredienteEditado.bosques_demanda_semanal"
          />
        </div>
        <div class="form-group">
          <label for="frecuencias_inventario">Frecuencias de Inventario:</label>
          <select
            id="frecuencias_inventario"
            v-model="ingredienteEditado.frecuencias_inventario"
            multiple
          >
            <option disabled value="">Selecciona una frecuencia</option>
            <option value=1>Inicio primer turno</option>
            <option value=2>Inicio segundo turno</option>
            <option value=3>Fin segundo turno</option>
            <option value=5>No inventarear</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="submit">Guardar</button>
          <button @click="showModal = false">Cancelar</button>
        </div>
      </form>
    </div>
    <table>
      <tbody>
        <tr>
          <td><strong>Proveedor:</strong></td>
          <td>{{ ingrediente.proveedor }}</td>
        </tr>
        <tr>
          <td><strong>Unidad:</strong></td>
          <td>{{ ingrediente.unidad }}</td>
        </tr>
        <tr>
          <td><strong>Precio:</strong></td>
          <td>${{ ingrediente.precio }}</td>
        </tr>
        <tr>
          <td><strong>Orden ruta de tienda:</strong></td>
          <td>{{ ingrediente.store_route_order }}</td>
        </tr>
        <tr>
          <td><strong>Lista Peligro:</strong></td>
          <td>{{ ingrediente.producto_clave ? "Si" : "No" }}</td>
        </tr>
        <tr>
          <td><strong>Orden toma de Inventario:</strong></td>
          <td>{{ ingrediente.orden_inventario }}</td>
        </tr>
        <tr>
          <td><strong>Moral Demanda Semanal:</strong></td>
          <td>
            {{ ingrediente.moral_demanda_semanal }}
            <span v-if="ingrediente.moral_demanda_semanal">{{
              ingrediente.unidad
            }}</span>
          </td>
        </tr>
        <tr>
          <td><strong>Moral Demanda Semanal:</strong></td>
          <td>
            {{ ingrediente.moral_demanda_semanal }}
            <span v-if="ingrediente.moral_demanda_semanal">{{
              ingrediente.unidad
            }}</span>
          </td>
        </tr>
        <tr>
          <td>
            <strong
              >Moral Demanda
              <input type="number" v-model="inputDaysMoral" /> dias:</strong
            >
          </td>
          <td>
            {{
              calculateDemandDays(
                ingrediente.moral_demanda_semanal,
                "moral"
              ).toFixed(1)
            }}
            <span v-if="ingrediente.moral_demanda_semanal">{{
              ingrediente.unidad
            }}</span>
          </td>
        </tr>
        <tr>
          <td><strong>Campestre Demanda Semanal:</strong></td>
          <td>
            {{ ingrediente.bosques_demanda_semanal }}
            <span v-if="ingrediente.bosques_demanda_semanal">{{
              ingrediente.unidad
            }}</span>
          </td>
        </tr>
        <tr>
          <td>
            <strong
              >Campestre Demanda
              <input type="number" v-model="inputDaysBosques" /> dias:</strong
            >
          </td>
          <td>
            {{
              calculateDemandDays(
                ingrediente.bosques_demanda_semanal,
                "bosques"
              ).toFixed(1)
            }}
            <span v-if="ingrediente.bosques_demanda_semanal">{{
              ingrediente.unidad
            }}</span>
          </td>
        </tr>
        <tr>
          <td><strong>Frecuencias de Inventario:</strong></td>
          <td>
            <span
              v-for="(frecuencia, index) in ingrediente.frecuencias_inventario"
              :key="index"
            >
              {{ displayFrecuencia(frecuencia) }}
              <span v-if="index < ingrediente.frecuencias_inventario.length - 1"
                >,
              </span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <h2>Platillos/Subplatillos donde se usa el insumo:</h2>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(platillo, index) in ingrediente.platillos"
          :key="index"
          @click="handleClick(platillo)"
        >
          <td>{{ platillo.nombre }}</td>
          <td>{{ platillo.type }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      ingrediente: {},
      ingredienteEditado: {},
      showModal: false,
      proveedores: [],
      unidades: [],
      inputDaysBosques: 1,
      inputDaysMoral: 1,
    };
  },
  computed: {
    proveedorNombre() {
      const proveedor = this.proveedores.find(
        (p) => p.id === this.ingredienteEditado.proveedor
      );
      return proveedor ? proveedor.nombre : "";
    },
  },
  methods: {
    calculateDemandDays(weeklyDemand, store) {
      return (
        (weeklyDemand / 7) *
        (store === "moral" ? this.inputDaysMoral : this.inputDaysBosques)
      );
    },
    displayFrecuencia(frecuencia) {
      switch (frecuencia) {
        case "inicio_primer_turno":
          return "Inicio primer turno";
        case "inicio_segundo_turno":
          return "Inicio segundo turno";
        case "fin_segundo_turno":
          return "Fin segundo turno";
        case "no_inventarear":
          return "No inventarear";
        default:
          return frecuencia;
      }
    },
    updateProveedor(event) {
      const selectedProveedor = this.proveedores.find(
        (proveedor) => proveedor.nombre === event.target.value
      );
      if (selectedProveedor) {
        this.ingredienteEditado.proveedor = selectedProveedor.nombre;
        this.ingredienteEditado.proveedor_id = selectedProveedor.id;
      }
    },
    async editIngrediente() {
      const id = this.$route.params.id;
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";
      const response = await fetch(`${API_URL}/ingredientes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.ingredienteEditado),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.showModal = false;
      location.reload();
    },
  },
  async mounted() {
    // Get the ID from the router
    const id = this.$route.params.id;
    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";

    try {
      // Make API call to fetch the platillo data
      const response = await fetch(`${API_URL}/ingrediente/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Store the fetched data in the component's data
      this.ingrediente = data;
      this.ingredienteEditado = { ...data };
    } catch (error) {
      console.error("Error:", error);
    }
    const responseProveedores = await fetch(`${API_URL}/proveedores`);
    if (!responseProveedores.ok) {
      throw new Error(`HTTP error! status: ${responseProveedores.status}`);
    }
    this.proveedores = await responseProveedores.json();
    const responseUnidades = await fetch(`${API_URL}/unidades`);
    if (!responseUnidades.ok) {
      throw new Error(`HTTP error! status: ${responseUnidades.status}`);
    }
    this.unidades = await responseUnidades.json();
  },
};
</script>

<style scoped>
.edit-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1em;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-actions {
  grid-column: span 2;
  display: flex;
  justify-content: space-between;
}
</style>