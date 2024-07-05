import fs from "fs";
import path from "path";
import axios from "axios";
import cheerio from "cheerio";
import OpenAI from "openai";
import { synthesizeSpeech } from "../../utils/polly";
import { generateImages } from "../../utils/imageGeneration";
import { Worker } from "worker_threads";
import { fetchGoogleImage } from "../../utils/googleImageSearch";

const filePath = path.resolve("data", "articles.json");
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});
const writeArticles = async (articles) => {
  fs.writeFileSync(filePath, JSON.stringify(articles, null, 2));
};

const fetchImageFromUrl = async (url, filePath) => {
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, data);
  } catch (error) {
    console.error(`Error fetching image from URL ${url}:`, error);
  }
};

const fetchFullArticleContent = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extract the text content of the article
    let articleContent = $("article").text();

    // Remove excess whitespace (newlines, tabs, multiple spaces)
    articleContent = articleContent
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Remove URLs
    articleContent = articleContent.replace(/https?:\/\/[^\s]+/g, "");

    return articleContent;
  } catch (error) {
    console.error("Error fetching full article:", error);
    return null;
  }
};

const readArticles = () => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      fs.writeFileSync(filePath, JSON.stringify([]));
      return [];
    } else {
      throw error;
    }
  }
};

function getTopWords(article, topN = 5) {
  // Remove punctuation and convert to lowercase
  article = article.replace(/[^\w\s]/gi, "").toLowerCase();

  // Split the article into words
  const words = article.split(/\s+/);

  // Count the frequency of each word
  const wordCounts = {};
  words.forEach((word) => {
    if (word) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });

  // Convert the wordCounts object to an array of [word, count] pairs
  const wordCountPairs = Object.entries(wordCounts);

  // Sort the pairs based on the count in descending order
  wordCountPairs.sort((a, b) => b[1] - a[1]);

  // Extract the top N words
  const topWords = wordCountPairs.slice(0, topN).map((pair) => pair[0]);

  // Return the top words as a string
  return topWords.join(", ");
}

