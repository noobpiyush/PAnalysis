import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Select the model
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
});

// Function to summarize a commit from the git diff
export const aiSummariseCommit = async (diff: string) => {
    // Generate content using the refined prompt
    const response = await model.generateContent([
        `You are a highly skilled programmer and an expert in summarizing git diffs. Your goal is to generate concise, meaningful, and accurate summaries for the given git diff input.
        
        Git Diff Format Details:
        1. The diff specifies changes for each file. Metadata lines provide details like file paths and indices. For example:
           diff --git a/lib/index.js b/lib/index.js
           index aadf691..bfef603 100644
           --- a/lib/index.js
           +++ b/lib/index.js
           This indicates that the file \`lib/index.js\` was modified.

        2. Lines starting with:
           - \`+\` represent added lines.
           - \`-\` represent removed lines.
           - Lines starting with neither \`+\` nor \`-\` are context lines provided for better understanding and are not part of the actual change.

        Your Task:
        - Parse the diff input and identify key changes across all files.
        - Write a concise summary for each set of changes, specifying the impacted files and the nature of the modifications.
        - If the commit involves multiple changes (e.g., adding features, fixing bugs, refactoring), break down the summary into bullet points.
        - For changes involving more than two files, generalize the description, focusing on the overall impact without listing every file.

        Example Output:
        1. Increased the returned recordings count from 10 to 100 in [packages/server/recordings_api.ts], [packages/server/constants.ts].
        2. Fixed a typo in the GitHub action name [.github/workflows/gpt-commit-summarizer.yml].
        3. Refactored \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts].
        4. Added an OpenAI API for completions [packages/utils/apis/openai.ts].

        Now, summarize the following git diff input:
       ${diff}`,
    ]);
    return response.response.text();
};


