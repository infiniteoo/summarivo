import fs from "fs";
import path from "path";

import { fetchGoogleImage } from "@/utils/googleImageSearch";
import { fetchImageFromUrl } from "@/utils/fetchImageFromUrl";
import { generateImages } from "@/utils/imageGeneration";

export const generatePics = async (
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
