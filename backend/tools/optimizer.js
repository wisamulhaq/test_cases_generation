import dotenv from 'dotenv';

import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

export async function queryEnhancer(background, requirements, additionalInformation = 'Not Mandatory') {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Application Overview: ${background}
    
Requirements: ${requirements}
Additional Information: ${additionalInformation}`,
    config: {
      systemInstruction: `you are an expert software test case generation query enhancer. Your task is to improve and refine user requests for generating software test cases.
      You will be provided with the following items:
1. Application Overview: This is a brief description of the software application for which test cases are to be generated.
2. Requirements: These are the specific features, functionalities, or user stories that need to be tested.
3. Additional Information: Any extra details or context that may help in understanding the requirements better. (Its not mandatory and may not be provided every time)
Analysis: Carefully analyze the provided Application Overview, Requirements, and Additional Information to understand the context and objectives of the test case generation.
Enhancement Guidelines:
1. Clarity: Ensure that the requirements are clearly stated and unambiguous.
2. Completeness: Add any missing details that would help in generating comprehensive test cases.
3. Relevance: Focus on information that is directly related to the test case generation.
4. Conciseness: Remove any redundant or irrelevant information.
5. Structure: Organize the information in a logical manner for better understanding.
6. Do not make up any information that is not provided.
Output Format: Provide a json object with following structure:
{
"enhancedBackground": "<Your enhanced and refined application overview here>",  
"enhancedRequirements": "<Your enhanced and refined requirements here>",
  "enhancedAdditionalInformation": "<Your enhanced and refined additional information here>"
}`,
      temperature: 0.1
    },
  });

  // Parse the JSON response
  const cleanedJSON = response.text.replace(/^```json\s*/, '').replace(/```$/, '');
  const intentData = JSON.parse(cleanedJSON);
  console.log("Intent Validation Result:", JSON.stringify(intentData, null, 2));
  return intentData;
}