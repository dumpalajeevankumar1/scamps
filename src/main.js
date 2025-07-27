// JavaScript entry point for the frontend logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize application logic here
    console.log('Application is running');

    // Example function to fetch data from the backend
    async function fetchData() {
        try {
            const response = await fetch('/api/data'); // Adjust the endpoint as needed
            const data = await response.json();
            console.log(data);
            // Process and display data in the UI
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // Call fetchData on load
    fetchData();
});