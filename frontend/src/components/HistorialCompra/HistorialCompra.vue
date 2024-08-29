<template>
  <div>
    <h1>Registro de Compras</h1>
    <!-- <button @click="scrollToInput">Scroll to Input File Section</button> -->
    <button @click="retrieveInbox">Retrieve Inbox</button>
    <table v-if="purchaseOrders.length">
      <tr>
        <th>id</th>
        <th>Folio</th>
        <th>Status</th>
        <th>Fecha</th>
        <th>Proveedor</th>
        <th>Total Importe</th>
        <th>Borrar</th>
      </tr>
      <tr v-for="order in purchaseOrders" :key="order.id">
        <td>
          <router-link :to="`${$route.path}/compra/${order.id}`">{{
            order.id
            }}</router-link>
        </td>
        <td>{{ order.folio }}</td>
        <td>
          <select :value="order.status" @change="updateStatus(order.id, $event.target.value)"
            :class="order.status === 'pendiente' ? 'bg-yellow-500' : 'bg-green-500'">
            <option value="pendiente">Pendiente</option>
            <option value="verificado">Verificado</option>
          </select>
        </td>
        <td>{{ order.fecha }}</td>
        <td>{{ order.emisor }}</td>
        <td>$ {{ order.totalimporte }}</td>
        <td>
          <button class="bg-red-500" @click="deleteOrder(order.id)">Borrar</button>
        </td>
      </tr>
    </table>
    <h2>Subir Nueva Factura en formato XML</h2>
    <input type="file" @change="handleFileUpload" accept=".xml" ref="fileInput" />
    <div v-if="xmlPromptVisible" class="xml-prompt">
      <h3>XML Details</h3>
      <p><strong>Subject:</strong> {{ xmlDetails.subject }}</p>
      <p><strong>Folio:</strong> {{ xmlDetails.folio }}</p>
      <p><strong>Fecha:</strong> {{ xmlDetails.fecha }}</p>
      <p><strong>Emisor:</strong> {{ xmlDetails.emisor }}</p>
      <p><strong>Total Importe:</strong> $ {{ xmlDetails.totalImporte }}</p>
      <button @click="closeXmlPrompt">Close</button>
    </div>
    <table v-if="articles.length">
      <p v-if="fecha">Fecha: {{ fecha }}</p>
      <p v-if="folio">Folio: {{ folio }}</p>
      <p v-if="emisor">Emisor: {{ emisor }}</p>
      <tr>
        <th>Insumo a relacionar</th>
        <th>Unidad insumo</th>
        <th>Insumo en factura</th>
        <th>Cantidad</th>
        <th>Precio por insumo</th>
        <th>Importe total</th>
        <th>Borrar</th>
      </tr>
      <tr v-for="(article, index) in articles" :key="article.name">
        <td>
          <input type="text" v-model="article.selectedIngredient" @input="searchIngredient(article)" />
          <div class="dropdown">
            <ul v-if="article.filteredIngredients.length">
              <li v-for="ingredient in article.filteredIngredients" :key="ingredient.id_ingrediente"
                @click="selectIngredient(article, ingredient)">
                {{ ingredient.nombre }}
              </li>
            </ul>
          </div>
        </td>
        <td>{{ article.selectedUnidad }}</td>
        <!-- New table data cell -->
        <!-- Add this new table data with an input field -->
        <td>{{ article.name }}</td>
        <td>
          <input type="number" v-model="article.quantity" />
        </td>
        <td>$ {{ article.price.toFixed(2) }}</td>
        <td>$ {{ article.totalPrice }}</td>
        <td>
          <button @click="deleteRow(index)">X</button>
        </td>
      </tr>
    </table>

    <p v-if="totalImporte">Total Importe: $ {{ totalImporte.toFixed(2) }}</p>
    <button v-if="articles.length" @click="handleSubmit">Submit</button>
    <p class="error-message">{{ errorMessageSubmit }}</p>
    <router-link to="/historialcompra/insumos">
      <button>Vista por Insumo</button>
    </router-link>
    <router-link to="/historialcompra/registrar-compra-manualmente">
      <button>Agregar compra manualmente</button>
    </router-link>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import API_URL from "../../config";

