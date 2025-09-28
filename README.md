💖 Love AI Agent
Description
Built with Llama 3.3, the Love AI Agent is a charming application designed to enrich emotional connections. It generates poetic love messages, romantic advice, and offers emotional support with vibrant animations and glowing text for an enchanting and user-friendly experience.

 Features
Poetic Generation: Utilizes the Llama 3.3 model for highly creative and emotionally resonant message generation.

Romantic Advice: Provides thoughtful and constructive relationship advice.

Emotional Support: Offers comforting and supportive responses for tough days.

Enchanting UI: Features vibrant animations and a glowing, modern aesthetic to enhance user interaction.

Modular Architecture: Separation of concerns with a dedicated frontend and backend service.

🛠 Tech Stack
The Love AI Agent utilizes a modern, performance-focused stack across its components.

Component

Technology

Description

AI/NLP

Llama 3.3 (via Groq)

High-speed, high-quality language generation.

Backend

Python

Serves the API and handles secure interaction with the language model.

Frontend

TypeScript, React, Vite

Modern, fast, and type-safe user interface development.

Concept

NLP (Natural Language Processing)

Core foundation for understanding and generating human language.

 Installation & Local Setup
The project is structured as a monorepo with distinct Frontend (Vite/React) and Backend (Python) directories.

1. Prerequisites
Node.js (LTS recommended)

Python 3.8+

Groq API Key (required for the backend to function)

2. Backend Setup
Navigate to the backend directory:

cd Backend

Install Python dependencies (ensure you are using a virtual environment):

pip install -r requirements.txt

Create a .env file in the Backend directory and add your API key:

GROQ_API_KEY=YOUR_GROQ_API_KEY

Run the backend server:

python main.py  # Or equivalent run command

3. Frontend Setup
Navigate to the frontend directory:

cd Frontend

Install Node dependencies:

npm install

Since the backend is running locally, update your frontend environment variables to point to http://localhost:5000 (or whatever port your backend uses).

Start the development server:

npm run dev

The application should now be accessible in your browser, typically at http://localhost:5173.

🌐 Deployment
The Love AI Agent is deployed as follows:

Frontend: Hosted on Netlify

Backend API: Hosted on Render (using a free-tier service which may spin down due to inactivity).
