// utils/imageGeneration.js

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function generateImages(segmentText, count, articleToRender) {
  try {
    const prompt = `You will be generating an image for a news story with the title: "${articleToRender.title}" and description "${articleToRender.description}". The story is segmented into smaller parts, and this image will cover this part of the story: "${segmentText}". The image should be related to the story and should be visually appealing.  Make the image as visually realistic as possible. If your prompt calls for a specific celebrity, public figure, or trademarked/copyrighted brand, please generate a lookalike image that will not cause any legal infractions.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: count,
      size: "1792x1024",
      response_format: "b64_json", // Specify the response format
      style: "natural",
      quality: "hd",
    });

    console.log("OpenAI API response:", response);

    if (response.data && Array.isArray(response.data)) {
      return response.data.map((image) => image.b64_json);
    } else {
      console.error("Unexpected response format from OpenAI API:", response);
      return []; // Return an empty array if response format is unexpected
    }
  } catch (error) {
    console.error("Error generating images from OpenAI:", error);
    throw error; // Rethrow the error for the caller to handle
  }
}
