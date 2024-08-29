<template>
    <div>
        <h1>Agregar Registro de Compras Manual</h1>
        <form @submit.prevent="submitManualPurchase">
            <div>
                <label for="fecha">Fecha:</label>
                <input type="date" id="fecha" v-model="fecha" required />
            </div>

            <div>
                <label for="emisor">Proveedor:</label>
                <select id="emisor" v-model="selectedProveedor" required>
                    <option v-for="proveedor in proveedores" :key="proveedor.id" :value="proveedor.nombre">
                        {{ proveedor.nombre }}
                    </option>
                </select>
            </div>

            <h2>Artículos</h2>
            <table>
                <thead>
                    <tr>
                        <th>Insumo</th>
                        <th>Unidad</th>
                        <th>Cantidad</th>
                        <th>Precio por Unidad</th>
                        <th>Importe Total</th>
                        <th>Borrar</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(article, index) in articles" :key="index">
                        <td>
                            <input type="text" v-model="article.selectedIngredient" @input="searchIngredient(article)"
                                required />
                            <div class="dropdown">
                                <ul v-if="article.filteredIngredients.length">
                                    <li v-for="ingredient in article.filteredIngredients"
                                        :key="ingredient.id_ingrediente" @click="selectIngredient(article, ingredient)">
                                        {{ ingredient.nombre }}
                                    </li>
                                </ul>
                            </div>
                        </td>
                        <td>{{ article.selectedUnidad }}</td>
                        <td>
                            <input type="number" v-model="article.cantidad" @input="updateTotalPrice(article)" required
                                step="0.01" min="0"/>
                        </td>
                        <td>
                            <input type="number" v-model="article.precio" @input="updateTotalPrice(article)" required step="0.01" min="0" />
                        </td>
                        <td>{{ article.totalImporte }}</td>
                        <td>
                            <button type="button" @click="deleteArticle(index)">X</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <button type="button" @click="addNewArticle">Agregar Artículo</button>

            <p>Total Importe: ${{ totalImporte }}</p>
            <button type="submit">Guardar Registro</button>
        </form>
    </div>
</template>

<script>
import API_URL from "../../config";

export default {
    name: "ManualPurchaseRecord",
    data() {
        return {
            fecha: "",
            selectedProveedor: "",
            folio: "",
            articles: [
                {
                    selectedIngredient: "",
                    selectedUnidad: "",
                    cantidad: 0,
                    precio: 0,  // This will be automatically set when an ingredient is selected
                    totalImporte: 0,
                    filteredIngredients: [],
                    allowSearch: true,
                },
            ],
            proveedores: [],
            ingredientes: [],
        };
    },
    computed: {
        totalImporte() {
            return this.articles.reduce((sum, article) => sum + parseFloat(article.totalImporte || 0), 0).toFixed(2);
        },
    },
    async mounted() {
        await this.fetchProveedores();
        await this.fetchIngredientes();
    },
    methods: {
        async fetchProveedores() {
            try {
                const response = await fetch(`${API_URL}/proveedores`);
                if (response.ok) {
                    this.proveedores = await response.json();
                } else {
                    console.error("Error fetching proveedores:", response.status);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            }
        },
        async fetchIngredientes() {
            try {
                const response = await fetch(`${API_URL}/ingredientes`);
                if (response.ok) {
                    const allIngredientes = await response.json();
                    // Filter only those ingredients where producto_clave is true
                    this.ingredientes = allIngredientes
                    // this.ingredientes = allIngredientes.filter(ingrediente => ingrediente.producto_clave === true);
                } else {
                    console.error("Error fetching ingredientes:", response.status);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            }
        },
        searchIngredient(article) {
            if (!article.allowSearch) return;
            article.filteredIngredients = this.ingredientes.filter((ingredient) =>
                ingredient.nombre.toLowerCase().includes(article.selectedIngredient.toLowerCase())
            );
        },
        selectIngredient(article, ingredient) {
            article.selectedIngredient = ingredient.nombre;
            article.selectedUnidad = ingredient.unidad;
            article.precio = ingredient.precio; // Set the default price to the ingredient's price
            article.allowSearch = false;
            article.filteredIngredients = []; // Clear the dropdown after selection
            article.selectedIngredientId = ingredient.id_ingrediente;
            this.updateTotalPrice(article); // Update the total price immediately
        },
        addNewArticle() {
            this.articles.push({
                selectedIngredient: "",
                selectedUnidad: "",
                cantidad: 0,
                precio: 0,
                totalImporte: 0,
                filteredIngredients: [],
                allowSearch: true,
            });
        },
        deleteArticle(index) {
            this.articles.splice(index, 1);
        },
        updateTotalPrice(article) {
            article.totalImporte = (article.cantidad * article.precio).toFixed(2);
        },
        async submitManualPurchase() {
            const articulosComprados = this.articles.map((article) => ({
                name: article.selectedIngredient,
                quantity: article.cantidad,
                price: article.precio,
                totalPrice: article.totalImporte,
                unidad: article.selectedUnidad,
                id_ingrediente: article.selectedIngredientId,
            }));

            const data = {
                articulosComprados,
                totalImporte: this.totalImporte,
                fecha: this.fecha,
                emisor: this.selectedProveedor,
                folio: null,
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
                console.log(responseData);
                // Optionally, reset the form after submission
            } catch (error) {
                console.error("Fetch error:", error);
            }
        },
    },
};
</script>

<style scoped>
form {
    max-width: 600px;
    margin: auto;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
}

input,
select {
    width: 100%;
    padding: 8px;
    margin-bottom: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

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
    background-color: #0056b3;
}

button {
    padding: 10px 20px;
    border: none;
    background-color: #007bff;
    color: white;
    cursor: pointer;
    border-radius: 5px;
    margin-top: 10px;
}

button:hover {
    background-color: #0056b3;
}
</style>
