import { promises as fs } from "fs";
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

const readArticles = async () => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(filePath, JSON.stringify([]));
      return [];
    } else {
      throw error;
    }
  }
};

const writeArticles = async (articles) => {
  await fs.writeFile(filePath, JSON.stringify(articles, null, 2));
};

const fetchFullArticleContent = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    // Modify the selector to match the specific site's article content container
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

    // Remove lines starting and ending with brackets
    rawScript = rawScript.replace(/^\[[^\]]*\]\s*$/gm, "");

    // Remove quotes around paragraphs
    rawScript = rawScript.replace(/"([^"]*)"/g, "$1");

    // Remove lines with "Segment (Number):" or lines within parentheses
    rawScript = rawScript.replace(/^\(.*\)\s*$/gm, "");
    rawScript = rawScript.replace(/^Segment \d+.*$/gm, "");
    rawScript = rawScript.replace(/^\*\*Segment \d+:.*\*\*\s*$/gm, "");

    // Remove lines that begin and end with **
    rawScript = rawScript.replace(/^\*\*.*\*\*\s*$/gm, "");

    // Remove "---"
    rawScript = rawScript.replace(/---/g, "");

    // Remove "[intro]"
    rawScript = rawScript.replace(/\[intro\]/gi, "");

    return rawScript.trim();
  } catch (error) {
    console.error("Error fetching script from OpenAI:", error);
    return "";
  }
};

const textToSpeech = async (scriptSegments, audioFolder) => {
  // loop through scriptSegments and use Amazon Polly to generate an audio file

  scriptSegments.forEach(async (segment, index) => {
    const { audioBuffer, audioDataURI } = await synthesizeSpeech(segment);
    const segmentNumber = index + 1;
    const audioName = `segment-${segmentNumber
      .toString()
      .padStart(2, "0")}.mp3`;
    const audioPath = path.join(audioFolder, audioName);
    fs.writeFileSync(audioPath, audioBuffer);
  });

  return "Generated audio file path";
};

const generatePics = async (scriptSegments, imagesFolder, newArticle) => {
  // Placeholder: Use Google Custom Search API or AI to generate images
  const alphabet = "abcdefghijklmnopqrstuvwxyz";

  scriptSegments.forEach(async (segmentText, index) => {
    const imageUrls = await generateImages(segmentText, 1, newArticle);

    imageUrls.forEach((imageUrl, index) => {
      if (imageUrl) {
        try {
          const segmentNumber = index + 1;

          const suffix = alphabet[index % alphabet.length];

          const imageName = `segment-${segmentNumber
            .toString()
            .padStart(2, "0")}${suffix}.png`;

          const imagePath = path.join(imagesFolder, imageName);
          const base64Data = imageUrl;
          if (!base64Data) {
            throw new Error("Invalid base64 data");
          }

          fs.writeFileSync(imagePath, Buffer.from(base64Data, "base64"));
        } catch (error) {
          console.error("Error saving image:", error);
        }
      } else {
        console.error("Received empty imageUrl");
      }
    });
  });
};

