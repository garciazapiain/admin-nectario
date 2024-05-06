<template>
  <div>
    <h1>Historial de Compra</h1>
    <input type="file" @change="handleFileUpload" accept=".xml" />
    <table v-if="articles.length">
      <p v-if="fecha">Fecha: {{ fecha }}</p>
      <tr>
        <th>Insumo relacionado</th>
        <th>Insumo en factura</th>
        <th>Quantity</th>
        <th>Price per Item</th>
        <th>Total Price</th>
        <th>Borrar</th>
      </tr>
      <tr v-for="article in articles" :key="article.name">
        <td>
          <input
            type="text"
            v-model="article.selectedIngredient"
            @input="searchIngredient(article)"
          />
          <div class="dropdown">
            <ul v-if="article.filteredIngredients.length">
              <li
                v-for="ingredient in article.filteredIngredients"
                :key="ingredient.id_ingrediente"
                @click="selectIngredient(article, ingredient)"
              >
                {{ ingredient.nombre }}
              </li>
            </ul>
          </div>
        </td>
        <!-- Add this new table data with an input field -->
        <td>{{ article.name }}</td>
        <td>{{ article.quantity }}</td>
        <td>$ {{ article.price }}</td>
        <td>$ {{ article.totalPrice }}</td>
        <td>
          <button @click="deleteRow(index)">X</button>
        </td>
      </tr>
    </table>

    <p v-if="totalImporte">Total Importe: $ {{ totalImporte }}</p>
    <button v-if="articles.length" @click="handleSubmit">Submit</button>
    <p class="error-message">{{ errorMessageSubmit }}</p>
    <router-link to="/historialcompra/insumos">
      <button>Go to Ingredient View</button>
    </router-link>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";

export default {
  methods: {
    async handleSubmit() {
      // Check if selectedIngredient is present for each article
      const allIngredientsSelected = this.articles.every(
        (article) => article.selectedIngredient
      );

      console.log(allIngredientsSelected);

      if (!allIngredientsSelected) {
        this.errorMessageSubmit =
          "Please select an ingredient for each article before submitting.";
        return;
      }

      // Reset errorMessage if all ingredients are selected
      this.errorMessageSubmit = "";

      const articulosComprados = this.articles.map((article) => ({
        name: article.name,
        quantity: article.quantity,
        price: article.price,
        totalPrice: article.totalPrice,
        selectedIngredient: article.selectedIngredient,
        // Include ingrediente_id if it's a property of article
        id_ingrediente: article.selectedIngredientId,
      }));

      const data = {
        articulosComprados,
        totalImporte: this.totalImporte,
        fecha: this.fecha,
      };

      try {
        const API_URL =
          process.env.NODE_ENV === "production"
            ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
            : "http://localhost:3000/api";
        const response = await fetch(`${API_URL}/purchase_orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log(responseData);
      } catch (error) {
        console.error("Fetch error:", error);
      }

      console.log(JSON.stringify(data, null, 3));
    },
    deleteRow(index) {
      this.articles.splice(index, 1);
    },
  },
  name: "HistorialCompra",
  setup() {
    const articles = ref([]);
    const totalImporte = computed(() => {
      return articles.value.reduce(
        (total, article) => total + Number(article.totalPrice),
        0
      );
    });
    const ingredients = ref([]);
    const errorMessageSubmit = ref(null);
    const fecha = ref(null);

    const searchIngredient = (article) => {
      // Only search if the search is allowed
      if (!article.allowSearch) {
        return;
      }
      article.filteredIngredients = computed(() => {
        if (!article.selectedIngredient) {
          return [];
        }
        return ingredients.value.filter((ingredient) =>
          ingredient.nombre
            .toLowerCase()
            .includes(article.selectedIngredient.toLowerCase())
        );
      });
    };

    const selectIngredient = (article, ingredient) => {
      // Store the selected ingredient
      article.selectedIngredient = ingredient.nombre;
      article.selectedIngredientId = ingredient.id_ingrediente;
      // Disallow further search
      article.allowSearch = false;
    };

    const API_URL =
      process.env.NODE_ENV === "production"
        ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
        : "http://localhost:3000/api";

    onMounted(async () => {
      try {
        const response = await fetch(`${API_URL}/ingredientes`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        ingredients.value = data.map((ingredient) => ({
          id_ingrediente: ingredient.id_ingrediente,
          nombre: ingredient.nombre,
        }));
      } catch (error) {
        console.error("Fetch error:", error);
      }
    });

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
            const xmlArticles = xmlDoc.getElementsByTagName("cfdi:Concepto");
            fecha.value = xmlDoc
              .getElementsByTagName("cfdi:Comprobante")[0]
              .getAttribute("Fecha");

            console.log("Fecha after XML parsing:", fecha.value); // New console log

            articles.value = Array.from(xmlArticles).map((article) => {
              const name = article.getAttribute("Descripcion");
              const quantity = parseInt(article.getAttribute("Cantidad"));
              const price = parseFloat(article.getAttribute("ValorUnitario"));
              return {
                name,
                quantity,
                price,
                totalPrice: (quantity * price).toFixed(2),
                filteredIngredients: [],
                allowSearch: true,
              };
            });
            articles.value.forEach((article) => {
              searchIngredient(article);
            });
          } catch (error) {
            console.error("Error parsing XML:", error);
          }
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
        };
        reader.readAsText(file);
      } else {
        console.log("No file selected");
      }
    };

    return {
      articles,
      handleFileUpload,
      totalImporte,
      ingredients,
      searchIngredient,
      selectIngredient,
      errorMessageSubmit,
      fecha,
    };
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
  border: 1px solid #000;
  padding: 10px;
}
.dropdown {
  max-height: 100px; /* Adjust this value to your liking */
  overflow-y: auto;
}

.dropdown ul {
  margin: 0;
  padding: 0;
  list-style-type: none;
}

.dropdown li {
  padding: 5px 10px; /* Adjust this value to your liking */
  cursor: pointer;
}

.dropdown li:hover {
  background-color: #eee; /* Adjust this value to your liking */
}
</style>