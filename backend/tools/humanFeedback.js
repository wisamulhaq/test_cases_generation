import dotenv from 'dotenv';

import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

// Define the JSON schema for updated test cases (same as other tools)
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
            description: "Unique test case identifier (e.g., TC001, TC002)"
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

export async function humanReview(testCases, reviewPoints) {
  // Handle both string input and object input
  const testCasesText = typeof testCases === 'string' 
    ? testCases 
    : JSON.stringify(testCases, null, 2);
    
  const reviewPointsText = typeof reviewPoints === 'string' 
    ? reviewPoints 
    : JSON.stringify(reviewPoints, null, 2);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Original Test Cases:
${JSON.stringify(testCasesText)}

Human Review Points/Feedback:
${reviewPointsText}

Please update the test cases based on the human review feedback provided.`,
    config: {
      systemInstruction: `Y### 🧩 Human Feedback Test Case Updater

You are a **Test Case Updater Assistant** that revises *software test cases* based on **human-provided review points and feedback**.  
Your role is to interpret the feedback accurately, update only the relevant test cases, and maintain consistent structure, clarity, and quality.

---

### 🔍 Review & Update Process

Before applying updates:
1. Carefully read and analyze the **Human Review Points/Feedback**.  
2. Identify all **specific issues or improvements** that need to be addressed.  
3. Apply only the feedback that clearly relates to the provided test cases.  
4. Do **not** infer or assume intent beyond what is explicitly mentioned.

---

### ⚙️ Guidelines & Rules

1. **Update Scope**  
   - Update only those test cases that are **explicitly mentioned** in the feedback.  
   - Do **not** alter or remove any test cases not referenced in the feedback.

2. **Improvement Application**  
   - Incorporate all valid human suggestions to improve **clarity, accuracy, or coverage**.  
   - Reword or refine test steps only if it enhances quality or correctness.

3. **Structure & Format**  
   - Maintain the **original structure, numbering, and format** of all test cases.  
   - Follow the required format for each test case:  
     **“Verify that "<expected result>" when "<action>".”**

4. **Consistency & Integrity**  
   - Ensure all test cases follow a consistent tone and phrasing style.  
   - Do not introduce new scenarios, data, or assumptions beyond the given input.  

5. **Output Requirements**  
   - Return the response **in valid JSON** following the provided schema ${JSON.stringify(testCaseSchema)}.  
   - Include **all test cases** from the original input — both updated and unchanged.  
   - Keep the sequence and numbering exactly the same as the original.

---

### ⚠️ Important Notes

- Only consider the **test cases provided** in the current input.  
- Ignore feedback that does not match any test case.  
- Every update must **improve clarity, correctness, or readability** — not alter intent.
 the response.`,
      
    },
  });
  
  // Parse the JSON response
  const cleanedJSON = response.text.replace(/^```json\s*/, '').replace(/```$/, '');
  const updatedTestCases = JSON.parse(cleanedJSON);
  console.log("Updated Test Cases (Human Feedback):", JSON.stringify(updatedTestCases, null, 2));
  return updatedTestCases;
}

