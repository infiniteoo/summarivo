import path from "path";
import { runWorker } from "@/utils/workerUtils";
import { generateSummaryScript } from "@/utils/generateSummaryScript";
import { textToSpeech } from "@/utils/textToSpeech";
import { generatePics } from "@/utils/generatePics";
import { readArticles, writeArticles } from "@/utils/articleAccess";
import { fetchFullArticleContent } from "@/utils/fetchFullArticleContent";
import { createDirectories, writeFile, readFiles } from "@/utils/fileUtils";
import uploadVideo from "@/utils/upload-video";

const handlePostRequest = async (req, res) => {
  const { newArticle: articleToRender, autoGenerate } = req.body;
  console.log("Article to render:", articleToRender);
  console.log("Auto-generate:", autoGenerate);

  const articles = await readArticles();

  if (!autoGenerate) {
    // do nothing, do not execute below code, just return
    return res
      .status(200)
      .json({ message: "Auto-Generate turned OFF - doing nothing." });
  }

  if (/\[\+[a-zA-Z0-9 ]*chars\]/.test(articleToRender.content)) {
    articleToRender.content = await fetchFullArticleContent(
      articleToRender.url
    );
  }

  const [scriptSegments, scriptSummary] = await generateSummaryScript(
    articleToRender
  );

  if (scriptSegments) {
    const sanitizedTitle = articleToRender.title
      .replace(/\s+/g, "_")
      .replace(/[?:\/,]/g, "");

    const articleDirectory = path.join(
      process.cwd(),
      "projects",
      sanitizedTitle
    );
    createDirectories(articleDirectory, ["script", "audio", "images"]);

    const scriptDirectory = path.join(articleDirectory, "script");
    const audioDirectory = path.join(articleDirectory, "audio");
    const imagesDirectory = path.join(articleDirectory, "images");

    writeFile(
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

    const audioFiles = readFiles(audioDirectory);
    const imageFiles = readFiles(imagesDirectory);
    const outputFilePath = path.join(articleDirectory, "output.mp4");

    await runWorker(
      { audioFiles, imageFiles, outputFilePath },
      async () => {
        await uploadVideo(outputFilePath, articleToRender, scriptSegments);
        res.status(200).json({ outputFileName: `${outputFilePath}` });
      },
      (error) => res.status(500).json({ error: error.message })
    );
  } else {
    res.status(500).json({ error: "Error generating script segments" });
  }

  articles.push(articleToRender);
  await writeArticles(articles);
  res.status(201).json(articleToRender);
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    await handlePostRequest(req, res);
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
