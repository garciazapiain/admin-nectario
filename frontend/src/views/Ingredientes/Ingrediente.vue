<template>
  <div>
    <h1>{{ ingrediente.nombre }}</h1>
    <h2>
      Info del insumo:
      <BaseButton bgColor="bg-blue-800" textColor="text-white" fontSize="text-base" v-if="isAdmin"
        @click="showModal = true">Editar</BaseButton>
    </h2>
    <div v-if="showModal" class="modal">
      <form @submit.prevent="editIngrediente" class="grid grid-cols-2 gap-4 edit-form">
        <div class="form-group">
          <label for="nombre">Nombre:</label>
          <input id="nombre" v-model="ingredienteEditado.nombre" />
        </div>
        <div class="form-group">
          <label for="proveedor">Proveedor:</label>
          <Dropdown v-model="ingredienteEditado.proveedor" :options="proveedorOptions"
            defaultOption="{ value: '', label: 'Selecciona un proveedor' }" />
        </div>
        <div class="form-group">
          <input v-model="ingredienteEditado.proveedor_opcion_b" placeholder="Proveedor Opción B" class="input-field" />
        </div>
        <div class="form-group">
          <label for="unidad">Unidad:</label>
          <Dropdown v-model="ingredienteEditado.unidad" :options="unidadOptions"
            defaultOption="{ value: '', label: 'Selecciona una unidad' }" />
        </div>
        <div class="form-group">
          <label for="precio">Costo limpio (contando % MERMA):</label>
          <input id="precio" v-model="ingredienteEditado.precio" />
        </div>
        <div class="form-group">
          <label for="merma">% MERMA:</label>
          <input id="merma" type="number" v-model="ingredienteEditado.merma" min="0" max="0.99" step="0.01" />
        </div>
        <div class="form-group">
          <label for="store_route_order">Orden ruta de tienda:</label>
          <input id="store_route_order" type="number" v-model.number="ingredienteEditado.store_route_order" />
        </div>
        <div class="form-group">
          <label for="lista_peligro">Lista peligro</label>
          <Dropdown v-model="ingredienteEditado.producto_clave" :options="listaPeligroOptions"
            defaultOption="{ value: '', label: 'Selecciona una opción' }" />
        </div>
        <div class="form-group">
          <label for="orden_inventario">Orden toma de Inventario:</label>
          <input id="orden_inventario" type="number" step="0.1" :value="ingredienteEditado.orden_inventario"
            @input="updateOrdenInventario($event.target.value)" />
        </div>
        <div class="form-group">
          <label for="moral_demanda_semanal">Moral Demanda Semanal:</label>
          <input id="moral_demanda_semanal" type="number" step="0.01"
            v-model.number="ingredienteEditado.moral_demanda_semanal" />
        </div>
        <div class="form-group">
          <label for="bosques_demanda_semanal">Campestre Demanda Semanal:</label>
          <input id="bosques_demanda_semanal" type="number" step="0.01"
            v-model.number="ingredienteEditado.bosques_demanda_semanal" />
        </div>
        <!-- <div class="form-group">
          <label for="frecuencias_inventario">Frecuencias de Inventario:</label>
          <select id="frecuencias_inventario" v-model="ingredienteEditado.frecuencias_inventario" multiple>
            <option disabled value="">Selecciona una frecuencia</option>
            <option value="1">Inicio primer turno</option>
            <option value="2">Inicio segundo turno</option>
            <option value="3">Fin segundo turno</option>
            <option value="4">No inventarear</option>
          </select>
        </div> -->
        <div class="form-group">
          <label for="image">Actualizar Imagen Opción A:</label>
          <input id="image" type="file" @change="handleFileUpload('image_url', $event)" />
        </div>
        <div class="form-group">
          <label for="image_2">Actualizar Imagen Opción B:</label>
          <input id="image_2" type="file" @change="handleFileUpload('image_url_2', $event)" />
        </div>
        <div v-if="ingredienteEditado.image_url">
          <label>Imagen Opción A:</label>
          <img :src="ingredienteEditado.image_url" alt="Ingrediente Imagen Opcion A" width="200" />
        </div>
        <div v-else>
          <span>No hay imagen disponible para Opción A</span>
        </div>

        <div v-if="ingredienteEditado.image_url_2">
          <label>Imagen Opción B:</label>
          <img :src="ingredienteEditado.image_url_2" alt="Ingrediente Imagen Opcion B" width="200" />
        </div>
        <div v-else>
          <span>No hay imagen disponible para Opción B</span>
        </div>
        <div class="grid grid-cols-2 gap-4 form-actions">
          <BaseButton bgColor="bg-green-800" textColor="text-white" fontSize="text-base" type="submit">Guardar</BaseButton>
          <BaseButton bgColor="bg-red-600" textColor="text-white" fontSize="text-base" @click="showModal = false">Cancelar</BaseButton>
        </div>
      </form>
    </div>
    <table>
      <tbody>
        <tr>
          <td><strong>Proveedor:</strong></td>
          <td>{{ ingrediente.proveedor }}</td>
        </tr>
        <tr>
          <td><strong>Proveedor B (Opciones B):</strong></td>
          <td>{{ ingrediente.proveedor_opcion_b }}</td>
        </tr>
        <tr>
          <td><strong>Unidad:</strong></td>
          <td>{{ ingrediente.unidad }}</td>
        </tr>
        <tr>
          <td><strong>Costo limpio (contando % MERMA):</strong></td>
          <td>${{ ingrediente.precio }}</td>
        </tr>
        <tr>
          <td><strong>% MERMA:</strong></td>
          <td>{{ (ingrediente.merma * 100).toFixed(0) }}%</td>
        </tr>
        <tr>
          <td><strong>Orden ruta de tienda:</strong></td>
          <td>{{ ingrediente.store_route_order }}</td>
        </tr>
        <tr>
          <td><strong>Lista Peligro:</strong></td>
          <td>{{ ingrediente.producto_clave ? "Si" : "No" }}</td>
        </tr>
        <tr>
          <td><strong>Orden toma de Inventario:</strong></td>
          <td>{{ ingrediente.orden_inventario }}</td>
        </tr>
        <tr>
          <td><strong>Moral Demanda Semanal:</strong></td>
          <td>{{ ingrediente.moral_demanda_semanal }} <span v-if="ingrediente.moral_demanda_semanal">{{
            ingrediente.unidad }}</span></td>
        </tr>
        <tr>
          <td><strong>Campestre Demanda Semanal:</strong></td>
          <td>{{ ingrediente.bosques_demanda_semanal }} <span v-if="ingrediente.bosques_demanda_semanal">{{
            ingrediente.unidad }}</span></td>
        </tr>
        <tr>
          <td><strong>Imagen Opción A:</strong></td>
          <td>
            <img v-if="ingrediente.image_url" :src="ingrediente.image_url" alt="Ingrediente Imagen Opcion A"
              width="200" />
            <span v-else>No hay imagen disponible</span>
          </td>
        </tr>
        <tr>
          <td><strong>Imagen Opción B:</strong></td>
          <td>
            <img v-if="ingrediente.image_url_2" :src="ingrediente.image_url_2" alt="Ingrediente Imagen Opcion B"
              width="200" />
            <span v-else>No hay imagen disponible</span>
          </td>
        </tr>
        <!-- <tr>
          <td><strong>Frecuencias de Inventario:</strong></td>
          <td>
            <span v-for="(frecuencia, index) in ingrediente.frecuencias_inventario" :key="index">
              {{ displayFrecuencia(frecuencia) }}
              <span v-if="index < ingrediente.frecuencias_inventario.length - 1">, </span>
            </span>
          </td>
        </tr> -->
      </tbody>
    </table>
    <h2>Platillos/Subplatillos donde se usa el insumo:</h2>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(platillo, index) in ingrediente.platillos" :key="index" @click="handleClick(platillo)">
          <td>{{ platillo.nombre }}</td>
          <td>{{ platillo.type }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import BaseButton from "../../components/BaseButton.vue";
import Dropdown from "../../components/Dropdown.vue";
import API_URL from "../../config";

/* ====== Section A: Core Declarations and State ====== */

// Core Data Management
const router = useRouter();
const ingrediente = ref({});
const ingredienteEditado = ref({});
const proveedores = ref([]);
const unidades = ref([]);
const selectedImage = ref(null);
const selectedImage2 = ref(null);

// Computed Properties
const proveedorOptions = computed(() =>
  proveedores.value.map((proveedor) => ({
    value: proveedor.nombre,
    label: proveedor.nombre,
  }))
);

const unidadOptions = computed(() =>
  unidades.value.map((unidad) => ({
    value: unidad,
    label: unidad,
  }))
);

const listaPeligroOptions = [
  { value: "true", label: "Sí" },
  { value: "false", label: "No" },
];

// View Toggles
const showModal = ref(false);
const isAdmin = ref(localStorage.getItem("isAdmin") === "true");

/* ====== Section B: Functions for Component Logic ====== */

// Initialization and Lifecycle
const fetchData = async () => {
  const id = router.currentRoute.value.params.id;
  try {
    const responseIngrediente = await fetch(`${API_URL}/ingredientes/${id}`);
    if (!responseIngrediente.ok) throw new Error("Error fetching ingrediente");
    const data = await responseIngrediente.json();
    ingrediente.value = data;
    ingredienteEditado.value = { ...data };

    const responseProveedores = await fetch(`${API_URL}/proveedores`);
    if (!responseProveedores.ok) throw new Error("Error fetching proveedores");
    proveedores.value = await responseProveedores.json();

    const responseUnidades = await fetch(`${API_URL}/unidades`);
    if (!responseUnidades.ok) throw new Error("Error fetching unidades");
    unidades.value = await responseUnidades.json();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// State and Reactive Variables
const calculateDemandDays = (weeklyDemand, store) =>
  (weeklyDemand / 7) *
  (store === "moral" ? inputDaysMoral.value : inputDaysBosques.value);

// Utility/Helper Functions
const handleClick = (platillo) => {
  if (platillo.type === "Platillo") {
    window.open(`/platillos/${platillo.id_platillo}`, "_blank");
  } else {
    window.open(`/subplatillos/${platillo.id_platillo}`, "_blank");
  }
};

const updateProveedor = (event) => {
  const selectedProveedor = proveedores.value.find(
    (proveedor) => proveedor.nombre === event.target.value
  );
  if (selectedProveedor) {
    ingredienteEditado.value.proveedor = selectedProveedor.nombre;
    ingredienteEditado.value.proveedor_id = selectedProveedor.id;
  }
};

const updateOrdenInventario = (value) => {
  if (value === "" || value === null) {
    ingredienteEditado.value.orden_inventario = null; // Allow null values
  } else {
    ingredienteEditado.value.orden_inventario = parseFloat(value); // Convert to a number
  }
};

// API Interaction and State Modifiers
const handleFileUpload = async (type, event) => {
  const file = event.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("id_ingrediente", ingredienteEditado.value.id_ingrediente);
    formData.append("image_type", type); // Specify which image is being uploaded

    try {
      const response = await fetch(`${API_URL}/ingredient_image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Image upload failed: ${response.status}`);
      }

      const data = await response.json();
      if (type === "image_url") {
        ingredienteEditado.value.image_url = data.image_url;
      } else if (type === "image_url_2") {
        ingredienteEditado.value.image_url_2 = data.image_url;
      }
    } catch (error) {
      console.error("Error during image upload:", error);
    }
  } else {
    console.warn("No file selected.");
  }
};

const editIngrediente = async () => {
  const id = router.currentRoute.value.params.id;

  // Destructure the edited data
  const {
    nombre,
    unidad,
    precio,
    proveedor,
    proveedor_opcion_b,
    proveedor_id,
    merma,
    store_route_order,
    orden_inventario,
    moral_demanda_semanal,
    bosques_demanda_semanal
  } = ingredienteEditado.value;

  let imageUrl = ingredienteEditado.value.image_url; // Default to existing image_url
  let imageUrl2 = ingredienteEditado.value.image_url_2; // Default to existing image_url_2

  // Upload first image if selected
  if (selectedImage.value) {
    const formData = new FormData();
    formData.append("image", selectedImage.value);
    formData.append("id_ingrediente", id);

    const imageResponse = await fetch(`${API_URL}/ingredient_image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!imageResponse.ok) {
      throw new Error(`Image upload failed: ${imageResponse.status}`);
    }

    const imageResult = await imageResponse.json();
    imageUrl = imageResult.image_url; // Get new uploaded image URL
  }

  // Upload second image if selected
  if (selectedImage2.value) {
    const formData = new FormData();
    formData.append("image", selectedImage2.value);
    formData.append("id_ingrediente", id);

    const imageResponse2 = await fetch(`${API_URL}/ingredient_image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!imageResponse2.ok) {
      throw new Error(`Second image upload failed: ${imageResponse2.status}`);
    }

    const imageResult2 = await imageResponse2.json();
    imageUrl2 = imageResult2.image_url; // Get new uploaded second image URL
  }

  // Prepare updated data object
  const updatedData = {
    nombre,
    unidad,
    precio,
    proveedor,
    proveedor_opcion_b,
    proveedor_id,
    merma,
    store_route_order,
    orden_inventario,
    image_url: imageUrl,
    image_url_2: imageUrl2,
    moral_demanda_semanal,
    bosques_demanda_semanal
  };

  try {
    // Send PUT request to update data
    const response = await fetch(`${API_URL}/ingredientes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error(`Error updating ingrediente: ${response.status}`);
    }

    const updatedIngrediente = await response.json();
    console.log("Updated ingrediente:", updatedIngrediente);

    // Close modal and refresh state
    showModal.value = false;
    ingrediente.value = updatedIngrediente;
  } catch (error) {
    console.error("Error updating ingrediente:", error);
  }
};

// Popup/Dropdown and Interaction Logic
fetchData();
</script>

<style scoped>
.form-group {
  @apply flex flex-col;
}
</style>