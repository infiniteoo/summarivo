import path from "path";
import uploadVideo from "@/utils/upload-video";
import { readFiles } from "@/utils/fileUtils";
import withSession from "@/lib/session";
import fs from "fs";

const handler = async (req, res) => {
  console.log("Handler invoked");

  if (req.method === "POST") {
    console.log("Received POST request");
    const article = req.body;
    console.log("Received article to upload:", article);

    const sanitizedTitle = article.title
      .replace(/\s+/g, "_")
      .replace(/[?:\/,]/g, "");
    console.log("Sanitized title:", sanitizedTitle);

    const articleDirectory = path.join(
      process.cwd(),
      "projects",
      sanitizedTitle
    );
    const scriptDirectory = path.join(articleDirectory, "script");
    console.log("Article directory:", articleDirectory);
    console.log("Script directory:", scriptDirectory);

    let files;
    try {
      files = readFiles(scriptDirectory);
      console.log("Files in script directory:", files);
    } catch (error) {
      console.error(
        "Error reading files from script directory:",
        error.message
      );
      res
        .status(500)
        .json({ error: "Failed to read files from script directory" });
      return;
    }

    const scriptFile = files.find(
      (file) => path.basename(file) === "script.txt"
    );
    if (!scriptFile) {
      console.error("script.txt file not found");
      res.status(500).json({ error: "script.txt file not found" });
      return;
    }
    console.log("Script file found:", scriptFile);

    let rawScript;
    try {
      rawScript = fs.readFileSync(scriptFile, "utf8");
      console.log("Raw script content:", rawScript);
    } catch (error) {
      console.error("Error reading the script file:", error.message);
      res.status(500).json({ error: "Failed to read the script file" });
      return;
    }

    let scriptSegments;
    try {
      scriptSegments = rawScript
        .split(".")
        .filter((segment) => segment.length > 5);
      console.log("Script segments:", scriptSegments);
    } catch (error) {
      console.error("Error splitting the script content:", error.message);
      res.status(500).json({ error: "Failed to process the script content" });
      return;
    }

    const outputFilePath = path.join(articleDirectory, "output.mp4");
    console.log("Output file path:", outputFilePath);

    const tokens = req.session.get("tokens");
    if (!tokens) {
      console.error("User not authenticated");
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    console.log("Tokens retrieved from session:", tokens);

    try {
      const uploadResponse = await uploadVideo(
        outputFilePath,
        article,
        scriptSegments,
        tokens
      );
      console.log("Upload response:", uploadResponse);
      res
        .status(200)
        .json({ message: "Article uploaded successfully", uploadResponse });
    } catch (error) {
      console.error("Error during video upload:", error.message);
      res
        .status(500)
        .json({ error: "Video upload failed", details: error.message });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
};

export default withSession(handler);
