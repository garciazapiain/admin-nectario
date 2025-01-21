export default function usePageNavigation() {
    const goDownPage = () => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    };
  
    return { goDownPage };
  }
  