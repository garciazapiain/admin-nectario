import { ref } from "vue";

export default function useImageNavigation() {
  const currentImageIndex = ref(0); // Tracks the current image index

  // Navigate to the next image
  const nextImage = (hasNext) => {
    if (hasNext) {
      currentImageIndex.value += 1;
    }
  };

  // Navigate to the previous image
  const prevImage = (hasPrev) => {
    if (hasPrev) {
      currentImageIndex.value -= 1;
    }
  };

  // Reset the image index (e.g., when opening a new popup)
  const resetImageIndex = () => {
    currentImageIndex.value = 0;
  };

  return {
    currentImageIndex,
    nextImage,
    prevImage,
    resetImageIndex,
  };
}