const generateSummaryScript = async (articleToRender) => {
  const article = articleToRender.content;
  const author = articleToRender.author;
  const title = articleToRender.title;
  const source = articleToRender.source.name;

  const prompt = `
        From the following news article, summarize the content into a script for a short video that will be narrated by a voiceover artist. The video will be about 60 seconds long and will include relevant images and animations to accompany the narration.  Please return three to four paragraphs. Do not include any cues, titles, or instructions in the script. Only return the words for the narrator to read. The tone should be engaging and informative. The script should be written in a conversational style. Please make sure to include all the important details and key points from the article. At the beginning of the script, please include the following information: the title of the article, the author, and the source.  Return response in json format.  The first entry in the array should be the script.  The second key in the array should be a few word summary to use as a google image search. Here is the source: ${source}. Here is the title: ${title}. Here is the author or authors: ${author}. Here is the article: ${article}.  `;

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

    /*    console.log("summary", summary); // "Trump trial in DC before election" */

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

const textToSpeech = async (scriptSegments, audioFolder) => {
  for (const [index, segment] of scriptSegments.entries()) {
    const { audioBuffer } = await synthesizeSpeech(segment);
    const audioPath = path.join(audioFolder, `segment-${index + 1}.mp3`);
    fs.writeFileSync(audioPath, audioBuffer);
  }
};

const generatePics = async (
  scriptSegments,
  imagesFolder,
  articleToRender,
  scriptSummary
) => {
  const urlToImage = articleToRender.urlToImage;
  const images = [];

  for (let i = 0; i < scriptSegments.length; i++) {
    let imagePath = path.join(imagesFolder, `segment-${i + 1}.png`);

    if (i % 3 === 0) {
      // Use urlToImage for the first segment and every third segment
      if (urlToImage) {
        await fetchImageFromUrl(urlToImage, imagePath);
      } else {
        // Fallback to AI generated image if urlToImage is not available
        const imageForSegment = await generateImages(
          scriptSegments[i],
          1,
          articleToRender
        );
        fs.writeFileSync(imagePath, Buffer.from(imageForSegment[0], "base64"));
      }
    } else if (i % 3 === 1) {
      // Use Google Custom Search for the second segment and every third segment after that

      const googleImage = await fetchGoogleImage(scriptSummary, i);
      if (googleImage) {
        await fetchImageFromUrl(googleImage, imagePath);
      } else {
        // Fallback to AI generated image if Google Custom Search fails
        const imageForSegment = await generateImages(
          scriptSegments[i],
          1,
          articleToRender
        );
        fs.writeFileSync(imagePath, Buffer.from(imageForSegment[0], "base64"));
      }
    } else {
      // Use AI generated image for the third segment and every third segment after that
      const imageForSegment = await generateImages(
        scriptSegments[i],
        1,
        articleToRender
      );
      fs.writeFileSync(imagePath, Buffer.from(imageForSegment[0], "base64"));
    }

    images.push(imagePath);
  }

  return images;
};

const createFFMPEGWorker = (workerData) =>
  new Promise((resolve, reject) => {
    const workerLocation = path.join(process.cwd(), "utils", "ffmpegWorker.js");
    const worker = new Worker(workerLocation, { workerData });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });

const createVideo = async (audioFiles, imageFiles, outputFilePath) => {
  const workerData = {
    audioFiles,
    imageFiles,
    outputFilePath,
  };

  try {
    const message = await createFFMPEGWorker(workerData);
    return message;
  } catch (error) {
    console.error("Error creating video with FFmpeg:", error);
    return null;
  }
};
export default async function handler(req, res) {
  if (req.method === "POST") {
    const articleToRender = req.body;

    const articles = await readArticles();

    const regex = /\[\+[a-zA-Z0-9 ]*chars\]/;

    if (regex.test(articleToRender.content)) {
      articleToRender.content = await fetchFullArticleContent(
        articleToRender.url
      );
    }

    const [scriptSegments, scriptSummary] = await generateSummaryScript(
      articleToRender
    );

    if (scriptSegments) {
      const articleDirectory = path.join(
        process.cwd(),
        "projects",

        articleToRender.title
          .replace(/\s+/g, "_")
          .replace("?", "")
          .replace(":", "")
          .replace("/", "")
          .replace(",", "")
      );
      fs.mkdirSync(articleDirectory, { recursive: true });
      const scriptDirectory = path.join(articleDirectory, "script");
      const audioDirectory = path.join(articleDirectory, "audio");
      const imagesDirectory = path.join(articleDirectory, "images");
      fs.mkdirSync(audioDirectory, { recursive: true });
      fs.mkdirSync(scriptDirectory, { recursive: true });
      fs.mkdirSync(imagesDirectory, { recursive: true });

      // write script to file
      fs.writeFileSync(
        path.join(scriptDirectory, "script.txt"),
        scriptSegments.join("\n")
      );

      await textToSpeech(scriptSegments, audioDirectory);

      await generatePics(
        scriptSegments,
        imagesDirectory,
        articleToRender,
        scriptSummary
      );

      const audioFiles = fs
        .readdirSync(audioDirectory)
        .map((file) => path.join(audioDirectory, file));

      console.log("audioFiles", audioFiles);
      const imageFiles = fs
        .readdirSync(imagesDirectory)
        .map((file) => path.join(imagesDirectory, file));
      console.log("imageFiles", imageFiles);

      const outputFilePath = path.join(articleDirectory, "output.mp4");

      /*  await createVideo(audioFiles, imageFiles, outputFilePath); */
      const worker = new Worker(
        path.join(process.cwd(), "utils", "ffmpegWorker.js"),
        {
          workerData: { audioFiles, imageFiles, outputFilePath },
        }
      );

      worker.on("message", (message) => {
        if (message.error) {
          console.error("FFmpeg error:", message.error);
          return res.status(500).json({ error: "Error generating video" });
        }

        console.log("Video generation complete, message: ", message);
        res.status(200).json({ outputFileName: `${outputFileName}` });
      });

      worker.on("error", (err) => {
        console.error("Worker error:", err);
        res.status(500).json({ error: "Error generating video" });
      });

      worker.on("exit", (code) => {
        if (code !== 0) {
          console.error(`Worker stopped with exit code ${code}`);
          res.status(500).json({ error: "Error generating video" });
        }
      });
    }

    /*   articles.push(articleToRender);
    await writeArticles(articles); */
    res.status(201).json(articleToRender);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
