<template>
    <div>
        <h1>Análisis de Consumo</h1>

        <!-- Date Range Selection -->
        <div>
            <label for="startDate">Fecha de inicio:</label>
            <input type="date" id="startDate" v-model="startDate" :max="today" />
            <label for="endDate">Fecha de fin:</label>
            <input type="date" id="endDate" v-model="endDate" :max="today" />
            <button @click="fetchConsumptionData">Obtener data</button>
        </div>

        <!-- Week Selection -->
        <div>
            <h2>Seleccionar por semana</h2>
            <select v-model="selectedWeek" @change="updateDateRange">
                <option v-for="week in weeks" :key="week.value" :value="week.value" :disabled="week.disabled">
                    {{ week.label }}
                </option>
            </select>
        </div>

        <!-- Data Table -->
        <table>
            <thead>
                <tr>
                    <th>Ingrediente</th>
                    <th>Unidad</th>
                    <th>Inventario Inicial</th>
                    <th>Inventario Final</th>
                    <th>Compras</th>
                    <th>Consumo Real</th>
                    <th>Consumo Teórico</th>
                    <th>Diferencia %</th>
                    <th>Diferencia $</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in filteredIngredientes" :key="item.id_ingrediente">
                    <td>{{ item.nombre }}</td>
                    <td>{{ item.unidad }}</td>
                    <td>{{ item.inventario_inicial }}</td>
                    <td>{{ item.inventario_final }}</td>
                    <td>{{ item.compras }}</td>
                    <td>{{ (Number(item.inventario_inicial) + Number(item.compras) -
                        Number(item.inventario_final)).toFixed(2) }}</td>
                    <td>{{ getTotalConsumidoTeorico(item.id_ingrediente).toFixed(2) }}</td>
                    <td :style="{ color: getPercentageDifferenceColor(item.id_ingrediente) }">
                        {{ calculatePercentageDifference(item.id_ingrediente) }}%
                    </td>
                    <td>
                        {{ calculateDollarDifference(item.id_ingrediente).toFixed(2) }}
                    </td>
                </tr>
            </tbody>
            <!-- Table remains unchanged -->
            <div style="text-align: right; font-weight: bold; margin-top: 10px;">
                Total Diferencia $: {{ calculateTotalDollarDifference().toFixed(2) }}
            </div>
            <div v-if="dataLoaded" style="margin-top: 20px;">
                <button @click="exportToExcel">Exportar a Excel</button>
            </div>
        </table>
    </div>
</template>

<script>
import API_URL from "../../config";  // Ensure you have the correct path to your config
import * as XLSX from "xlsx";

