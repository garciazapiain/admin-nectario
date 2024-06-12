<template>
  <div>
    <h2>AGREGAR SUB-PLATILLO</h2>
    <input
      v-model="searchTerm"
      type="text"
      placeholder="BUSCAR SUB-PLATILLO"
      class="search-input"
    />
    <form @submit.prevent="addSubPlatillo">
      <table>
        <thead>
          <tr>
            <th>AGREGAR</th>
            <th>SUB-PLATILLO</th>
            <th>UNIDAD</th>
            <th>CANTIDAD</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(subPlatillo, index) in subPlatillos
              .filter(
                (s) =>
                  !existingSubPlatilloIds.includes(s.id_subplatillo) &&
                  s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .sort((a, b) => a.nombre.localeCompare(b.nombre))"
            :key="index"
          >
            <td>
              {{ subPlatillo.subPlatillo_id }}
              <input
                :id="subPlatillo.subPlatillo_id"
                type="checkbox"
                v-model="subPlatillo.selected"
              />
            </td>
            <td>{{ subPlatillo.nombre }}</td>
            <td>{{ subPlatillo.unidad }}</td>
            <td>
              <input
                type="number"
                v-model.number="subPlatillo.cantidad"
                min="0"
                step="0.001"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <button class="button" type="submit">AGREGAR SUB-PLATILLO</button>
      <p class="mensaje-error">{{ mensajeError }}</p>
      <p class="mensaje-exitoso">{{ subPlatilloAgregadoExitosamente }}</p>
    </form>
  </div>
</template>

<script>
import API_URL from "../../config";

export default {
  props: ["subPlatillos", "existingSubPlatilloIds"],
  data() {
    return {
      searchTerm: "",
      mensajeError: "",
      subPlatilloAgregadoExitosamente: "",
    };
  },
  methods: {
    async addSubPlatillo() {
      const id_platillo = this.$route.params.id;

      const selectedSubPlatillos = this.subPlatillos.filter(
        (sub) => sub.selected
      );

      for (const subPlatillo of selectedSubPlatillos) {
        const id_subplatillo = subPlatillo.id_subplatillo;
        const cantidad = subPlatillo.cantidad;
        // console.log(id_platillo, id_subplatillo, cantidad)
        // Skip this subPlatillo if cantidad is null or undefined
        if (cantidad == null || cantidad === 0) {
          this.mensajeError = "Cantidad no puede ser 0";
          // Clear the error message after 5 seconds
          setTimeout(() => {
            this.mensajeError = "";
          }, 5000);
          continue;
        }

        try {
          const response = await fetch(
            `${API_URL}/platillos/${id_platillo}/subplatillos`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ id_subplatillo, cantidad }),
            }
          );

          // Check if the request was successful
          if (response.ok) {
            this.subPlatilloAgregadoExitosamente =
              "Sub-Platillo agregado exitosamente";

            // Clear the success message after 5 seconds
            setTimeout(() => {
              this.subPlatilloAgregadoExitosamente = "";
            }, 5000);
          }

          // ...
        } catch (error) {
          console.error("Error:", error);
        }
      }

      // Emit event after successful addition
      this.$emit("subPlatilloAdded");
    },
  },
};
</script>

<style scoped>
.search-input {
  width: 50%;
  margin-bottom: 1rem;
  padding: 1rem;
  font-size: 1rem;
}
.mensaje-error {
  color: red;
}
.mensaje-exitoso {
  color: green;
}
.button {
  width: fit-content;
  margin: 10px 0;
  padding: 1rem;
}
</style>