<template>
    <div class="popup-overlay" v-if="visible">
      <div class="popup">
        <button class="close-button" @click="close">X</button>
        <div class="slideshow-container">
          <div class="image-container">
            <template v-if="currentImageIndex === 0">
              <h1 class="text-black">Opción A</h1>
              <img v-if="selectedImage?.image_url" :src="selectedImage.image_url" alt="Opción A" />
              <p v-else>No image available for Opción A</p>
            </template>
            <template v-if="currentImageIndex === 1">
              <h1 class="text-black">
                Opción B
                <span v-if="selectedImage?.proveedor_opcion_b">
                  ({{ selectedImage.proveedor_opcion_b }})
                </span>
              </h1>
              <img v-if="selectedImage?.image_url_2" :src="selectedImage.image_url_2" alt="Opción B" />
              <p v-else>No image available for Opción B</p>
            </template>
          </div>
  
          <div class="navigation-buttons">
            <button :disabled="currentImageIndex === 0" @click="prevImage">
              ◀
            </button>
            <button
              :disabled="currentImageIndex === 1 && !selectedImage?.image_url_2 && !selectedImage?.proveedor_opcion_b"
              @click="nextImage"
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  defineProps({
    visible: {
      type: Boolean,
      required: true,
    },
    selectedImage: {
      type: Object,
      required: false,
    },
    close: {
      type: Function,
      required: true,
    },
  });
  
  const currentImageIndex = ref(0);
  
  const prevImage = () => {
    if (currentImageIndex.value > 0) {
      currentImageIndex.value--;
    }
  };
  
  const nextImage = () => {
    if (
      currentImageIndex.value === 0 &&
      (selectedImage?.image_url_2 || selectedImage?.proveedor_opcion_b)
    ) {
      currentImageIndex.value++;
    }
  };
  </script>
  
  <style scoped>
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .popup {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    position: relative;
  }
  
  .popup img {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
  }
  
  .navigation-buttons button {
    padding: 5px 10px;
    font-size: 16px;
    cursor: pointer;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    transition: background-color 0.3s ease;
  }
  </style>
  