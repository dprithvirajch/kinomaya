import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { getAIRecommendations } from '../services/gemini';
import { searchTitles } from '../services/tmdb';
import { trackEvent } from '../services/analytics';
import SpotlightCard from '../components/SpotlightCard';
import './Companion.css';

const Companion = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hey! I'm KinoMaya. Tell me what kind of vibe you're looking for tonight. ✨" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedMovies, setSuggestedMovies] = useState([]);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, suggestedMovies]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userPrompt = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userPrompt }]);
    setIsLoading(true);
    setSuggestedMovies([]);
    
    trackEvent('AI Prompt Sent', { prompt_length: userPrompt.length });

    try {
      // 1. Get AI reasoning and suggested titles
      const aiResponse = await getAIRecommendations(userPrompt, user.preferences);
      
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse.message }]);

      // 2. Fetch those exact titles from TMDB
      if (aiResponse.titles && aiResponse.titles.length > 0) {
        const movies = await searchTitles(aiResponse.titles);
        setSuggestedMovies(movies);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Oops, my brain glitched. Could you try asking that again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setInput(promptText);
    // Let the user edit or just submit immediately
  };

  return (
    <div className="companion-container fade-in">
      <header className="companion-header">
        <button className="icon-btn back-btn-comp" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>
        <div className="companion-title">
          <Sparkles size={20} color="var(--color-accent-secondary)" />
          <span>KinoMaya</span>
        </div>
      </header>

      <div className="companion-chat-area">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        
        {isLoading && (
          <div className="chat-bubble ai loading-bubble">
            <Loader2 className="spin" size={20} />
            <span>Thinking...</span>
          </div>
        )}

        {suggestedMovies.length > 0 && (
          <div className="companion-suggestions fade-in">
            {suggestedMovies.map(movie => (
              <SpotlightCard key={movie.id} item={movie} />
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="companion-input-area">
        {messages.length === 1 && (
          <div className="quick-prompts">
            <button className="quick-prompt-btn" onClick={() => handleQuickPrompt("Activate Chaos Mode. Surprise me with a masterpiece.")}>
              🌪️ Chaos Mode
            </button>
            <button className="quick-prompt-btn" onClick={() => handleQuickPrompt("Neon cyberpunk aesthetic with heavy synth-wave.")}>
              🌃 Cyberpunk Vibe
            </button>
            <button className="quick-prompt-btn" onClick={() => handleQuickPrompt("Hidden gems highly praised on Reddit's r/TrueFilm.")}>
              🧠 Reddit Masterpieces
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="companion-form">
          <input 
            type="text" 
            placeholder="e.g. A funny sci-fi movie under 2 hours..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={!input.trim() || isLoading} className="send-btn">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Companion;