export default {
  methods: {
    async updateStatus(orderId, newStatus) {
      try {
        const response = await fetch(`${API_URL}/purchase_orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        window.location.reload()
      } catch (error) {
        console.error('Error updating status:', error);
      }
    },
    async deleteOrder(orderId) {
      console.log("Delete", orderId);
      try {
        const response = await fetch(`${API_URL}/purchase_orders/${orderId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        location.reload()
      } catch (error) {
        console.error("Fetch error:", error);
      }
    },
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
        unidad: article.selectedUnidad,
        // Include ingrediente_id if it's a property of article
        id_ingrediente: article.selectedIngredientId,
      }));

      const data = {
        articulosComprados,
        totalImporte: this.totalImporte,
        fecha: this.fecha,
        folio: this.folio,
        emisor: this.emisor,
      };

      try {
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
        location.reload()
        console.log(responseData);
      } catch (error) {
        console.error("Fetch error:", error);
      }

      console.log(JSON.stringify(data, null, 3));
    },
    deleteRow(index) {
      this.articles.splice(index, 1);
    },
    scrollToInput() {
      this.$refs.fileInput.scrollIntoView({ behavior: "smooth" });
    },
    retrieveInbox() {
      fetch(`${API_URL}/retrieveinbox`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(emails => {
          if (emails.length > 0) {
            const purchaseOrders = emails.map(xmlEmail => ({
              articulosComprados: [],  // Assuming you'll add items later
              totalImporte: xmlEmail.totalImporte,
              fecha: xmlEmail.fecha,
              folio: xmlEmail.folio,
              emisor: xmlEmail.emisor,
              xmldata: xmlEmail.xmlContent
            }));

            // Send the data to the backend to create new purchase orders in bulk
            fetch(`${API_URL}/purchase_orders/bulk`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ purchaseOrders }),
            })
              .then(response => response.json())
              .then(data => {
                if (data.error) {
                  console.error('Error:', data.error);
                  alert('Error: ' + data.error);
                } else {
                  console.log('Purchase orders processed successfully:', data);
                  alert(`Successfully added ${data.addedOrders.length} new purchase orders.`);
                  window.location.reload()
                }
              })
              .catch(error => {
                console.error('Error creating purchase orders:', error);
              });

          } else {
            console.log('No emails with XML attachments found.');
          }
        })
        .catch(error => {
          console.error('Fetch error:', error);
        });
    },
    closeXmlPrompt() {
      this.xmlPromptVisible = false;
    },
  },
  name: "HistorialCompra",
  setup() {
    const purchaseOrders = ref([]);
    const articles = ref([]);
    const totalImporte = ref(null);
    const ingredients = ref([]);
    const errorMessageSubmit = ref(null);
    const fecha = ref(null);
    const folio = ref(null);
    const emisor = ref(null);
    const xmlPromptVisible = ref(false);
    const xmlDetails = ref({
      subject: '',
      folio: '',
      fecha: '',
      emisor: '',
      totalImporte: 0,
    });

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
      article.selectedUnidad = ingredient.unidad;
      // Disallow further search
      article.allowSearch = false;
      console.log(article);
    };

    onMounted(async () => {
      try {
        const response = await fetch(`${API_URL}/purchase_orders`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        purchaseOrders.value = data;
      } catch (error) {
        console.error("Fetch error:", error);
      }
      try {
        const response = await fetch(`${API_URL}/ingredientes`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        ingredients.value = data.map((ingredient) => ({
          id_ingrediente: ingredient.id_ingrediente,
          nombre: ingredient.nombre,
          unidad: ingredient.unidad,
        }));
      } catch (error) {
        console.error("Fetch error:", error);
      }
    });

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, "text/xml");

            // Extract general info
            const extractedTotalImporte = parseFloat(
              xmlDoc.getElementsByTagName("cfdi:Comprobante")[0].getAttribute("Total")
            );
            const extractedFecha = xmlDoc
              .getElementsByTagName("cfdi:Comprobante")[0]
              .getAttribute("Fecha");
            const extractedFolio = xmlDoc
              .getElementsByTagName("cfdi:Comprobante")[0]
              .getAttribute("Folio");
            const extractedEmisor = xmlDoc
              .getElementsByTagName("cfdi:Emisor")[0]
              .getAttribute("Nombre");

            // Get the raw XML content
            const rawXmlData = e.target.result;

            // Prepare the data to be saved
            const dataToSave = {
              totalImporte: extractedTotalImporte,
              fecha: extractedFecha,
              folio: extractedFolio,
              emisor: extractedEmisor,
              articulosComprados: [],
              xmldata: rawXmlData,  // Save the raw XML content
            };

            // Make a POST request to save the data
            const response = await fetch(`${API_URL}/purchase_orders`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(dataToSave),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log('Purchase order saved successfully:', responseData);
            location.reload(); // Optionally reload the page to reflect changes
          } catch (error) {
            console.error("Error processing and saving data:", error);
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
      purchaseOrders,
      articles,
      handleFileUpload,
      totalImporte,
      ingredients,
      searchIngredient,
      selectIngredient,
      errorMessageSubmit,
      fecha,
      folio,
      emisor,
      xmlPromptVisible,
      xmlDetails,
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
  max-height: 100px;
  /* Adjust this value to your liking */
  overflow-y: auto;
}

.dropdown ul {
  margin: 0;
  padding: 0;
  list-style-type: none;
}

.dropdown li {
  padding: 5px 10px;
  /* Adjust this value to your liking */
  cursor: pointer;
}

.dropdown li:hover {
  background-color: #eee;
  /* Adjust this value to your liking */
}
</style>