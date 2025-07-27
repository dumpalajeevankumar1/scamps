# GOI App

## Overview
GOI App is a web application that integrates various APIs to fetch and display content from YouTube and news sources, while also utilizing Gemini AI for data processing. The application is structured to separate backend logic from frontend presentation, ensuring a clean and maintainable codebase.

## Project Structure
The project is organized into the following directories and files:

```
goi-app/
├── functions/                  # Backend Cloud Functions
│   ├── index.js                # Main entry point for Cloud Functions
│   ├── fetchYouTubeFeeds.js    # Logic for fetching YouTube video feeds
│   ├── fetchNewsFeeds.js       # Logic for fetching news feeds
│   ├── geminiProcessor.js      # Data processing using Gemini AI
│   ├── scheduler.js            # Cloud Scheduler tasks setup
│   ├── serviceAccountKey.json  # Service account key for Google Cloud
│   ├── .env                    # Environment variables for backend
│   └── package.json            # Dependencies for Cloud Functions
│
├── public/                     # Public assets
│   ├── favicon.ico             # Favicon for the application
│   └── images/                 # Directory for images
│
├── src/                        # Frontend source files
│   ├── index.html              # Main HTML document
│   ├── main.js                 # JavaScript entry point for frontend
│   ├── style.css               # CSS styles for the application
│   └── components/             # Reusable UI components
│
├── .env                        # Environment variables for frontend
├── .firebaserc                 # Firebase project binding
├── firebase.json               # Firebase configuration
├── vite.config.js              # Vite configuration
├── package.json                # Frontend dependencies
└── README.md                   # Project documentation
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd goi-app
   ```

2. **Install Dependencies**
   - For the backend:
     ```bash
     cd functions
     npm install
     ```
   - For the frontend:
     ```bash
     cd ..
     npm install
     ```

3. **Environment Variables**
   - Create a `.env` file in the `functions` directory and add your backend API keys.
   - Create a `.env` file in the root directory for frontend VITE_ variables.

4. **Deploying Cloud Functions**
   - Make sure you have the Firebase CLI installed and authenticated.
   - Deploy the functions:
     ```bash
     firebase deploy --only functions
     ```

5. **Running the Frontend**
   - Start the Vite development server:
     ```bash
     npm run dev
     ```

## Usage
Once the application is set up and running, you can access it through your browser. The application will fetch video feeds from YouTube and news articles, displaying them in a user-friendly interface.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.