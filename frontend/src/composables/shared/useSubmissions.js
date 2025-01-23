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

  const lastSubmission = (store, submission) => {
    // Check if the expected structure exists and is an array
    if (!submission?._object?.data || !Array.isArray(submission._object.data)) {
      return null;
    }

    // Access the data array from the nested object
    const submissionsArray = submission._object.data;

    // Filter submissions by the specified store
    const storeSubmissions = submissionsArray.filter(sub => sub.store === store);

    // Check if any submissions match the store
    if (storeSubmissions.length === 0) {
      console.warn(`No submissions found for store: ${store}`);
      return null;
    }

    // Find the latest submission by timestamp
    const latestSubmission = storeSubmissions.reduce((latest, current) =>
      new Date(latest.timestamp) > new Date(current.timestamp) ? latest : current
    );

    console.log(`Latest submission for store '${store}':`, latestSubmission);
    return latestSubmission;
  };

  return { submissions, fetchSubmissions, lastSubmission };
}

