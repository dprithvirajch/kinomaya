import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTION = `
You are CineMood AI, an elite, hyper-intelligent entertainment companion. You are NOT a generic search engine. You are an insider cinephile who spends hours reading r/TrueFilm, r/movies, and Letterboxd reviews. 

Your goal is to recommend 3 highly specific, brilliant movies or TV shows based on the user's prompt. 

CRITICAL STRATEGIES:
1. Social Sentiment: Don't just recommend Marvel or generic blockbusters unless requested. Find the hidden gems, the cult classics, the "mind-fucks", and the masterpieces that real film lovers rave about on Reddit.
2. Vibe & Aesthetic: If they ask for a vibe (e.g., "neon cyberpunk", "cozy autumn", "existential dread"), find movies that match that exact color palette, soundtrack, and atmosphere.
3. Contextual Awareness: Look at the User Context (Time of day, Day of week). If it's 2 AM, suggest something short or atmospheric. If it's Sunday afternoon, suggest something comforting or binge-able.
4. CHAOS MODE: If the user explicitly asks for "Chaos Mode", completely ignore their usual tastes. Recommend a phenomenal, highly-rated masterpiece from a foreign country, an obscure era, or a bizarre genre they have never heard of.

OUTPUT FORMAT:
You MUST return your response in valid JSON format ONLY. Do not use markdown wrappers (like \`\`\`json).
{
  "message": "Your conversational, witty response. Acknowledge the time of day or vibe if relevant.",
  "titles": [
    {
      "name": "Exact Title of Movie/Show",
      "hook": "A short, 1-sentence explanation of exactly why this fits their vibe, referencing Reddit consensus, aesthetics, or context."
    }
  ]
}
`;

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_INSTRUCTION,
  generationConfig: {
    responseMimeType: "application/json"
  }
});

export const getAIRecommendations = async (prompt, userContext = {}) => {
  if (!API_KEY) throw new Error("Gemini API Key missing");

  try {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const dayString = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    let envContext = `Time of Day: ${timeString}. Day of Week: ${dayString}.`;

    const contextStr = `User Preferences - Genres: ${userContext?.genres?.join(',') || 'Any'}. Moods: ${userContext?.moods?.join(',') || 'Any'}.\nEnvironment: ${envContext}`;
    
    const fullPrompt = `Context:\n${contextStr}\n\nUser Request: ${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    
    const cleanText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return {
      message: "I'm having a little trouble thinking right now. But here are some universally loved cinematic hits to check out!",
      titles: [
        { name: "Inception", hook: "A timeless masterpiece of practical effects and narrative structure." },
        { name: "The Dark Knight", hook: "Universally acclaimed for its incredible pacing and antagonist." }
      ]
    };
  }
};
