export function useFormValidation() {
    const validateForm = (fields) => {
      for (const [key, value] of Object.entries(fields)) {
        if (!value) {
          return `${key} is required`;
        }
      }
      return null;
    };
  
    return { validateForm };
  }
  