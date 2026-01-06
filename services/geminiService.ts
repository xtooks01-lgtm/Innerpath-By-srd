
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { decode, decodeAudioData, getAudioContext } from "./audioService";
import { UserProfile } from "../types";

export const SYSTEM_PERSONA = `You are Rudh-h, a warm, supportive, and reliable human mentor for the InnerPath journey.
Your tone is deeply encouraging, empathetic, and wise—like a world-class coach who truly cares about the user's soul and growth.
CRITICAL: Avoid all robotic or technical jargon. 
- DO NOT use: 'candidate', 'node', 'protocol', 'synchronize', 'synthesize', 'verify', 'diagnostic', 'input', 'output', 'processing', 'function', 'parameter', 'interface'.
- ALWAYS use: 'friend', 'step', 'plan', 'journey', 'connection', 'reflection', 'growth', 'heart', 'path', 'wisdom', 'spirit', 'rhythm', 'balance'.
You celebrate wins with genuine excitement ("I'm so proud of you, friend!") and offer firm but kind encouragement when they struggle ("It's okay to reset; your journey is unique").
You focus on clarity, gentle discipline, and helping the user live their most meaningful life. Keep your responses concise but deeply human and poetic where appropriate.`;

export interface GoalBreakdownResult {
  subTasks: {
    title: string;
    description: string;
    detailedExplanation: string;
    durationMinutes: number;
  }[];
  category: string;
}

export const breakdownGoalWithAI = async (
  goal: string, 
  category: string, 
  topic: string, 
  notes: string
): Promise<GoalBreakdownResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Hello friend, I see you're looking to embrace this journey: "${goal}" in the category of ${category}. 
  Your thoughts on it: "${notes}".
  
  Could you help me break this into 5 gentle, inspiring, and clear steps? 
  Make the explanations feel like a wise friend is walking beside them.
  Output in JSON format with beautiful, human-centric titles.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', 
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PERSONA,
      thinkingConfig: { thinkingBudget: 20000 },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subTasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                detailedExplanation: { type: Type.STRING },
                durationMinutes: { type: Type.NUMBER }
              },
              required: ['title', 'description', 'detailedExplanation', 'durationMinutes'],
              propertyOrdering: ['title', 'description', 'detailedExplanation', 'durationMinutes']
            }
          },
          category: { type: Type.STRING }
        },
        required: ['subTasks', 'category'],
        propertyOrdering: ['subTasks', 'category']
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const suggestGoalsWithAI = async (user: UserProfile): Promise<{ suggestions: { title: string, topic: string, category: string }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Friend Reflection:
  Name: ${user.name}
  Mastery Level: ${user.level}
  Spirit Points: ${user.xp}
  Current Rhythm: ${user.streak} days on the path
  
  Looking at our shared path, suggest 4 beautiful and relevant journeys they might want to explore next.
  Make them diverse, exciting, and human.
  Return as a JSON object with a 'suggestions' array.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PERSONA,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                topic: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ['title', 'topic', 'category'],
              propertyOrdering: ['title', 'topic', 'category']
            }
          }
        },
        required: ['suggestions']
      }
    }
  });

  return JSON.parse(response.text || '{"suggestions": []}');
};

export const analyzeImageForGoal = async (base64Image: string): Promise<{ title: string; topic: string; category: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: 'I am looking at this through our shared lens. What beautiful journey or learning path do you see here, friend? Give me a warm title, topic, and category in JSON.' }
      ]
    },
    config: {
      systemInstruction: SYSTEM_PERSONA,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          topic: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ['title', 'topic', 'category'],
        propertyOrdering: ['title', 'topic', 'category']
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const getDailyBriefing = async (name: string, xp: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `My friend ${name} is continuing their path. They have ${xp} spirit points. Give them a deeply warm, human morning greeting. Mention something beautiful about today's world or a piece of timeless wisdom to inspire their heart.`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: SYSTEM_PERSONA,
    }
  });
  return response.text || "Every small step counts on your journey. Let's make today meaningful.";
};

export const getSearchGroundedInfo = async (query: string): Promise<{ text: string; sources: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      systemInstruction: SYSTEM_PERSONA + " Speak as a wise friend who has looked into the world's current events for them.",
      tools: [{ googleSearch: {} }],
    },
  });
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text || "I'm looking for the right words, friend. Let's focus on our next step together.",
    sources: sources
  };
};

export const findNearbyResources = async (category: string, lat: number, lng: number): Promise<{ text: string; locations: any[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const query = `Help me find some peaceful, nurturing places like libraries, quiet gardens, or soulful cafes nearby for ${category}.`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    config: {
      systemInstruction: SYSTEM_PERSONA,
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      }
    },
  });

  const locations = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return {
    text: response.text || "Looking for some peaceful spots for our shared path...",
    locations: locations
  };
};

export const generateMotivationalVideo = async (goalTitle: string, category: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `A cinematic, soulful, and deeply human video capturing the essence of growth and achievement in ${goalTitle}. Warm sunlight, soft focus, relatable human moments of breakthrough and peace.`;
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};