const generateVideo = async (audioFolder, imagesFolder, videoFolder) => {
  // Placeholder: Use FFmpeg to generate a video from the audio and images
  const audioFiles = fs
    .readdirSync(path.join(audioFolder))
    .filter((file) => file.endsWith(".mp3"))
    .map((file) => path.join(audioFolder, file).replace(/\\/g, "/"));
  console.log("audioFiles found for video generation: ", audioFiles);

  const imageFiles = fs
    .readdirSync(path.join(imagesFolder))
    .filter((file) => file.endsWith(".jpg") || file.endsWith(".png"))
    .map((file) => path.join(imagesFolder, file).replace(/\\/g, "/"));
  console.log("imageFiles found for video generation: ", imageFiles);

  const currentDate = new Date();
  const formattedDate = currentDate
    .toISOString()
    .replace(/T/, "_")
    .replace(/\..+/, "")
    .replace(/:/g, "-");

  const videoFileName = `generated-video-${formattedDate}.mp4`;
  const videoFilePath = path
    .join(videoFolder, videoFileName)
    .replace(/\\/g, "/");
  console.log("videoFilePath: ", videoFilePath);

  const worker = new Worker(
    path.join(process.cwd(), "utils", "ffmpegWorker.js"),
    {
      workerData: { audioFiles, imageFiles, videoFilePath },
    }
  );

  worker.on("message", (message) => {
    if (message.error) {
      console.error("FFmpeg error:", message.error);
      return res.status(500).json({ error: "Error generating video" });
    }

    console.log("Video generation complete, message: ", message);
    res.status(200).json({ videoFileName: `${videoFileName}` });
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
  return "Generated video file path";
};

const generateThumbnail = async (imagesFolder, thumbnailFolder) => {
  // Placeholder: Use FFmpeg to generate a thumbnail for the video
  return "Generated thumbnail file path";
};

const uploadToYouTube = async (
  videoFilePath,
  thumbnailFilePath,
  title,
  description
) => {
  // Placeholder: Upload the video and thumbnail to YouTube
  return "YouTube video URL";
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const articles = await readArticles();
      res.status(200).json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to read articles" });
    }
  } else if (req.method === "POST") {
    try {
      const newArticle = req.body;
      const articles = await readArticles();

      if (!articles.some((article) => article.url === newArticle.url)) {
        const fullContent = await fetchFullArticleContent(newArticle.url);
        if (fullContent) {
          newArticle.content = fullContent;
        }
        articles.push(newArticle);
        await writeArticles(articles);

        // create project files and folders
        // create a folder for the project
        const projectFolder = path.join(
          process.cwd,
          "projects",
          newArticle.source.name + "_" + newArticle.publishedAt
        );
        await fs.mkdir(projectFolder);

        // create a folder for the audio files
        const audioFolder = path.join(projectFolder, "audio");
        await fs.mkdir(audioFolder);

        // create a folder for the images
        const imagesFolder = path.join(projectFolder, "images");
        await fs.mkdir(imagesFolder);

        // create a folder for the script files
        const scriptFolder = path.join(projectFolder, "script");
        await fs.mkdir(scriptFolder);

        // create a folder for the video files
        const videoFolder = path.join(projectFolder, "video");
        await fs.mkdir(videoFolder);

        // create a folder for the thumbnail files
        const thumbnailFolder = path.join(projectFolder, "thumbnail");
        await fs.mkdir(thumbnailFolder);

        // Generate summary/script of the article
        const summaryScript = await generateSummaryScript(newArticle);

        // Save the summary/script to a text file
        const scriptFilePath = path.resolve(scriptFolder, "script.txt");
        await fs.writeFile(scriptFilePath, summaryScript);

        // break the summaryScript into smaller segments
        const scriptSegments = summaryScript
          .split("\n")
          .filter((p) => p.trim() !== "");

        // Use Amazon Polly to generate an audio file from the script
        await textToSpeech(scriptSegments, audioFolder);

        // Generate images using Google Custom Search API or AI
        await generatePics(scriptSegments, imagesFolder, newArticle);

        // Use FFmpeg to generate a video from the audio and images
        await generateVideo(audioFolder, imagesFolder, videoFolder);

        // Generate a thumbnail for the video
        await generateThumbnail(imagesFolder, thumbnailFolder);

        // Upload the video and thumbnail to YouTube
        const youtubeURL = await uploadToYouTube(
          videoFilePath,
          thumbnailFilePath,
          newArticle.title,
          newArticle.description
        );

        // Optionally, save the YouTube URL or any other metadata back to the article JSON
        newArticle.youtubeURL = youtubeURL;
        await writeArticles(articles);
      }

      res.status(201).json({ message: "Article saved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save article" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
