import dotenv from 'dotenv';

import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

export async function languageCheck(text) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Please analyze the following text for language quality: ${text}`,
    config: {
      systemInstruction: `You are a language checker assistant. Your task is to evaluate that the provided text is in English or not.
      Respond with a JSON object containing a single field "isEnglish" with value:
      - "yes" if the text is in English
      - "no" if the text is not in English`,
      temperature: 0.2
    },
  });
  const cleanedJSON = response.text.replace(/^```json\s*/, '').replace(/```$/, '');
  const language = JSON.parse(cleanedJSON);
  console.log("Intent Validation Result:", JSON.stringify(language, null, 2));
  return language;
}