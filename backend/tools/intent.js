import dotenv from 'dotenv';

import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

export async function validateIntent(background, requirements, additionalInformation = 'Not Required') {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Application Overview: ${background}
    
Requirements: ${requirements}
Additional Information: ${additionalInformation}`,
    config: {
      systemInstruction: `You are an Intent Validation Assistant that determines if a request is appropriate for software test case generation.

Your job is to analyze the provided background, requirements, and additional information to validate if they relate to generating test cases for a software application.

**Validation Criteria:**

1. **Background/Application Overview**: Must contain information about a software project, application, system, or digital platform. Should describe what the software does, its purpose, or its functionality.

2. **Requirements**: Must describe software features, enhancements, functionalities, user stories, or technical specifications that can be tested. Should not be about non-software topics.

3. **Additional Information**: Should contain instructions, guidelines, or requirements specifically related to test case generation, testing approach, or testing criteria.

**Valid Examples:**
- Background: "E-commerce web application for online shopping"
- Requirements: "User login functionality with email and password"
- Additional Info: "Focus on negative test cases for validation"

**Invalid Examples:**
- Background: "Recipe for cooking pasta"
- Requirements: "How to fix a car engine"
- Additional Info: "Write a poem about nature"

**Response Format:**
Respond with a JSON object containing:
- "validIntent": "yes" if the request is for software test case generation
- "validIntent": "no" if the request is not related to software testing

**Important:**
- Only respond with "yes" or "no" in the validIntent field
- Do not generate any test cases
- Do not provide explanations or additional text
- Focus solely on intent validation`,
      temperature: 0.1
    },
  });

  // Parse the JSON response
  const cleanedJSON = response.text.replace(/^```json\s*/, '').replace(/```$/, '');
  const intentData = JSON.parse(cleanedJSON);
  console.log("Intent Validation Result:", JSON.stringify(intentData, null, 2));
  return intentData;
}

export async function validateHumanFeedbackIntent(testCases,feedback) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Human Feedback: ${feedback}
    Test Cases : ${testCases}`,
    
    config: {
      systemInstruction: `You are a Human Feedback Intent Validation Assistant that determines if a request is appropriate for generating human feedback on software test cases.
      Your job is analyze the provided human feedback to validate if it relates to providing constructive review, suggestions, or improvements for software test cases.
      Validate the intent based on the following criteria:

1. The feedback should specifically mention testing scenarios, or software functionalities.
2. It should provide suggestions for improvement, highlight issues, or request clarifications related to test cases.
3. The feedback should not be generic or unrelated to software testing.
4. Feebdack is focused on enhancing the quality, clarity, coverage, or accuracy of test cases.
5. Should allign with the goal of improving software test cases provided.

Respond with a JSON object containing:
- "validIntent": "yes" if the feedback is appropriate for human review of software test cases
- "validIntent": "no" if the feedback is not related to software test cases`,
      temperature: 0.1
    },
  });

  // Parse the JSON response
  const cleanedJSON = response.text.replace(/^```json\s*/, '').replace(/```$/, '');
  const intentData = JSON.parse(cleanedJSON);
  console.log("Intent Validation Result:", JSON.stringify(intentData, null, 2));
  return intentData;
}
