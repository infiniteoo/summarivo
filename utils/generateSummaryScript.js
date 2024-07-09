import OpenAI from "openai";
import { generatePrompt } from "./generatePrompt";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const generateSummaryScript = async (articleToRender) => {
  const article = articleToRender.content;
  const author = articleToRender.author;
  const title = articleToRender.title;
  const source = articleToRender.source.name;

  const prompt = generatePrompt(source, title, author, article);

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    console.log("Completion:", completion.choices[0].message);

    // Step 1: Extract the content string
    const contentString = completion.choices[0].message.content;

    // Step 2: Parse the content string into a JavaScript object
    const contentObject = JSON.parse(contentString);

    // Step 3: Access the script and summary properties
    const script = contentObject.script;
    const summary = contentObject.summary;

    let rawScript;

    script.forEach((element) => {
      rawScript += element;
    });

    let scriptSummary = summary;

    rawScript = rawScript.replace(/^\[[^\]]*\]\s*$/gm, "");
    rawScript = rawScript.replace(/"([^"]*)"/g, "$1");
    rawScript = rawScript.replace(/^\(.*\)\s*$/gm, "");
    rawScript = rawScript.replace(/^Segment \d+.*$/gm, "");
    rawScript = rawScript.replace(/^\*\*Segment \d+:.*\*\*\s*$/gm, "");
    rawScript = rawScript.replace(/^\*\*.*\*\*\s*$/gm, "");
    rawScript = rawScript.replace(/---/g, "");
    rawScript = rawScript.replace(/\[intro\]/gi, "");
    rawScript = rawScript.replace("Narrator:", "");
    rawScript = rawScript.replace("Title:", "");
    rawScript = rawScript.replace("Author:", "");
    rawScript = rawScript.replace("Source:", "");
    rawScript = rawScript.replace("undefined", "");

    // Combine shorter segments into longer segments remove empty segments
    let segments = rawScript
      .split(".")

      .filter((segment) => segment.length > 5);

    console.log("Segments:", segments);
    return [segments, scriptSummary]; // Return as an array
  } catch (error) {
    console.error("Error fetching script from OpenAI:", error);
    return [];
  }
};
