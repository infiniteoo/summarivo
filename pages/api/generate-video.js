import fs from "fs";
import path from "path";
import axios from "axios";
import cheerio from "cheerio";
import OpenAI from "openai";
import { synthesizeSpeech } from "../../utils/polly";
import { generateImages } from "../../utils/imageGeneration";
import { Worker } from "worker_threads";

const filePath = path.resolve("data", "articles.json");
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});
const writeArticles = async (articles) => {
  fs.writeFileSync(filePath, JSON.stringify(articles, null, 2));
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

const generateSummaryScript = async (articleToRender) => {
  const article = articleToRender.content;
  const author = articleToRender.author;
  const title = articleToRender.title;
  const source = articleToRender.source.name;

  const prompt = `
          From the following news article, summarize the content into a script for a short video that will be narrated by a voiceover artist. The video will be about 60 seconds long and will include relevant images and animations to accompany the narration. Do not include any cues, titles, or instructions in the script.  Only return the words for the narrator to read. The tone should be engaging and informative. The script should be written in a conversational style. Please make sure to include all the important details and key points from the article. At the beginning of the script, please include the following information: the title of the article, the author, and the source. Here is the source: ${source}. Here is the title: ${title}. Here is the author or authors: ${author}. Here is the article: ${article}`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    let rawScript = completion.choices[0].message.content;

    rawScript = rawScript.replace(/^\[[^\]]*\]\s*$/gm, "");
    rawScript = rawScript.replace(/"([^"]*)"/g, "$1");
    rawScript = rawScript.replace(/^\(.*\)\s*$/gm, "");
    rawScript = rawScript.replace(/^Segment \d+.*$/gm, "");
    rawScript = rawScript.replace(/^\*\*Segment \d+:.*\*\*\s*$/gm, "");
    rawScript = rawScript.replace(/^\*\*.*\*\*\s*$/gm, "");
    rawScript = rawScript.replace(/---/g, "");
    rawScript = rawScript.replace(/\[intro\]/gi, "");

    return rawScript.trim();
  } catch (error) {
    console.error("Error fetching script from OpenAI:", error);
    return "";
  }
};

const textToSpeech = async (scriptSegments, audioFolder) => {
  for (const [index, segment] of scriptSegments.entries()) {
    const { audioBuffer } = await synthesizeSpeech(segment);
    const audioPath = path.join(audioFolder, `segment-${index + 1}.mp3`);
    fs.writeFileSync(audioPath, audioBuffer);
  }
};

const generatePics = async (scriptSegments, imagesFolder) => {
  const generatedImages = await generateImages(scriptSegments);
  const images = [];
  generatedImages.forEach((img, i) => {
    const imagePath = path.join(imagesFolder, `segment-${i + 1}.png`);
    fs.writeFileSync(imagePath, img);
    images.push(imagePath);
  });
  return images;
};

const createFFMPEGWorker = (workerData) =>
  new Promise((resolve, reject) => {
    const worker = new Worker("./utils/ffmpegWorker.js", { workerData });
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
    const { article: articleToRender } = req.body;
    const articles = await readArticles();

    const regex = /\[\+[a-zA-Z0-9 ]*chars\]/;

    if (regex.test(articleToRender.content)) {
      articleToRender.content = await fetchFullArticleContent(
        articleToRender.url
      );
    }

    const script = await generateSummaryScript(articleToRender.content);

    if (script) {
      const scriptSegments = script.match(/[^.!?]+[.!?]+/g) || [];

      const articleDirectory = path.join(
        process.cwd(),
        "public",
        "videos",
        articleToRender.title.replace(/\s+/g, "_")
      );
      fs.mkdirSync(articleDirectory, { recursive: true });

      const audioDirectory = path.join(articleDirectory, "audio");
      const imagesDirectory = path.join(articleDirectory, "images");
      fs.mkdirSync(audioDirectory, { recursive: true });
      fs.mkdirSync(imagesDirectory, { recursive: true });

      await textToSpeech(scriptSegments, audioDirectory);
      await generatePics(scriptSegments, imagesDirectory);

      const audioFiles = fs
        .readdirSync(audioDirectory)
        .map((file) => path.join(audioDirectory, file));
      const imageFiles = fs
        .readdirSync(imagesDirectory)
        .map((file) => path.join(imagesDirectory, file));
      const outputFilePath = path.join(articleDirectory, "output.mp4");

      await createVideo(audioFiles, imageFiles, outputFilePath);
    }

    articles.push(articleToRender);
    await writeArticles(articles);
    res.status(201).json(articleToRender);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
