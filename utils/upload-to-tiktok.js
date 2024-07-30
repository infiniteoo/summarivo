import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import path from "path";
import { formatDate } from "./formatDate";

const uploadVideoToTikTok = async (
  videoFullPath,
  article,
  scriptSegments,
  accessToken
) => {
  console.log("Starting video upload process to TikTok...");
  console.log("Video path:", videoFullPath);
  console.log("Article:", article);
  console.log("Script segments:", scriptSegments);
  console.log("Access Token:", accessToken);

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

  const videoTitle = article.title;

  if (!videoTitle || !videoDescription) {
    throw new Error("Missing required fields");
  }

  try {
    console.log("Uploading video to TikTok...");
    const form = new FormData();
    form.append("video", fs.createReadStream(videoFullPath));
    form.append("description", videoDescription);

    const response = await axios.post(
      "https://open-api.tiktok.com/v1/video/upload/",
      form,
      {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${form._boundary}`,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("Video uploaded successfully. Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error during TikTok upload:", error.message);
    throw new Error(`TikTok upload failed: ${error.message}`);
  }
};

export default uploadVideoToTikTok;
