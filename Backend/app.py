import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware 
from groq import Groq
from pydantic import BaseModel

# Create a FastAPI instance
app = FastAPI()


origins = [
    "http://localhost:3000",
    "https://*.netlify.app",
    "https://love-ai-bot.netlify.app",
    "https://love-ai-agent.onrender.com", 
]
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- END CORS Configuration ---

# Get the Groq API key from environment variables
groq_api_key = os.getenv("GROQ_API_KEY")

# Check if the key is available
if not groq_api_key:
    # This will prevent the app from starting if the key isn't set, which is good
    raise ValueError("GROQ_API_KEY environment variable not set.")

# Initialize the Groq client
client = Groq(api_key=groq_api_key)

# Define a Pydantic model for the incoming request data
class MessageRequest(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Love AI Agent API"}

@app.post("/api/generate")
def generate_love_message(request: MessageRequest):
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": request.prompt,
                }
            ],
            model="llama-3.1-8b-instant",
        )
        generated_message = chat_completion.choices[0].message.content
        return {"love_message": generated_message}
    except Exception as e:
        
        raise HTTPException(status_code=500, detail=str(e))
