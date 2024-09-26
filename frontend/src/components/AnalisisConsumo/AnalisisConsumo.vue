<template>
    <div>
        <h1>Análisis de Consumo</h1>
        <!-- Week Selection -->
        <div>
            <h2>Seleccionar por semana</h2>
            <select v-model="selectedWeek" @change="updateDateRange">
                <option v-for="week in weeks" :key="week.value" :value="week.value" :disabled="week.disabled">
                    {{ week.label }}
                </option>
            </select>
        </div>
        <!-- Date Range Selection -->
        <div>
            <!-- <label for="startDate">Fecha de inicio:</label>
            <input type="date" id="startDate" v-model="startDate" :max="today" />
            <label for="endDate">Fecha de fin:</label>
            <input type="date" id="endDate" v-model="endDate" :max="today" /> -->
            <button @click="fetchConsumptionData" :disabled="!selectedWeek"
                class="mt-4 bg-blue-500text-white font-semibold py-2 px-4 rounded-md disabled:bg-gray-400">
                Obtener data
            </button>
        </div>
        <div>
            <label>
                <input type="radio" value="todos" v-model="selectedLocation" />
                TODOS (INCLUYENDO CEDIS)
            </label>
            <label>
                <input type="radio" value="moral" v-model="selectedLocation" />
                MORAL
            </label>
            <label>
                <input type="radio" value="campestre" v-model="selectedLocation" />
                CAMPESTRE
            </label>
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
                    <td>{{ calculateInventarioInicial(item) }}</td>
                    <td>{{ calculateInventarioFinal(item) }}</td>
                    <td>{{ calculateCompraByLocation(item) }}</td>
                    <td>{{ (Number(calculateInventarioInicial(item)) + Number(calculateCompraByLocation(item)) -
                        Number(calculateInventarioFinal(item))).toFixed(2) }}</td>
                    <td>{{ Number(calculateTeoricoByLocation(item).toFixed(2)) }}</td>
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
            dataLoaded: false, // Add this flag to track data load
            selectedLocation: 'todos',
            consumptionData: []
        };
    },
    methods: {
        generateWeeks() {
            const weeks = [];
            const startDate = new Date(new Date().getFullYear(), 0, 1);
            while (startDate.getDay() !== 1) {
                startDate.setDate(startDate.getDate() + 1);
            }
            const today = new Date(this.today);

            while (startDate <= today) {
                const weekStart = new Date(startDate);
                const weekEnd = new Date(startDate);
                weekEnd.setDate(weekEnd.getDate() + 6);

                let label;
                if (weekStart.getMonth() !== weekEnd.getMonth()) {
                    label = `${weekStart.getDate()} de ${weekStart.toLocaleString('es-ES', { month: 'long' })} al ${weekEnd.getDate()} de ${weekEnd.toLocaleString('es-ES', { month: 'long' })}`;
                } else {
                    label = `${weekStart.getDate()} al ${weekEnd.getDate()} de ${weekStart.toLocaleString('es-ES', { month: 'long' })}`;
                }

                weeks.push({
                    value: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`,
                    label: label,
                    disabled: false // Ensure all weeks are selectable
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
            if (!this.selectedWeek) {
                this.errorMessage = "Debe seleccionar una semana antes de obtener los datos.";
                return;
            }

            this.errorMessage = null;
            this.dataLoaded = false; // Reset the flag before fetching data

            const stores = ["moral", "bosques"];
            const results = {};

            try {
                // Fetch consumption data for each store
                for (const store of stores) {
                    const response = await fetch(`${API_URL}/consumption/${store}?startDate=${this.startDate}&endDate=${this.endDate}`);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const data = await response.json();
                    results[store] = data;
                }

                const combinedData = [];
                if (results.moral && results.bosques) {
                    // Combine results from both stores
                    results.moral.forEach((ingredient) => {
                        const sameIngredientInBosques = results.bosques.find(i => i.id_ingrediente === ingredient.id_ingrediente);
                        const total_consumido_moral = parseFloat(ingredient.total_consumido);
                        const total_consumido_bosques = sameIngredientInBosques ? parseFloat(sameIngredientInBosques.total_consumido) : 0;
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
                        });
                    });
                }

                // Set consumptionData after fetching
                this.consumptionData = combinedData;
                this.filteredIngredientes = this.filteredIngredientes.map(ingrediente => {
                    // Attach relevant consumption data to each ingredient
                    const consumptionData = this.consumptionData.find(cons => cons.id_ingrediente === ingrediente.id_ingrediente);
                    return {
                        ...ingrediente,
                        total_consumido_moral: consumptionData ? consumptionData.total_consumido_moral : 0,
                        total_consumido_bosques: consumptionData ? consumptionData.total_consumido_bosques : 0,
                        total_consumido_total: consumptionData ? consumptionData.total_consumido_total : 0
                    };
                });

            } catch (error) {
                console.error("Error fetching data:", error);
            }
            // Existing logic for submissions and purchase orders
            try {
                const submissionsResponse = await fetch(`${API_URL}/submissions/inventario-submissions`);
                if (submissionsResponse.ok) {
                    const submissions = await submissionsResponse.json();
                    // Filter by the selected location (todos, moral, campestre)
                    const filteredSubmissions = submissions.filter(submission => {
                        const submissionDate = new Date(submission.timestamp);
                        return submissionDate >= new Date(`${this.startDate}T00:00:00`) && submissionDate <= new Date(`${this.endDate}T23:59:59`);
                    });
                    const sumQuantitiesForDate = (submissions, date, ingredienteId, tipoInventario, store) => {
                        return submissions
                            .filter(submission =>
                                new Date(submission.timestamp).toDateString() === date.toDateString() &&
                                submission.tipo_inventario === tipoInventario &&
                                (store === 'todos' || submission.store === store)  // Filter by store based on selectedLocation
                            )
                            .reduce((sum, submission) => {
                                const inventario = submission.inventario.find(i => i.id_ingrediente === ingredienteId);
                                const cantidadInventario = inventario ? parseFloat(inventario.cantidad) || 0 : 0;
                                return sum + cantidadInventario;
                            }, 0);
                    };
                    this.filteredIngredientes.forEach(ingrediente => {
                        // Calculate total, moral, and campestre inventories
                        ingrediente.inventario_inicial = sumQuantitiesForDate(filteredSubmissions, new Date(`${this.startDate}T00:00:00`), ingrediente.id_ingrediente, 'inicial', 'todos');
                        ingrediente.inventario_final = sumQuantitiesForDate(filteredSubmissions, new Date(`${this.endDate}T23:59:59`), ingrediente.id_ingrediente, 'final', 'todos');
                        ingrediente.inventario_inicial_moral = sumQuantitiesForDate(filteredSubmissions, new Date(`${this.startDate}T00:00:00`), ingrediente.id_ingrediente, 'inicial', 'moral');
                        ingrediente.inventario_final_moral = sumQuantitiesForDate(filteredSubmissions, new Date(`${this.endDate}T23:59:59`), ingrediente.id_ingrediente, 'final', 'moral');
                        ingrediente.inventario_inicial_campestre = sumQuantitiesForDate(filteredSubmissions, new Date(`${this.startDate}T00:00:00`), ingrediente.id_ingrediente, 'inicial', 'bosques');
                        ingrediente.inventario_final_campestre = sumQuantitiesForDate(filteredSubmissions, new Date(`${this.endDate}T23:59:59`), ingrediente.id_ingrediente, 'final', 'bosques');
                    });
                } else {
                    console.error("Error fetching submissions data:", submissionsResponse.status);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            }
            try {
                const entradasSalidasResponse = await fetch(`${API_URL}/entradas_salidas/compras?startDate=${this.startDate}&endDate=${this.endDate}`);
                if (entradasSalidasResponse.ok) {
                    const entradasSalidasData = await entradasSalidasResponse.json();
                    this.filteredIngredientes.forEach(ingrediente => {
                        const matchingData = entradasSalidasData.find(d => d.id_ingrediente === ingrediente.id_ingrediente);
                        ingrediente.total_quantity = matchingData ? parseFloat(matchingData.total_quantity) : 0;
                        ingrediente.quantity_moral = matchingData ? parseFloat(matchingData.quantity_moral) : 0;
                        ingrediente.quantity_campestre = matchingData ? parseFloat(matchingData.quantity_campestre) : 0;
                    });
                } else {
                    console.error("Error fetching data:", entradasSalidasResponse.status);
                }
            } catch (error) {
                console.error("Fetch error:", error);
                console.error("Error fetching data:", error);
            }
            this.dataLoaded = true;
        },
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
                }
            });

        },
        // Calculate the percentage difference and apply green/red coloring
        calculatePercentageDifference(id_ingrediente) {
            const item = this.filteredIngredientes.find(i => i.id_ingrediente === id_ingrediente);
            const realConsumption = Number(this.calculateInventarioInicial(item)) +
                Number(this.calculateCompraByLocation(item)) -
                Number(this.calculateInventarioFinal(item));
            const theoreticalConsumption = this.calculateTeoricoByLocation(item);

            if (theoreticalConsumption === 0 || isNaN(realConsumption) || isNaN(theoreticalConsumption)) {
                return 'Falta informacion para ';
            }

            const percentageDifference = ((theoreticalConsumption - realConsumption) / theoreticalConsumption) * 100;
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
            const realConsumption = Number(this.calculateInventarioInicial(item)) +
                Number(this.calculateCompraByLocation(item)) -
                Number(this.calculateInventarioFinal(item));
            const theoreticalConsumption = this.calculateTeoricoByLocation(item);

            return (theoreticalConsumption - realConsumption) * item.precio;
        },
        calculateTotalDollarDifference() {
            return this.filteredIngredientes.reduce((total, item) => {
                return total + this.calculateDollarDifference(item.id_ingrediente);
            }, 0);
        },
        exportToExcel() {
            const wb = XLSX.utils.book_new();

            // Prepare data for Excel export
            const wsData = this.filteredIngredientes.map(item => {
                const consumoTeoricoValue = this.calculateTeoricoByLocation(item).toFixed(2);
                const diferenciaDollarValue = this.calculateDollarDifference(item.id_ingrediente).toFixed(2);

                return {
                    Ingrediente: item.nombre,
                    Unidad: item.unidad,
                    "Inventario Inicial": Number(this.calculateInventarioInicial(item)),
                    "Inventario Final": Number(this.calculateInventarioFinal(item)),
                    Compras: Number(this.calculateCompraByLocation(item)),
                    "Consumo Real": Number(
                        (Number(this.calculateInventarioInicial(item)) +
                            Number(this.calculateCompraByLocation(item)) -
                            Number(this.calculateInventarioFinal(item))
                        ).toFixed(2)),
                    "Consumo Teórico": consumoTeoricoValue,
                    "Diferencia $": diferenciaDollarValue
                };
            });

            // Add total row at the end
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

            // Convert data to Excel sheet and save
            const ws = XLSX.utils.json_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Análisis de Consumo");

            XLSX.writeFile(wb, "analisis_consumo.xlsx");
        },
    },
    computed: {
        calculateInventarioInicial() {
            return (item) => {
                if (!this.dataLoaded) {
                    return 0;
                }
                if (this.selectedLocation === 'moral') {
                    return item.inventario_inicial_moral;
                } else if (this.selectedLocation === 'campestre') {
                    return item.inventario_inicial_campestre;
                } else {
                    return item.inventario_inicial; // Default to total or combined
                }
            };
        },
        calculateInventarioFinal() {
            return (item) => {
                if (this.selectedLocation === 'moral') {
                    return item.inventario_final_moral;
                } else if (this.selectedLocation === 'campestre') {
                    return item.inventario_final_campestre;
                } else {
                    return item.inventario_final; // Default to total or combined
                }
            };
        },
        calculateCompraByLocation() {
            return (item) => {
                if (this.selectedLocation === 'moral') {
                    return item.quantity_moral;
                } else if (this.selectedLocation === 'campestre') {
                    return item.quantity_campestre;
                } else {
                    return item.total_quantity; // Default to total or combined
                }
            };
        },
        calculateTeoricoByLocation() {
            return (item) => {
                // Check if consumptionData is available and loaded
                if (!this.dataLoaded || !this.consumptionData.length) {
                    return 0; // If no data is loaded, return 0
                }

                // Find the matching ingredient data from consumptionData
                const matchedConsumption = this.consumptionData.find(cons => cons.id_ingrediente === item.id_ingrediente);

                if (!matchedConsumption) {
                    return 0; // Return 0 if no match is found
                }

                // Select the correct total_consumido field based on the selected location
                let totalConsumido = 0;
                if (this.selectedLocation === 'moral') {
                    totalConsumido = matchedConsumption.total_consumido_moral || 0;
                } else if (this.selectedLocation === 'campestre') {
                    totalConsumido = matchedConsumption.total_consumido_bosques || 0;
                } else {
                    totalConsumido = matchedConsumption.total_consumido_total || 0; // Default to total or combined
                }

                // Ensure totalConsumido is a valid number before calling .toFixed()
                return isNaN(totalConsumido) ? 0 : totalConsumido;
            };
        },
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
    border-radius: 5px;
}

div {
    margin-bottom: 20px;
}
</style>