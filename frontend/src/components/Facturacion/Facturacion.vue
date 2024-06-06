<template>
    <div>
        <h1>Facturación</h1>
        <select v-model="selectedProvider">
            <option value="heb">HEB</option>
            <option value="costco">Costco</option>
        </select>
        <button @click="runPlaywrightTest">Run Playwright Test</button>
    </div>
</template>

<script>
export default {
    name: 'Facturacion',
    data() {
        return {
            selectedProvider: 'heb'
        };
    },
    methods: {
        async runPlaywrightTest() {
            const API_URL =
                process.env.NODE_ENV === "production"
                    ? "https://admin-nectario-7e327f081e09.herokuapp.com/api"
                    : "http://localhost:3000/api";
            const response = await fetch(`${API_URL}/test-playwright`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vendor: this.selectedProvider })
            });

            if (response.ok) {
                alert('Playwright script executed successfully');
            } else {
                alert('Error executing Playwright script');
            }
        }
    }
}
</script>

<style scoped>
/* Add any custom styles for the component here */
</style>