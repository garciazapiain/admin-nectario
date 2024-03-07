<template>
  <div>
    <h1>Pronostico Demanda Insumos</h1>
    <h2>Total Precio: {{ total_precio.toFixed(2) }}</h2>
    <div class="container">
      <div class="half">
        <h2>Platillos</h2>
        <div class="scrollable-platillos">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="platillo in platillos" :key="platillo.id">
                <td>{{ platillo.nombre }}</td>
                <td>
                  <input
                    v-model.number="platillo.cantidad"
                    type="number"
                    min="0"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="half">
        <h2>Ingredientes</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Unidad</th>
              <th>Cantidad</th>
              <th>$ / insumo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ingrediente in ingredientes" :key="ingrediente.id">
              <td>{{ ingrediente.nombre }}</td>
              <td>{{ ingrediente.unidad }}</td>
              <td>{{ ingrediente.cantidad.toFixed(3) }}</td>
              <td>
                {{ (ingrediente.cantidad * ingrediente.precio).toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      platillos: [],
      ingredientes: [],
      platillosSeleccionados: [],
      total_precio: 0,
    };
  },
  methods: {
    async fetchIngredients(platilloId) {
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
          : "http://localhost:3000/api";
      const response = await fetch(
        `${API_URL}/platillo/${platilloId}?includeSubplatillos=false`
      );
      const data = await response.json();
      return data.ingredients; // Change this line
    },
    mergeIngredients(ingredientsList, platillosSeleccionados) {
      const merged = {};
      for (let i = 0; i < ingredientsList.length; i++) {
        const ingredients = ingredientsList[i];
        const platilloCantidad = platillosSeleccionados[i].cantidad;
        for (const ingredient of ingredients) {
          let cantidad = parseFloat(ingredient.cantidad) * platilloCantidad;
          if (ingredient.is_subplatillo) {
            cantidad =
              (cantidad / ingredient.rendimiento) *
              ingredient.subplatillo_cantidad;
          }
          if (merged[ingredient.id_ingrediente]) {
            merged[ingredient.id_ingrediente].cantidad += cantidad;
          } else {
            merged[ingredient.id_ingrediente] = {
              id: ingredient.id_ingrediente,
              nombre: ingredient.nombre,
              unidad: ingredient.unidad,
              precio: parseFloat(ingredient.precio),
              cantidad: cantidad,
              isSubplatillo: ingredient.is_subplatillo,
              rendimiento: ingredient.rendimiento,
              subplatilloCantidad: ingredient.subplatillo_cantidad,
            };
          }
        }
      }
      return Object.values(merged);
    },
    calculateTotalPrecio() {
      let totalPrecioPlatillos = this.ingredientes.reduce(
        (total, ingrediente) => {
          return (
            total +
            parseFloat(ingrediente.cantidad) * parseFloat(ingrediente.precio)
          );
        },
        0
      );
      this.total_precio = totalPrecioPlatillos;
    },
  },
  watch: {
    platillos: {
      handler() {
        this.platillosSeleccionados = this.platillos
          .filter((platillo) => platillo.cantidad > 0)
          .map((platillo) => ({
            id: platillo.id_platillo,
            cantidad: platillo.cantidad,
            precio: platillo.precio,
          }));
        this.calculateTotalPrecio();
      },
      deep: true,
    },
    ingredientes: {
      handler() {
        this.calculateTotalPrecio();
      },
      deep: true,
    },
    async platillosSeleccionados(newVal) {
      const ingredientsList = await Promise.all(
        newVal.map((platillo) => this.fetchIngredients(platillo.id))
      );
      this.ingredientes = this.mergeIngredients(ingredientsList, newVal);
    },
  },
  async mounted() {
    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";
    try {
      const responsePlatillos = await fetch(`${API_URL}/platillos`);
      if (!responsePlatillos.ok) {
        throw new Error(`HTTP error! status: ${responsePlatillos.status}`);
      }
      let dataPlatillos = await responsePlatillos.json();
      if (!Array.isArray(dataPlatillos)) {
        throw new Error("Data is not an array");
      }
      // Set the initial value of cantidad to 0 for each platillo
      dataPlatillos = dataPlatillos.map((platillo) => ({
        ...platillo,
        cantidad: 0,
      }));
      this.platillos = dataPlatillos;

      const responseIngredientes = await fetch(`${API_URL}/ingredientes/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.nuevoIngrediente),
      });
      if (!responseIngredientes.ok) {
        throw new Error(`HTTP error! status: ${responseIngredientes.status}`);
      }
      const dataIngredientes = await responseIngredientes.json();
      if (!Array.isArray(dataIngredientes)) {
        throw new Error("Data is not an array");
      }
      this.ingredientes = dataIngredientes;
    } catch (error) {
      console.error(error);
    }
  },
};
</script>
 
<style scoped>
.container {
  display: flex;
}
.half {
  flex: 1;
  padding: 1em;
}
.scrollable-platillos {
  max-height: 500px; /* adjust this value as per your needs */
  overflow-y: auto;
}
</style>