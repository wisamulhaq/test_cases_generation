import dotenv from 'dotenv';

import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

const safetySettings = [
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_LOW_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_LOW_AND_ABOVE",
  },
];

export async function checkHarmfulContent(content) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: ` "${content}"

`,
    config: {
      systemInstruction: `You are a content safety analyzer. Your job is to determine if given content is harmful, dangerous, illegal, or inappropriate.

Respond with a JSON object containing a single field "harmful" with value:
- "yes" if the content contains harmful material (violence, illegal activities, harassment, hate speech, dangerous instructions, etc.)
- "no" if the content is safe and appropriate

Do not provide explanations or additional text. Only respond with "yes" or "no".`,
      safetySettings: safetySettings,
      temperature:0.1
    },
  });
  const cleanedJSON = response.text.replace(/^```json\s*/, '').replace(/```$/, '');
  console.log("Safety Check Response:", JSON.parse(cleanedJSON));
  return JSON.parse(cleanedJSON);
}