export default {
    name: "AnalisisConsumo",
    data() {
        return {
            startDate: null,
            endDate: null,
            ingredientes: [],
            filteredIngredientes: [],
            filteredOrders: [],
            today: new Date().toISOString().split('T')[0],
            selectedWeek: null,
            weeks: [],
            totalConsumidoTeoricoData: [],
            dataLoaded: false // Add this flag to track data load
        };
    },
    methods: {
        generateWeeks() {
            const weeks = [];
            const startDate = new Date(new Date().getFullYear(), 0, 1);
            while (startDate.getDay() !== 1) {
                startDate.setDate(startDate.getDate() + 1);
            }
            const endDate = new Date(this.today);

            while (startDate <= endDate) {
                const weekStart = new Date(startDate);
                const weekEnd = new Date(startDate);
                weekEnd.setDate(weekEnd.getDate() + 6);

                let isIncompleteWeek = false;
                if (weekEnd > endDate) {
                    weekEnd.setDate(endDate.getDate());
                    isIncompleteWeek = true;
                }

                let label;
                if (weekStart.getMonth() !== weekEnd.getMonth()) {
                    label = `${weekStart.getDate()} de ${weekStart.toLocaleString('es-ES', { month: 'long' })} al ${weekEnd.getDate()} de ${weekEnd.toLocaleString('es-ES', { month: 'long' })}`;
                } else {
                    label = `${weekStart.getDate()} al ${weekEnd.getDate()} de ${weekStart.toLocaleString('es-ES', { month: 'long' })}`;
                }

                weeks.push({
                    value: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`,
                    label: label,
                    disabled: isIncompleteWeek, // Mark this week as disabled if it's incomplete
                });

                startDate.setDate(startDate.getDate() + 7);
            }

            this.weeks = weeks.reverse();
        },
        updateDateRange() {
            if (this.selectedWeek) {
                const [start, end] = this.selectedWeek.split('_');
                this.startDate = start;
                this.endDate = end;
            }
        },
        async fetchIngredientes() {
            try {
                const response = await fetch(`${API_URL}/ingredientes`);
                if (response.ok) {
                    this.ingredientes = await response.json();
                    // Filter out ingredientes where producto_clave is true
                    this.filteredIngredientes = this.ingredientes.filter(ingrediente => ingrediente.producto_clave);
                } else {
                    console.error("HTTP error:", response.status);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            }
        },
        async fetchConsumptionData() {
            this.errorMessage = null; // Reset the error message before fetching data
            this.dataLoaded = true;

            if (!this.startDate || !this.endDate) {
                this.errorMessage = "Ambas fechas deben ser seleccionadas.";
                setTimeout(() => {
                    this.errorMessage = null;
                }, 5000);
                return;
            }

            const stores = ["moral", "bosques"];
            const results = {};

            for (const store of stores) {
                try {
                    const response = await fetch(
                        `${API_URL}/consumption/${store}?startDate=${this.startDate}&endDate=${this.endDate}`
                    );
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    results[store] = data; // Store the data for each store in the results object
                } catch (error) {
                    console.error("Fetch error:", error);
                }
            }

            const combinedData = [];
            if (results.moral && results.bosques) {
                for (const ingredient of results.moral) {
                    const sameIngredientInBosques = results.bosques.find(
                        (i) => i.id_ingrediente === ingredient.id_ingrediente
                    );
                    const total_consumido_moral = parseFloat(ingredient.total_consumido);
                    const total_consumido_bosques = sameIngredientInBosques
                        ? parseFloat(sameIngredientInBosques.total_consumido)
                        : 0;
                    const total_consumido_total = total_consumido_moral + total_consumido_bosques;
                    combinedData.push({
                        id_ingrediente: ingredient.id_ingrediente,
                        nombre: ingredient.nombre,
                        precio: ingredient.precio,
                        unidad: ingredient.unidad,
                        proveedor: ingredient.proveedor,
                        producto_clave: ingredient.producto_clave,
                        total_consumido_moral: total_consumido_moral,
                        total_consumido_bosques: total_consumido_bosques,
                        total_consumido_total: total_consumido_total,
                        total_consumido_dinero: total_consumido_total * ingredient.precio,
                    });
                }
            }

            this.consumptionData = combinedData;
            if (this.consumptionData.length === 0) {
                this.errorMessage = "No se encontró data en esas fechas.";
                setTimeout(() => {
                    this.errorMessage = null;
                }, 5000);
            }

            // Existing logic for submissions and purchase orders
            try {
                const submissionsResponse = await fetch(`${API_URL}/submissions/inventario-submissions`);
                if (submissionsResponse.ok) {
                    const submissions = await submissionsResponse.json();

                    const filteredSubmissions = submissions.filter(submission => {
                        const submissionDate = new Date(submission.timestamp);
                        return submissionDate >= new Date(`${this.startDate}T00:00:00`) && submissionDate <= new Date(`${this.endDate}T23:59:59`);
                    });

                    const sumQuantitiesForDate = (submissions, date, ingredienteId, tipoInventario) => {
                        return submissions
                            .filter(submission =>
                                new Date(submission.timestamp).toDateString() === date.toDateString() &&
                                submission.tipo_inventario === tipoInventario
                            )
                            .reduce((sum, submission) => {
                                const inventario = submission.inventario.find(i => i.id_ingrediente === ingredienteId);
                                const cantidadInventario = inventario ? parseFloat(inventario.cantidad) || 0 : 0;
                                return sum + cantidadInventario;
                            }, 0);
                    };

                    this.filteredIngredientes.forEach(ingrediente => {
                        const initialInventory = sumQuantitiesForDate(filteredSubmissions, new Date(`${this.startDate}T00:00:00`), ingrediente.id_ingrediente, 'inicial');
                        const finalInventory = sumQuantitiesForDate(filteredSubmissions, new Date(`${this.endDate}T23:59:59`), ingrediente.id_ingrediente, 'final');
                        ingrediente.inventario_inicial = initialInventory;
                        ingrediente.inventario_final = finalInventory;
                    });
                } else {
                    console.error("Error fetching submissions data:", submissionsResponse.status);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            }

            try {
                const purchaseOrdersResponse = await fetch(`${API_URL}/purchase_orders/analisis-consumo?startDate=${this.startDate}&endDate=${this.endDate}`);
                if (purchaseOrdersResponse.ok) {
                    const purchaseData = await purchaseOrdersResponse.json();
                    this.filteredIngredientes.forEach(ingrediente => {
                        const matchingData = purchaseData.find(d => d.id_ingrediente === ingrediente.id_ingrediente);
                        ingrediente.compras = matchingData ? matchingData.total_quantity : 0;
                    });
                } else {
                    console.error("Error fetching data:", purchaseOrdersResponse.status);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            }
        }

        ,
        sumPurchasesForIngredients() {
            // Reset previous purchase sums
            this.filteredIngredientes.forEach(ingrediente => {
                ingrediente.compras = 0;  // Initialize compras to 0
            });
            // Iterate over filtered orders
            this.filteredOrders.forEach(order => {
                if (order.articulosComprados && Array.isArray(order.articulosComprados)) {
                    order.articulosComprados.forEach(purchase => {
                        // Find the corresponding ingredient in the articles list
                        const ingredient = this.filteredIngredientes.find(ingrediente => ingrediente.nombre === purchase.name);

                        if (ingredient) {
                            // Add the purchase quantity to the ingredient's compras
                            ingredient.compras += parseFloat(purchase.quantity) || 0;
                        }
                    });
                } else {
                    console.warn(`No articulosComprados found for order with id: ${order.id}`);
                }
            });

        },
        async fetchTotalConsumidoTeorico() {
            try {
                const response = await fetch(`${API_URL}/consumption`);
                if (response.ok) {
                    this.totalConsumidoTeoricoData = await response.json();
                } else {
                    console.error("Error fetching consumption data:", response.status);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            }
        },
        getTotalConsumidoTeorico(id_ingrediente) {
            const match = this.consumptionData.find(item => item.id_ingrediente === id_ingrediente);
            return match ? match.total_consumido_total : 0;
        },
        // Calculate the percentage difference and apply green/red coloring
        calculatePercentageDifference(id_ingrediente) {
            const item = this.filteredIngredientes.find(i => i.id_ingrediente === id_ingrediente);
            const realConsumption = Number(item.inventario_inicial) + Number(item.compras) - Number(item.inventario_final);
            const theoreticalConsumption = this.getTotalConsumidoTeorico(id_ingrediente);

            // Check if theoreticalConsumption is zero or if either value is invalid
            if (theoreticalConsumption === 0 || isNaN(realConsumption) || isNaN(theoreticalConsumption)) {
                return 'Falta informacion para '; // Return an empty string for invalid values
            }

            // Calculate the percentage difference
            const percentageDifference = ((theoreticalConsumption - realConsumption) / theoreticalConsumption) * 100;

            // Return the calculated percentage or an empty string if invalid
            return isNaN(percentageDifference) || !isFinite(percentageDifference) ? '' : percentageDifference.toFixed(2);
        },

        // Determine the color based on whether the theoretical consumption is larger or smaller than the real consumption
        getPercentageDifferenceColor(id_ingrediente) {
            const percentageDifference = this.calculatePercentageDifference(id_ingrediente);
            return percentageDifference >= 0 ? 'green' : 'red';
        },

        // Calculate the dollar difference between theoretical and real consumption
        calculateDollarDifference(id_ingrediente) {
            const item = this.filteredIngredientes.find(i => i.id_ingrediente === id_ingrediente);
            const realConsumption = Number(item.inventario_inicial) + Number(item.compras) - Number(item.inventario_final);
            const theoreticalConsumption = this.getTotalConsumidoTeorico(id_ingrediente);

            // Calculate the dollar difference
            return (theoreticalConsumption - realConsumption) * item.precio;
        },
        calculateTotalDollarDifference() {
            return this.filteredIngredientes.reduce((total, item) => {
                return total + this.calculateDollarDifference(item.id_ingrediente);
            }, 0);
        },
        exportToExcel() {
            const wb = XLSX.utils.book_new();
            const wsData = this.filteredIngredientes.map(item => {
                const consumoTeorico = this.getTotalConsumidoTeorico(item.id_ingrediente);
                const consumoTeoricoValue = (typeof consumoTeorico === 'number' && !isNaN(consumoTeorico) && isFinite(consumoTeorico))
                    ? consumoTeorico.toFixed(2)
                    : '';

                const diferenciaDollar = this.calculateDollarDifference(item.id_ingrediente);
                const diferenciaDollarValue = (typeof diferenciaDollar === 'number' && !isNaN(diferenciaDollar) && isFinite(diferenciaDollar))
                    ? diferenciaDollar.toFixed(2)
                    : '';

                return {
                    Ingrediente: item.nombre,
                    Unidad: item.unidad,
                    "Inventario Inicial": Number(item.inventario_inicial),
                    "Inventario Final": Number(item.inventario_final),
                    Compras: Number(item.compras),
                    "Consumo Real": Number((Number(item.inventario_inicial) + Number(item.compras) - Number(item.inventario_final)).toFixed(2)),
                    "Consumo Teórico": consumoTeoricoValue,
                    "Diferencia $": diferenciaDollarValue
                };
            });

            wsData.push({
                Ingrediente: 'Total',
                Unidad: '',
                "Inventario Inicial": '',
                "Inventario Final": '',
                Compras: '',
                "Consumo Real": '',
                "Consumo Teórico": '',
                "Diferencia $": this.calculateTotalDollarDifference().toFixed(2)
            });

            const ws = XLSX.utils.json_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Análisis de Consumo");

            XLSX.writeFile(wb, "analisis_consumo.xlsx");
        }


    },
    async mounted() {
        this.generateWeeks();
        await this.fetchIngredientes(); // Fetch ingredientes when the component is mounted
    }
};
</script>

<style scoped>
button {
    padding: 10px 20px;
    border: none;
    background-color: #007bff;
    color: white;
    cursor: pointer;
    border-radius: 5px;
}

button:hover {
    background-color: #0056b3;
}

div {
    margin-bottom: 20px;
}
</style>