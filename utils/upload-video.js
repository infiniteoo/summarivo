import fs from "fs";
import { google } from "googleapis";
import path from "path";
import { formatDate } from "./formatDate";

const uploadVideo = async (videoFullPath, article, scriptSegments, tokens) => {
  console.log("Starting video upload process...");
  console.log("Video path:", videoFullPath);
  console.log("Article:", article);
  console.log("Script segments:", scriptSegments);
  console.log("Tokens:", tokens);

  const readableDate = formatDate(article.publishedAt);

  const videoDescription = `
   
  Article Source: ${article.source.name}
  Article Author: ${article.author}
  Published At: ${readableDate}

  Article Title: ${article.title}
  Article Description: ${article.description}

  Link to Article: ${article.url}
  
  
  `;

  const script = scriptSegments.join("\n");
  console.log("Script to upload:", script);

  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID,
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_YOUTUBE_REDIRECT_URI
  );

  oauth2Client.setCredentials(tokens);

  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  const { title, description } = article;

  if (!title || !description) {
    throw new Error("Missing required fields");
  }

  try {
    console.log("Uploading video to YouTube...");
    const videoResponse = await youtube.videos.insert({
      part: "snippet,status,recordingDetails",
      requestBody: {
        snippet: {
          title: title,
          description: videoDescription,
          categoryId: "25", // Category ID for News & Politics
          defaultAudioLanguage: "en",
          defaultLanguage: "en",
        },
        status: {
          privacyStatus: "private",
          caption: "true",
        },
        recordingDetails: {
          recordingDate: new Date().toISOString(),
        },
      },
      media: {
        body: fs.createReadStream(videoFullPath),
      },
    });
    const videoId = videoResponse.data.id;
    console.log("Video uploaded successfully. Video ID:", videoId);

    const sanitizedTitle = article.title.replace(/\s+/g, "_");
    const articleDirectory = path.join(
      process.cwd(),
      "projects",
      sanitizedTitle
    );

    const scriptPath = path.join(articleDirectory, "script", "script.txt");

    console.log("Uploading captions...");

    const captionsResponse = await youtube.captions.insert({
      part: "snippet",
      requestBody: {
        snippet: {
          videoId: videoId,
          language: "en",
          name: "English Auto-sync",
          isDraft: false,
        },
      },
      media: {
        mimeType: "text/plain",
        body: fs.createReadStream(scriptPath),
      },
    });

    console.log("Captions uploaded successfully.");
    return {
      videoResponse: videoResponse.data,
      captionsResponse: captionsResponse.data,
    };
  } catch (error) {
    console.error("Error during YouTube upload:", error.message);
    throw new Error(`YouTube upload failed: ${error.message}`);
  }
};

export default uploadVideo;
