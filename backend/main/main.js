import { resetting } from "../tools/formatter.js";
import { evaluate } from "../tools/reviewer.js";
import { generateTestCases } from "../tools/testCasesGeneration.js";
import { generateTestCasesFromImages } from '../tools/testCasesGenerationByImage.js';
import { humanReview } from '../tools/humanFeedback.js';
import { validateIntent, validateHumanFeedbackIntent } from '../tools/intent.js';
import { checkHarmfulContent } from '../tools/safetyGuardrails.js';
import { queryEnhancer } from '../tools/optimizer.js';
import { languageCheck } from '../tools/languageCheck.js';

async function generateTestCaseFlow(background, requirements, mocks, additionalInformation) {

    const languageValidation = await languageCheck(`${background} ${requirements} ${additionalInformation}`);
    if (languageValidation.isEnglish === "no") {
        throw new Error("The provided content is not in English.");
    }

    console.log("Generating Test Cases...");
    const harmfulCheck = await checkHarmfulContent(`${background} ${requirements} ${additionalInformation}`);
    if (harmfulCheck.harmful === "yes") {
        throw new Error("The provided content has been flagged as harmful or inappropriate.");
    }

    const intentValidation = await validateIntent(background, requirements, additionalInformation);
    if (intentValidation.validIntent === "no") {
        throw new Error("The provided requirements do not align with the application context.");
    }

    if (!mocks || mocks.length === 0) {
        const testCases = await generateTestCases(background, requirements, additionalInformation);
        console.log("Generated Test Cases:\n", testCases);

        const reviewPoints = await evaluate(testCases);
        if (reviewPoints.changesRequired) {
            console.log("Review Points:\n", reviewPoints);
            const updatedTestCases = await resetting(testCases, reviewPoints.issues);
            console.log("Updated Test Cases:\n", updatedTestCases);
            return updatedTestCases;
        } else {
            console.log("No changes required in the generated test cases.");
            console.log("Final Test Cases:\n", testCases);
            return testCases;
        }
    } 
    else if (mocks && mocks.length > 0) {
        const testCases = await generateTestCasesFromImages(mocks, background, requirements, additionalInformation);
        console.log("Generated Test Cases from Images:\n", testCases);

        const reviewPoints = await evaluate(testCases);
        if (reviewPoints.changesRequired) {
            console.log("Review Points:\n", reviewPoints);
            const updatedTestCases = await resetting(testCases, reviewPoints.issues);
            console.log("Updated Test Cases:\n", updatedTestCases);
            return updatedTestCases;
        } 
        else {
            console.log("No changes required in the generated test cases.");
            console.log("Final Test Cases:\n", testCases);
            return testCases;
        }
    } 
    else {
        throw new Error("Invalid mocks input. It should be an array.");
    }

}

async function addHumanReview(testCases, reviewPoints) {

    const languageValidation = await languageCheck(`${reviewPoints}`);
    if (languageValidation.isEnglish === "no") {
        throw new Error("The provided content is not in English.");
    }

    const harmfulCheck = await checkHarmfulContent(`${reviewPoints}`);
    if (harmfulCheck.harmful === "yes") {
        throw new Error("The provided content has been flagged as harmful or inappropriate.");
    }

    const intentValidation = await validateHumanFeedbackIntent(testCases, reviewPoints);
    if (intentValidation.validIntent === "no") {
        throw new Error("The provided requirements do not align with the application context.");
    }

    const updatedTestCases = await humanReview(testCases, reviewPoints);
    console.log("Updated Test Cases after Human Review:\n", updatedTestCases);
    return updatedTestCases;


}
async function enhanceQuery(background, requirements, additionalInformation) {

    const languageValidation = await languageCheck(`${background} ${requirements} ${additionalInformation}`);
    if (languageValidation.isEnglish === "no") {
        throw new Error("The provided content is not in English.");
    }

    console.log("Enhancing Query...");
    const harmfulCheck = await checkHarmfulContent(`${background} ${requirements} ${additionalInformation}`);
    if (harmfulCheck.harmful === "yes") {
        throw new Error("The provided content has been flagged as harmful or inappropriate.");
    }

    const intentValidation = await validateIntent(background, requirements, additionalInformation);
    if (intentValidation.validIntent === "no") {
        throw new Error("The provided requirements do not align with the application context.");
    }

    const enhancedQuery = await queryEnhancer(background, requirements, additionalInformation);
    console.log("Enhanced Query:\n", enhancedQuery);
    return enhancedQuery;
    
}

export { generateTestCaseFlow, addHumanReview, enhanceQuery };
