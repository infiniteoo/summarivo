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

const writeArticles = async (articles) => {
  fs.writeFileSync(filePath, JSON.stringify(articles, null, 2));
};

const fetchFullArticleContent = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    return $("article").text();
  } catch (error) {
    console.error("Error fetching full article:", error);
    return null;
  }
};

const generateSummaryScript = async (newArticle) => {
  const article = newArticle.content;
  const author = newArticle.author;
  const title = newArticle.title;
  const source = newArticle.source.name;

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
    const { article: newArticle, autoGenerate } = req.body;
    const articles = await readArticles();

    if (articles.some((article) => article.url === newArticle.url)) {
      return res.status(400).json({ error: "Article already exists." });
    }

    if (autoGenerate) {
      const script = await generateSummaryScript(newArticle);

      if (script) {
        const scriptSegments = script.match(/[^.!?]+[.!?]+/g) || [];

        const articleDirectory = path.join(
          process.cwd(),
          "public",
          "videos",
          newArticle.title.replace(/\s+/g, "_")
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
    }

    articles.push(newArticle);
    await writeArticles(articles);
    res.status(201).json(newArticle);
  } else if (req.method === "GET") {
    const articles = await readArticles();
    res.status(200).json(articles);
  } else if (req.method === "DELETE") {
    try {
      const { url } = req.query;
      if (!url) {
        return res.status(400).json({ message: "URL parameter is missing" });
      }

      const decodedUrl = decodeURIComponent(url);
      console.log("Deleting article with URL:", decodedUrl);
      let articles = readArticles();

      if (!Array.isArray(articles)) {
        console.error("Articles is not an array:", articles);
        return res.status(500).json({ message: "Failed to read articles" });
      }

      const initialLength = articles.length;
      articles = articles.filter((article) => article.url !== decodedUrl);
      const finalLength = articles.length;

      if (initialLength === finalLength) {
        console.warn("No article found with the given URL to delete");
        return res.status(404).json({ message: "Article not found" });
      }

      writeArticles(articles);
      res.status(200).json({ message: "Article deleted" });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
