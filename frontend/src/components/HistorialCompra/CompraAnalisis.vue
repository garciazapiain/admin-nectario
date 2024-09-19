<template>
  <div>
    <h1>Compra Analisis</h1>
    <p>Fecha: {{ order.fecha }}</p>
    <p># Ticket: {{ order.folio }}</p>
    <p>Proveedor: {{ order.emisor }}</p>

    <table>
      <thead>
        <tr>
          <th>Insumo</th>
          <th>Unidad</th>
          <th>Cantidad Comprada</th>
          <th>Precio promedio / unidad</th>
          <th>Importe</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in order.items" :key="index">
          <td v-if="item.editing">
            <input v-model="item.selectedIngredient" type="text" @input="searchIngredient(item)" />
            <div class="dropdown" v-if="item.filteredIngredients && item.filteredIngredients.length">
              <ul>
                <li v-for="ingredient in item.filteredIngredients" :key="ingredient.id_ingrediente"
                  @click="selectIngredient(item, ingredient)">
                  {{ ingredient.nombre }}
                </li>
              </ul>
            </div>
          </td>
          <td v-else>{{ item.selectedIngredient }}</td>

          <td v-if="item.editing">
            {{ item.selectedUnidad }}
          </td>
          <td v-else>{{ item.selectedUnidad }}</td>

          <td>
            <input v-if="item.editing" v-model="item.quantity" type="number" />
            <span v-else>{{ item.quantity }}</span>
          </td>
          <td>{{ (item.total_price / item.quantity).toFixed(2) }}</td>
          <td>
            <input v-if="item.editing" v-model="item.total_price" type="number" />
            <span v-else>{{ item.total_price }}</span>
          </td>
          <td>
            <button class="mr-1" v-if="item.editing" @click="saveItem(item)"
              :class="item.id_ingrediente ? 'bg-green-500' : 'bg-gray-400 cursor-not-allowed text-gray-600'"
              :disabled="!item.id_ingrediente"
              >
              Guardar
            </button>
            <button class="bg-blue-500 mr-1" v-else @click="editItem(item)">Editar</button>
            <button class="bg-red-500" @click="deleteItem(index)">Eliminar</button>
          </td>
        </tr>
      </tbody>
      <p>COSTO TOTAL: <input v-model.number="order.totalimporte" type="number" /></p>
    </table>
    <div class="flex flex-col items-center justify-center">
      <div class="flex">
        <button class="m-2" @click="addNewItem">Agregar Insumo Manualmente</button>
        <button class="m-2" @click="cargarData">Cargar Data de XML</button>
      </div>
      <button class=" bg-green-200 text-gray-900" @click="saveChanges">Guardar Cambios</button>
    </div>
  </div>
</template>

<script>
import API_URL from "../../config";
import 'tailwindcss/tailwind.css'

