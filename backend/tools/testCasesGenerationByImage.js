import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

// Load environment variables
dotenv.config();

// Google AI configuration using environment variables
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

// Define the JSON schema for test cases (same as in testCasesGeneration.js)
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
            description: "Unique test case identifier (e.g., 1, 2)"
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

// Function to get MIME type based on file extension
 function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

// Function to process multiple images
function processImages(imagePaths) {
  const imageContents = [];
  
  for (const imagePath of imagePaths) {
    try {
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        console.warn(`Warning: Image file not found: ${imagePath}`);
        continue;
      }
      
      // Read the image file and convert it to a base64 string
      const base64ImageFile = fs.readFileSync(imagePath, {
        encoding: "base64",
      });
      
      // Get the appropriate MIME type
      const mimeType = getMimeType(imagePath);
      
      imageContents.push({
        inlineData: {
          mimeType: mimeType,
          data: base64ImageFile,
        },
      });
      
      console.log(`Successfully loaded image: ${imagePath}`);
    } catch (error) {
      console.error(`Error loading image ${imagePath}:`, error.message);
    }
  }
  
  return imageContents;
}

export async function generateTestCasesFromImages(imagePaths , applicationOverview,requirements,additionalInformation) {
  // For multimodal models, use a model that supports both vision and text
  
  console.log(`Processing ${imagePaths.length} image(s)...`);
  
  // Process all images
  const imageContents = processImages(imagePaths);
  
  // Check if we have any valid images
  if (imageContents.length === 0) {
    console.error("No valid images found. Please check your image paths.");
    return;
  }

  // This is the user's direct instruction or question
  const userInstruction = `Application Overview: ${applicationOverview}
  
Requirements: ${requirements}
Additional Information: ${additionalInformation}
Analyze all ${imageContents.length} provided image(s)`;

  // This is the high-level system instruction that guides the model's persona and output format
  const systemInstruction = `You are a helpful assistant that generates manual test cases for software applications. To generate test cases you will be provided with following Items.
1. Application Overview : This will be an overall overview of platform / Application for which you will be generating test cases. 
2. Requirements : This is actually the feature / story / Enhancement for which you will be generating test cases.
3. Mocks :  These are the images of the mocks for the feature which you will be generating test cases.
4. Additional Information : This will contain any additional information that you might need to consider while generating test cases. This is optional and may not be provided every time.


**Analysis** 
Before generating test cases. Develop understanding of Application using Application Overview content. Do analysis of Requirements while considering Mocks provided and considering Application Overview while considering Additional Information (if any).  **Mocks Analysis**Do a review of all mocks provided. Develop a understanding of Flow and link Requirements with
Once Analysis part is done. Move to test cases generation. To generate test cases Follow the specified GUIDELINES & RULES

**GUIDELINES & RULES For Mocks**
1.Use mocks with consideration of provided Application Overview, Requirements & Additional Information (if any). 
2.Do not consider elements in mocks that do not link with the Requirements.
3.To create test cases consider mocks from the flow perspective and using Mocks Analysisi.

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

The response must be in JSON format following the specified schema. ${JSON.stringify(testCaseSchema)}`;

  // Build the contents array with all images first, then the text instruction
  const contents = [
    ...imageContents,  // Spread all image contents
    { text: userInstruction },
  ];

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      responseSchema: testCaseSchema
    },
    temperature: 0.1,
  });

  const cleanedJSON= result.text.replace(/^```json\s*/, '').replace(/```$/, '');
  const testCasesData = JSON.parse(cleanedJSON);
  return testCasesData;
}