import fs from "fs";

import { fetchImageFromUrl } from "@/utils/fetchImageFromUrl";
import { generateImages } from "@/utils/imageGeneration";

export const saveImage = (imagePath, imageBuffer) => {
  fs.writeFileSync(imagePath, Buffer.from(imageBuffer, "base64"));
};

export const fetchAndSaveImage = async (url, imagePath) => {
  await fetchImageFromUrl(url, imagePath);
};

export const generateAndSaveImage = async (
  scriptSegment,
  imagePath,
  article
) => {
  const imageForSegment = await generateImages(scriptSegment, 1, article);
  saveImage(imagePath, imageForSegment[0]);
};