export default {
  name: "CompraAnalisis",
  data() {
    return {
      order: {
        items: [],
        emisor: "",
        fecha: "",
        folio: "",
        totalImporte: 0,
        xmldata: "",
      },
      xmlPromptVisible: false,
      xmlDetails: {
        subject: "",
        folio: "",
        fecha: "",
        emisor: "",
        totalImporte: 0,
      },
      xmlArticles: [],
      ingredients: [],
    };
  },
  async created() {
    const id = this.$route.params.id;
    const response = await fetch(`${API_URL}/historialcompra/compra/${id}`);
    this.order = await response.json();

    // Store the XML data if available
    if (this.order.xmldata) {
      this.xmlDetails.subject = this.order.folio;
      this.xmlDetails.folio = this.order.folio;
      this.xmlDetails.fecha = this.order.fecha;
      this.xmlDetails.emisor = this.order.emisor;
      this.xmlArticles = this.parseXmlData(this.order.xmldata);
    }

    // Fetch all available ingredients to be used for matching
    const ingredientResponse = await fetch(`${API_URL}/ingredientes`);
    this.ingredients = await ingredientResponse.json();

    // Map the existing order items to the ingredient details
    this.order.items = this.order.items.map((item) => {
      const matchingIngredient = this.ingredients.find(
        (ingredient) => ingredient.id_ingrediente === item.id_ingrediente
      );

      return {
        ...item,
        selectedIngredient: matchingIngredient ? matchingIngredient.nombre : item.nombre,
        selectedUnidad: matchingIngredient ? matchingIngredient.unidad : item.unidad,
        filteredIngredients: [],
        editing: false, // Add editing state to each item
      };
    });
  },
  methods: {
    async saveChanges() {
      const response = await fetch(`${API_URL}/purchase_orders/${this.$route.params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.order),
      });

      if (response.ok) {
        alert("Orden actualizada exitósamente!");
        window.location.reload()
      } else {
        alert("Error updating order.");
      }
    },
    addNewItem() {
      this.order.items.push({
        selectedIngredient: "",    // Match the property used in the template
        id_ingrediente: null,      // Initialize the id_ingrediente as null
        selectedUnidad: "",        // Match the property used in the template
        quantity: 1,               // Default quantity
        price_per_item: 0,         // Default price per item
        total_price: 0,            // Default total price
        filteredIngredients: [],   // Initialize as an empty array for dropdown suggestions
        editing: true,             // Set the item to be in editing mode by default
      });
    },
    deleteItem(index) {
      this.order.items.splice(index, 1);
    },
    deleteXmlArticle(index) {
      this.xmlArticles.splice(index, 1);
    },
    cargarData() {
      this.xmlArticles.forEach((article) => {
        this.order.items.push({
          selectedIngredient: article.selectedIngredient || article.name,
          id_ingrediente: article.id_ingrediente || null,
          selectedUnidad: article.selectedUnidad || "Unidad",
          quantity: article.quantity || 1,
          price_per_item: parseFloat((article.price || 0).toFixed(2)),
          total_price: article.totalPrice || 0,
          filteredIngredients: [],
          editing: true, // Set the item to be in editing mode by default so it can be reviewed
        });
      });
      this.xmlPromptVisible = false;
    },
    parseXmlData(xmlContent) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const xmlArticles = Array.from(xmlDoc.getElementsByTagName("cfdi:Concepto")).map((article) => {
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
          selectedIngredient: "",
          selectedUnidad: "",
        };
      });
      return xmlArticles;
    },
    searchIngredient(article) {
      if (article.selectedIngredient.length > 1) {
        article.filteredIngredients = this.ingredients.filter((ingredient) =>
          ingredient.nombre.toLowerCase().includes(article.selectedIngredient.toLowerCase())
        );
      } else {
        article.filteredIngredients = [];
      }
    },
    selectIngredient(article, ingredient) {
      article.selectedIngredient = ingredient.nombre; // Set the selected ingredient name
      article.selectedUnidad = ingredient.unidad; // Set the selected ingredient unit
      article.id_ingrediente = ingredient.id_ingrediente; // Set the selected ingredient ID
      article.price_per_item = ingredient.price;
      article.filteredIngredients = []; // Clear the dropdown after selection
    },
    saveItem(item) {
      item.editing = false;
    },
    editItem(item) {
      item.editing = true;
    },
    saveLinkedData() {
      this.order.items = this.xmlArticles.map((article) => ({
        id_ingrediente: article.id_ingrediente || null,
        nombre: article.nombre,
        unidad: article.unidad || "Unidad",
        quantity: article.quantity,
        price_per_item: parseFloat((article.price || 0).toFixed(2)),
        total_price: article.totalPrice,
      }));
      this.xmlPromptVisible = false;
    },
    closeXmlPrompt() {
      this.xmlPromptVisible = false;
    },
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
  max-height: 100px;
  overflow-y: auto;
}

.dropdown ul {
  margin: 0;
  padding: 0;
  list-style-type: none;
}

.dropdown li {
  padding: 5px 10px;
  cursor: pointer;
}

.dropdown li:hover {
  background-color: #eee;
}
</style>
