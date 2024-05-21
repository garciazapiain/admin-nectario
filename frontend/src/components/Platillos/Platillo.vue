<script>
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
    : "http://localhost:3000/api";
import IngredientForm from "../Ingredientes/IngredientForm.vue";
import SubPlatilloForm from "../Subplatillos/SubPlatilloForm.vue";
export default {
  data() {
    return {
      platillo: {},
      includeSubplatillos: false,
      ingredientes: [],
      selectedIngredients: [],
      subPlatillos: [],
      mensajeError: "",
      ingredienteAgregadoExitosamente: "",
      searchTerm: "",
      API_URL: API_URL,
      editIndex: -1,
      editValue: 0,
    };
  },
  components: {
    IngredientForm,
    SubPlatilloForm,
  },
  computed: {
    aggregatedIngredients() {
      let ingredients = {};
      if (this.platillo && this.platillo.ingredients) {
        this.platillo.ingredients.forEach((ingrediente) => {
          let cantidad = ingrediente.is_subplatillo
            ? (ingrediente.cantidad / ingrediente.rendimiento) *
              (ingrediente.subplatillo_cantidad
                ? ingrediente.subplatillo_cantidad
                : 1)
            : ingrediente.cantidad;

          if (ingredients[ingrediente.id_ingrediente]) {
            ingredients[ingrediente.id_ingrediente].cantidad +=
              parseFloat(cantidad);
          } else {
            ingredients[ingrediente.id_ingrediente] = {
              ...ingrediente,
              cantidad: parseFloat(cantidad),
            };
          }
        });
      }
      return Object.values(ingredients);
    },
    existingIngredientIds() {
      return this.platillo.ingredients
        ? this.platillo.ingredients.map((i) => i.id_ingrediente)
        : [];
    },
    existingSubPlatilloIds() {
      return this.platillo.subPlatillos
        ? this.platillo.subPlatillos.map((s) => s.id_subplatillo)
        : [];
    },
    totalCost() {
      let total = 0;
      this.aggregatedIngredients.forEach((ingrediente) => {
        // console.log(total);
        total += ingrediente.precio * ingrediente.cantidad;
      });
      return total;
    },
  },
  async mounted() {
    this.fetchData();
    this.fetchIngredientes();
    this.fetchSubPlatillos();
  },
  watch: {
    includeSubplatillos() {
      this.fetchData();
    },
  },
  methods: {
    async fetchData() {
      const id = this.$route.params.id;
      try {
        const response = await fetch(
          `${API_URL}/platillo/${id}?includeSubplatillos=${this.includeSubplatillos}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.platillo = data;
      } catch (error) {
        console.error("Error:", error);
      }
    },
    async fetchIngredientes() {
      try {
        const response = await fetch(`${API_URL}/ingredientes/demanda`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.ingredientes = data;
      } catch (error) {
        console.error("Error:", error);
      }
    },
    async fetchSubPlatillos() {
      try {
        const response = await fetch(`${API_URL}/subplatillos`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.subPlatillos = data;
      } catch (error) {
        console.error("Error:", error);
      }
    },
    handleClickIngrediente(idIngrediente) {
      const idStr = String(idIngrediente);
      if (idStr.startsWith("sub_")) {
        const id = idStr.replace("sub_", "");
        this.$router.push(`/subplatillo/${id}`);
      } else {
        this.$router.push(`/ingrediente/${idStr}`);
      }
    },
    handleOpenEditIngredient(index) {
      this.editIndex = index;
      this.editValue = this.aggregatedIngredients[index].cantidad;
    },
    async handleSaveEditIngredient() {
      const idPlatillo = this.$route.params.id;
      const idIngrediente =
        this.aggregatedIngredients[this.editIndex].id_ingrediente;
      const cantidad = this.editValue;

      try {
        const response = await fetch(
          `${API_URL}/platillos/${idPlatillo}/ingredientes/${idIngrediente}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cantidad }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        this.fetchData()
        console.log(`Cantidad nueva: ${data.cantidad}`);
      } catch (error) {
        console.error("Error:", error);
      }

      this.editIndex = -1;
    },
    async handleDeleteIngredient(ingrediente) {
      const idPlatillo = this.$route.params.id;
      const idIngrediente = ingrediente.id_ingrediente;

      try {
        const response = await fetch(
          `${API_URL}/platillos/${idPlatillo}/ingredientes/${idIngrediente}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data.message);
        this.fetchData(); // Refresh the data after a successful delete
      } catch (error) {
        console.error("Error:", error);
      }
    },
  },
};
</script>
<template>
  <div>
    <h1>{{ platillo.nombre }}</h1>
    <p>Unidades vendidas:{{ platillo.unidades_vendidas }}</p>
    <div>
      <input
        type="checkbox"
        id="includeSubplatillos"
        v-model="includeSubplatillos"
      />
      <label for="includeSubplatillos">INCLUIR SUBPLATILLOS</label>
    </div>
    <table>
      <thead>
        <tr>
          <th>INGREDIENTE</th>
          <th>UNIDAD</th>
          <th>CANTIDAD</th>
          <th>$/CANTIDAD</th>
          <th>BORRAR</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(ingrediente, index) in aggregatedIngredients" :key="index">
          <td @click="handleClickIngrediente(ingrediente.id_ingrediente)">
            {{ ingrediente.nombre }}
          </td>
          <td>{{ ingrediente.unidad }}</td>
          <td>
            <div class="editRow" v-if="editIndex !== index">
              {{ ingrediente.cantidad.toFixed(3) }}
              <button @click="handleOpenEditIngredient(index)">Editar</button>
            </div>
            <div class="editRow" v-else>
              <input type="number" v-model="editValue" />
              <button @click="handleSaveEditIngredient">Guardar</button>
            </div>
          </td>
          <td>${{ (ingrediente.precio * ingrediente.cantidad).toFixed(2) }}</td>
          <td>
            <button @click="handleDeleteIngredient(ingrediente)">Borrar</button>
            <!-- New delete button -->
          </td>
        </tr>
      </tbody>
      <p>COSTO TOTAL: $ {{ totalCost.toFixed(2) }}</p>
    </table>
    <IngredientForm
      :ingredientes="ingredientes"
      :existingIngredientIds="existingIngredientIds"
      :postUrl="`${API_URL}/platillos/${$route.params.id}/ingredientes`"
      @ingredientAdded="fetchData"
    />
    <SubPlatilloForm
      :subPlatillos="subPlatillos"
      :existingSubPlatilloIds="existingSubPlatilloIds"
      @subPlatilloAdded="fetchData"
    />
  </div>
</template>


<style scoped>
h2,
p,
div {
  margin: 0.5rem 0;
}
.editRow {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 1.5rem;
}
.editRow > button {
  width: 80%;
}
</style>