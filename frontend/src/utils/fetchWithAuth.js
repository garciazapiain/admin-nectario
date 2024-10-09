export async function fetchWithAuth(url, options = {}, returnJson = true) {
    const token = localStorage.getItem('jwt'); // Get the token from localStorage
  
    if (!token) {
      console.error("Token is missing, please log in again.");
      throw new Error("Token is missing, please log in again.");
    }
  
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,  // Merge with any headers passed in options
    };
  
    const response = await fetch(url, {
      ...options,
      headers,  // Set the merged headers
    });
  
    // Check if the response is OK (status in range 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    // Conditionally return parsed JSON or full response
    if (returnJson) {
      return response.json(); // Return the parsed JSON
    } else {
      return response; // Return the raw response object
    }
  }
  