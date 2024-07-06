import path from "path";

import { fetchFullArticleContent } from "../../utils/fetchFullArticleContent";
import { readArticles, writeArticles } from "../../utils/articleAccess";
import { generateSummaryScript } from "@/utils/generateSummaryScript";
import { textToSpeech } from "@/utils/textToSpeech";
import { generatePics } from "@/utils/generatePics";
import { createDirectories, writeFile, readFiles } from "@/utils/fileUtils";
import { runWorker } from "@/utils/workerUtils";

const handlePostRequest = async (req, res) => {
  const articleToRender = req.body;

  const articles = await readArticles();

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

    runWorker(
      { audioFiles, imageFiles, outputFilePath },
      () => res.status(200).json({ outputFileName: `${outputFilePath}` }),
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
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
