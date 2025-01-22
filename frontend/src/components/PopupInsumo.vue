<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div class="bg-white text-black p-6 rounded-lg shadow-lg w-full max-w-lg mx-4">
      <h2 class="text-black">Pronóstico demanda - {{ ingrediente.nombre }}</h2>
      <div class="mb-6">
        <h3 class="text-black text-lg mb-2">Numero de dias:</h3>
        <div class="flex items-center justify-center gap-4">
          <button @click="decrementDays" class="w-12 h-12 text-2xl border border-gray-300 rounded bg-white text-black">
            -
          </button>
          <input type="number" min="1" v-model.number="days"
            class="w-16 h-12 text-2xl text-center border border-gray-300 rounded" />
          <button @click="incrementDays" class="w-12 h-12 text-2xl border border-gray-300 rounded bg-white text-black">
            +
          </button>
        </div>
      </div>
      <div class="mb-6">
        <p class="text-lg font-medium text-black">
          Moral: <span class="font-bold text-black">{{ moralDemanda.toFixed(1) }} {{ ingrediente.unidad }}</span>
        </p>
        <p class="text-lg font-medium text-black">
          Campestre: <span class="font-bold text-black">{{ bosquesDemanda.toFixed(1) }} {{ ingrediente.unidad }}</span>
        </p>
      </div>
      <button @click="closePopup" class="w-full bg-gray-800 text-white py-3 rounded-lg mt-4 hover:bg-gray-900">
        Cerrar
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    ingrediente: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      days: 1,
    };
  },
  computed: {
    moralDemanda() {
      return (this.ingrediente.moral_demanda_semanal * this.days) / 7;
    },
    bosquesDemanda() {
      return (this.ingrediente.bosques_demanda_semanal * this.days) / 7;
    },
  },
  methods: {
    closePopup() {
      this.$emit("close");
    },
    incrementDays() {
      this.days++;
    },
    decrementDays() {
      if (this.days > 1) {
        this.days--;
      }
    },
  },
};
</script>