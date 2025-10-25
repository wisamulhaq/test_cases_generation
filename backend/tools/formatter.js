import dotenv from 'dotenv';

import { GoogleGenAI, Type } from "@google/genai";


// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

// Define the JSON schema for updated test cases (same as generation schema)
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

// Helper function to extract test cases that have issues and merge back the updated ones
function extractAndMergeTestCases(originalTestCases, reviewPoints) {
  // Parse originalTestCases if it's a string
  const testCasesData = typeof originalTestCases === 'string'
    ? JSON.parse(originalTestCases)
    : originalTestCases;

  // Parse reviewPoints if it's a string
  const reviewData = typeof reviewPoints === 'string'
    ? JSON.parse(reviewPoints)
    : reviewPoints;

  // Extract test case numbers that have issues
  const testCaseNumbersWithIssues = new Set();
  if (reviewData.issues && Array.isArray(reviewData.issues)) {
    reviewData.issues.forEach(issue => {
      if (issue.testCaseNumber) {
        testCaseNumbersWithIssues.add(issue.testCaseNumber);
      }
    });
  }

  // Filter test cases that have issues
  const testCasesWithIssues = testCasesData.testCases.filter(testCase =>
    testCaseNumbersWithIssues.has(testCase.testCaseNumber)
  );

  console.log(`Found ${testCasesWithIssues.length} test cases with issues out of ${testCasesData.testCases.length} total test cases`);
  console.log(`Test cases with issues: ${Array.from(testCaseNumbersWithIssues).join(', ')}`);

  return {
    allTestCases: testCasesData.testCases,
    testCasesWithIssues,
    testCaseNumbersWithIssues
  };
}

// Helper function to merge updated test cases back into the original list
function mergeUpdatedTestCases(originalTestCases, updatedTestCases, testCaseNumbersWithIssues) {
  // Create a map of updated test cases by testCaseNumber for quick lookup
  const updatedTestCasesMap = new Map();
  updatedTestCases.forEach(testCase => {
    updatedTestCasesMap.set(testCase.testCaseNumber, testCase);
  });

  // Merge updated test cases back into original list while maintaining order
  const mergedTestCases = originalTestCases.map(originalTestCase => {
    if (testCaseNumbersWithIssues.has(originalTestCase.testCaseNumber)) {
      // Replace with updated version if available
      return updatedTestCasesMap.get(originalTestCase.testCaseNumber) || originalTestCase;
    }
    // Keep original test case unchanged
    return originalTestCase;
  });

  return { testCases: mergedTestCases };
}

export async function resetting(testCasesInput, reviewPoints) {
  // Handle both string input and object input
  const testCasesText = typeof testCasesInput === 'string'
    ? testCasesInput
    : JSON.stringify(testCasesInput, null, 2);

  const reviewPointsText = typeof reviewPoints === 'string'
    ? reviewPoints
    : JSON.stringify(reviewPoints, null, 2);

  // Extract test cases that have issues and prepare for optimization
  const { allTestCases, testCasesWithIssues, testCaseNumbersWithIssues } =
    extractAndMergeTestCases(testCasesInput, reviewPoints);

  // If no test cases have issues, return original test cases
  if (testCasesWithIssues.length === 0) {
    console.log("No test cases have issues. Returning original test cases.");
    return { testCases: allTestCases };
  }

  // Only send test cases with issues to LLM to reduce token usage
  const testCasesWithIssuesOnly = { testCases: testCasesWithIssues };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Test Cases with Issues Only:
${JSON.stringify(testCasesWithIssuesOnly)}

Review Feedback/Points to Address:
${JSON.stringify(reviewPointsText)}

Please update ONLY the test cases provided above based on the review feedback. Return the updated test cases in the same format.`,
    config: {
      systemInstruction: `### Test Case Updater Assistant

You are a **Test Case Updater Assistant** that revises *specific software test cases* based on provided **review points and feedback**.  
Your task is to update only the test cases provided while maintaining their format, numbering, and consistency.

---

### Important Notes

- You will receive **ONLY** the test cases that need to be updated (not the full list).
- Update these test cases based on the specific review feedback provided.
- Return **ONLY** the updated versions of these test cases.
- Do **NOT** add any test cases that were not provided.

---

### Guidelines & Rules

1. **Update Scope**  
   - Only modify test cases based on the specific issues mentioned in the review points.
   - Apply the feedback precisely while maintaining clarity, correctness, and test relevance.

2. **Structure & Format**  
   - Maintain the **original structure**, including test case format and numbering.
   - Do **NOT** change test case numbering.

3. **Content Integrity**  
   - Keep the tone and style consistent with the original test cases.
   - Ensure updated test cases are clear, specific, and follow best practices.

4. **Quality Assurance**  
   - Ensure updated test cases resolve the identified issues.
   - Maintain test case independence and singular focus.

---

### Output Format

- The response **must be in valid JSON** following the specified schema ${JSON.stringify(testCaseSchema)}.
- Include **ONLY** the test cases that were provided for update.
- Each test case should follow the format: "Verify that <expected result> when <action>".
`,

    },
  });

  const cleanedJSON = response.text.replace(/^```json\s*/, '').replace(/```$/, '');
  const updatedTestCasesData = JSON.parse(cleanedJSON);
  console.log("Updated Test Cases from LLM:", JSON.stringify(updatedTestCasesData, null, 2));

  // Merge the updated test cases back into the original list
  const finalTestCases = mergeUpdatedTestCases(
    allTestCases,
    updatedTestCasesData.testCases,
    testCaseNumbersWithIssues
  );

  console.log("Final Merged Test Cases:", JSON.stringify(finalTestCases, null, 2));
  return finalTestCases;
}
