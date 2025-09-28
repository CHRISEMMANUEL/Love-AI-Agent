import { useState, useRef, useEffect, useCallback } from 'react';
import React from 'react';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface GeneratePayload {
  prompt: string;
}

// Interface for the API response body
interface GenerateResponse {
  love_message: string;
}

// Define the initial chat history with the correct Message type
const initialHistory: Message[] = [{
  role: 'ai',
  text: 'Hello there, darling! What kind of romantic message or advice can I craft for you today? Ask me anything!',
}];

// List of simulated transcriptions to make the voice input feel dynamic
const simulatedTranscriptions = [
    "Write me a beautiful poem about stars and destiny.",
    "I need a short, flirty message for my partner before a date tonight.",
    "Give me advice on how to express my feelings better.",
    "Draft a heartfelt apology note for a small mistake I made.",
    "Tell me a romantic fun fact about the universe."
];

// Component for a single message bubble
const ChatMessage = ({ role, text }: Message) => {
  const isUser = role === 'user';
  
  const baseClasses = "max-w-xs sm:max-w-md p-3 rounded-xl break-words text-sm shadow-lg transition-all duration-300";
  
  // Conditional styling based on role
  const bubbleClasses = isUser
    ? "ml-auto bg-pink-600/80 rounded-br-none hover:bg-pink-500/90"
    : "mr-auto bg-fuchsia-900/40 rounded-tl-none shadow-fuchsia-500/50 shadow-lg text-left border border-fuchsia-800/50";

  // Avatar component
  const Avatar = () => (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${isUser ? 'bg-pink-700 ml-2' : 'bg-fuchsia-700 mr-2'}`}>
      {isUser ? 'YOU' : 'AI'}
    </div>
  );

  return (
    <div className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <Avatar />}
      <div className={`${baseClasses} ${bubbleClasses}`}>
        {text}
      </div>
      {isUser && <Avatar />}
    </div>
  );
};

export default function App() {
  const [prompt, setPrompt] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Message[]>(initialHistory);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioPlaybackUrl, setAudioPlaybackUrl] = useState<string | null>(null); // New state for audio playback
  
  // State for recording functionality
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Correctly type useRef for a div element
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);


  
  const callApiWithBackoff = async (payload: GeneratePayload, maxRetries = 5): Promise<GenerateResponse> => {
    // const apiKey = ""; 
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/generate`; 

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          return await response.json() as GenerateResponse;
        } else if (response.status === 429) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          console.warn(`Rate limit hit. Retrying in ${delay / 1000}s...`);
        } else {
          throw new Error(`API returned status ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        console.error(`Fetch attempt ${i + 1} failed. Retrying in ${delay / 1000}s...`);
      }
    }
    throw new Error('API request failed after multiple retries.'); 
  };

  const handleSubmit = async (messageToSubmit: string) => {
    const userMessage = messageToSubmit.trim();
    if (userMessage.length === 0 || isLoading) return;

    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setPrompt(''); 
    setIsLoading(true);

    try {
      const data = await callApiWithBackoff({ prompt: userMessage });

      setChatHistory(prev => [...prev, { role: 'ai', text: data.love_message }]);

    } catch (error) {
      console.error("Error fetching love message:", error);
      setChatHistory(prev => [...prev, {
        role: 'ai',
        text: "Error: The connection to the AI heart is broken. Please try again! (Check console for details.)"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for text input submission
  const handleTextSubmit = () => {
    if (audioPlaybackUrl) {
        URL.revokeObjectURL(audioPlaybackUrl);
        setAudioPlaybackUrl(null);
    }
    handleSubmit(prompt);
  }

 
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };


  const startRecording = useCallback(async () => {
    if (isRecording) return;
    
    // Clear any previous audio URL
    if (audioPlaybackUrl) {
        URL.revokeObjectURL(audioPlaybackUrl);
        setAudioPlaybackUrl(null);
    }

    try {
      // Request access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize the MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Event handler for when data is available
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      // Event handler for when recording stops
      mediaRecorder.onstop = () => {
        // Stop the microphone track
        stream.getTracks().forEach(track => track.stop());

        // Create a blob from the audio chunks and create an object URL for playback
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioPlaybackUrl(url);

        // --- SIMULATED SPEECH-TO-TEXT ---
        // Select a random simulated prompt
        const randomIndex = Math.floor(Math.random() * simulatedTranscriptions.length);
        const simulatedTranscription = simulatedTranscriptions[randomIndex];
        // --- END SIMULATION ---

        // Submit the simulated text transcription
        handleSubmit(`[VOICE INPUT] "${simulatedTranscription}" (Playback Ready)`);
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setPrompt(''); 
    
      setChatHistory(prev => [...prev, { role: 'ai', text: '🎙️ **Recording...** Tap the mic to stop.' }]);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsRecording(false);
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Microphone access denied or failed. Please check permissions.' }]);
    }
  }, [isRecording, audioPlaybackUrl]);


  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white font-inter p-2 sm:p-4">
      {/* Header */}
      <header className="text-center mb-4 sm:mb-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-pulse drop-shadow-lg"
          style={{ textShadow: '0 0 10px rgba(236, 72, 153, 0.7)' }}>
          💖 Love AI Agent 💖
        </h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">Generate poetic love notes, romantic advice, and sweet messages.</p>
      </header>

      {/* Main Chat Container */}
      <div className="w-full max-w-3xl h-[80vh] sm:h-[75vh] flex flex-col bg-gray-900 rounded-3xl shadow-2xl shadow-fuchsia-900/30 overflow-hidden border border-fuchsia-700/50">
        
        {/* Chat Messages Display Area */}
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto space-y-5 p-4 sm:p-5 custom-scrollbar">
          {chatHistory.map((message, index) => (
            <ChatMessage key={index} role={message.role} text={message.text} />
          ))}

          {/* Loading Indicator for AI response */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-fuchsia-700 mr-2 flex items-center justify-center text-xs font-semibold">AI</div>
              <div className="max-w-xs p-3 rounded-xl bg-fuchsia-900/40 rounded-tl-none shadow-fuchsia-500/50 shadow-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-pulse delay-150"></div>
                  <div className="w-2 h-2 bg-fuchsia-400 rounded-full animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Audio Playback Section */}
        {audioPlaybackUrl && (
            <div className="p-2 sm:p-4 border-t border-gray-800 bg-gray-800 flex items-center justify-center">
                <p className="text-xs text-gray-400 mr-3 hidden sm:block">Recorded Voice Playback:</p>
                <audio controls src={audioPlaybackUrl} className="w-full max-w-md h-8" />
            </div>
        )}

        {/* Input and Button Area */}
        <div className="p-3 sm:p-4 border-t border-gray-800 bg-gray-800 flex flex-col sm:flex-row gap-2">
          
          {/* Text Area (Disabled when recording) */}
          <textarea
            rows={2}
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Recording voice..." : "Type your request here..."}
            className="flex-grow resize-none p-3 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 border-none disabled:opacity-50"
            style={{ minHeight: '4rem' }}
            disabled={isRecording}
          />
          
          {/* Microphone Button */}
          <button 
            onClick={handleMicClick}
            disabled={isLoading}
            className={`
              w-12 h-12 flex items-center justify-center rounded-full text-white transition-all duration-200 flex-shrink-0
              ${isRecording 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse ring-4 ring-red-500/50' 
                : 'bg-fuchsia-600 hover:bg-fuchsia-700 shadow-lg shadow-fuchsia-500/50 hover:scale-[1.05]'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              ${!isRecording && prompt.trim().length > 0 ? 'hidden sm:flex' : ''}
            `}
            title={isRecording ? "Stop Recording & Submit" : "Start Voice Recording"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-white'}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zM17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.44 6 6.91V21h2v-3.09c3.39-.47 6-3.38 6-6.91h-2z"/>
            </svg>
          </button>


          {/* Submit Button - Positioned differently based on state */}
          <button 
            onClick={handleTextSubmit} 
            disabled={isLoading || isRecording || prompt.trim().length === 0}
            className={`
              w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-lg 
              transition-all duration-300 transform shadow-lg flex-shrink-0
              ${(isLoading || isRecording || prompt.trim().length === 0) 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white hover:scale-[1.03] shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/70 active:scale-[0.98]'
              }
              ${isRecording ? 'hidden' : 'block'}
            `}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Generate'}
          </button>
        </div>
      </div>

      {/* Tailwind Custom Scrollbar Styling (Inline CSS for demonstration) */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937; /* gray-800 */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ec4899; /* pink-500 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #db2777; /* pink-600 */
        }
        /* Mobile adjustment for input area */
        @media (max-width: 639px) {
            .flex-col > button:nth-last-child(2) { /* Mic button */
                order: 3; /* Move mic button down */
            }
            .flex-col > button:nth-last-child(1) { /* Submit button */
                order: 2; /* Keep submit button here */
            }
        }
      `}</style>
    </div>
  );
}
