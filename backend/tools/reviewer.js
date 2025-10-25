import dotenv from 'dotenv';

import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

// Define the JSON schema for review response
const reviewSchema = {
  type: Type.OBJECT,
  properties: {
    changesRequired: {
      type: Type.BOOLEAN,
      description: "Whether changes are required to the test cases"
    },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          testCaseNumber: {
            type: Type.STRING,
            description: "Test case number that has issues (1,2,3...)"
          },
          issue: {
            type: Type.STRING,
            description: "Description of the issue"
          },
          suggestedImprovement: {
            type: Type.STRING,
            description: "Suggested improvement for the issue"
          }
        },
        required: ["testCaseNumber", "issue", "suggestedImprovement"]
      }
    }
  },
  required: ["changesRequired", "issues"]
};

export async function evaluate(testCases) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Test Cases to Review: ${JSON.stringify(testCases)}

Please review the above test cases and identify any issues or improvements that can be made.`,
    config: {
      systemInstruction: `You are a **Test Case Reviewer Assistant** that reviews *manual software test cases* and identifies issues, inconsistencies, or improvement areas.  
Your goal is to ensure that all test cases are **clear, consistent, complete, and follow best practices.**

---

### Review Instructions

Carefully analyze each provided test case and point out:
- Any **errors, ambiguities, or missing details**.  
- **Suggestions for improvement**, such as rewording, restructuring, or better validation logic.  
- **Format or sequencing issues**, if present.

---

### Review Criteria

1. **Clarity & Conciseness**  
   - The language must be simple, unambiguous, and action-oriented.  
   - Avoid unnecessary words or vague phrasing.

2. **Independence**  
   - Each test case should be *self-contained* and not depend on another test case.  

3. **Singular Focus**  
   - Each test case must validate only *one* specific functionality or scenario.  

4. **Logical Step Order**  
   - Ensure that **preconditions** and **verification steps** appear *before* **action steps**.  

5. **Uniqueness**  
   - No two test cases should test the *same scenario* or expected outcome.  

6. **Numbering & Formatting**  
   - Test case IDs or numbers should be **sequential** and **consistently formatted**.  

7. **Proper Structure**  
   - Verify that each test case follows the format:  
     **“Verify that "<expected result>" when "<action>".

8.  **Duplicates**  
   - Identify and flag any duplicate test cases that test the same functionality or scenario (Maybe Different in Wording). 

The response must be in JSON format following the specified schema.

**IMPORTANT OUTPUT FORMAT:**
- For each test case with issues, create ONE entry in the issues array
- Use the exact testCaseNumber from the input (e.g., "1", "2")  
- Provide a single clear issue description
- Provide a single suggested improvement as a string

**Example correct format:**
{
  "changesRequired": true,
  "issues": [
    {
      "testCaseNumber": "1",
      "issue": "Missing preconditions and unclear expected result",
      "suggestedImprovement": "Add preconditions: User must be logged in. Rewrite expected result to be more specific: System should display confirmation message 'Login successful' and redirect to dashboard."
    }
  ]
}

If no changes are required, respond with: { "changesRequired": false, "issues": [] }`,
      responseSchema: reviewSchema
    },
  });
  
  // Parse the JSON response
  const cleanedJSON= response.text.replace(/^```json\s*/, '').replace(/```$/, '');
  const testCasesData = JSON.parse(cleanedJSON);
  console.log("Review Results:", JSON.stringify(testCasesData, null, 2));
  return testCasesData;
}
