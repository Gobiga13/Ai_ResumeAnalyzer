import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ResumeAnalysis {
  skills: string[];
  experience_years: number;
  education: string[];
  summary: string;
  match_score: number;
  gap_analysis: string[];
  suggestions: string[];
}

export async function analyzeResume(content: string, jobDescription: string): Promise<ResumeAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", // Using a supported flash model
    contents: `Analyze this resume content against the provided job description. 
    
    Resume Content:
    ${content}
    
    Job Description:
    ${jobDescription}
    
    Extract key information and provide a match score (0-100).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          experience_years: { type: Type.NUMBER },
          education: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING },
          match_score: { type: Type.NUMBER },
          gap_analysis: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["skills", "experience_years", "education", "summary", "match_score", "gap_analysis", "suggestions"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function getImprovementChat(resumeContent: string, userMessage: string, history: any[]) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are an expert career coach and resume writer. 
      You have access to the user's resume content: ${resumeContent}.
      Provide actionable, professional advice to improve their resume and career prospects.`,
    },
  });

  const response = await chat.sendMessage({ message: userMessage });
  return response.text;
}
