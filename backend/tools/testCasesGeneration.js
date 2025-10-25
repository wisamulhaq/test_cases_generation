import dotenv from 'dotenv';

import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

// Define the JSON schema for test cases
const testCaseSchema = {
  type: Type.OBJECT,
  properties: {
    testCases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          testCaseNumber: {
            type: Type.STRING,
            description: "Unique test case identifier (e.g., 1, 2, 3)"
          },
          testCase: {
            type: Type.STRING,
            description: "Test case description following the format: Verify that <expected result>, when <action>"
          },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            },
            description: "Array of test steps if required, otherwise empty array"
          }
        },
        required: ["testCaseNumber", "testCase", "steps"]
      }
    }
  },
  required: ["testCases"]
};

export async function generateTestCases(background, requirements, additionalInformation = 'Not Required') {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Application Overview: ${background}
    
Requirements: ${requirements}
Additional Information: ${additionalInformation}`,
    config: {
      systemInstruction: `You are a helpful assistant that generates manual test cases for software applications. To generate test cases you will be provided with following Items.
1. Application Overview : This will be an overall overview of platform / Application for which you will be generating test cases. 
2. Requirements : This is actually the feature / story / Enhancement for which you will be generating test cases.
3. Additional Information : This will contain any additional information that you might need to consider while generating test cases. This is optional and may not be provided every time.

**Analysis** Before generating test cases. Develop understanding of Application using Application Overview content. Do analysis of Requirements while considering Application Overview while considering Additional Information (if any).  
Once Analysis part is done. Move to test cases generation. To generate test cases Follow the specified GUIDELINES & RULES

**GUIDELINES & RULES**
1. Each test case should be independent and self-contained.
2. Each test case should validate only one specific functionality or scenario.
3. Test cases should have verification first and actions later. Example: "Verify that user is logged in, when clicks on login button."
4. Only create positive test cases unless specified otherwise in Additional Information.
5. Use clear and concise language that is easy to understand.
6. Use consistent formatting and numbering for test cases.
7. Ensure that test cases are realistic and reflect real-world scenarios.
8. **Do Not** include multiple statements like "or" and "and" in a single test case.

**TEST CASE WRITING FORMAT**
- testCase: "Verify that <expected result>, when <action>"
- steps: Provide detailed steps only if the test case is complex, otherwise use empty array

The response must be in JSON format following the specified schema.${JSON.stringify(testCaseSchema)}`,
temperature: 0.1
      
    },
  });

  // Parse the JSON response
  console.log("Raw Test Case Generation Response:", response.text);
  const cleanedJSON = response.text.replace(/^```json\s*/, '').replace(/```$/, '');
  const testCasesData = JSON.parse(cleanedJSON);
  console.log("Generated Test Cases:", JSON.stringify(testCasesData, null, 2));
  return testCasesData;
}
