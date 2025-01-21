import { ref } from "vue";
import API_URL from "../../config";

export default function useSubmissions() {
  const submissions = ref([]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`${API_URL}/submissions/latest-submissions`);
      if (response.ok) {
        submissions.value = await response.json();
      } else {
        console.error("Error fetching submissions:", response.status);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const lastSubmission = (store) => {
    const storeSubmissions = submissions.value.filter(
      (submission) => submission.store === store
    );

    if (storeSubmissions.length > 0) {
      return storeSubmissions.reduce((latest, current) =>
        new Date(latest.timestamp) > new Date(current.timestamp)
          ? latest
          : current
      );
    }
    return null;
  };

  return { submissions, fetchSubmissions, lastSubmission };
}
