import path from "path";
import { fetchGoogleImage } from "@/utils/googleImageSearch";
import { fetchAndSaveImage, generateAndSaveImage } from "@/utils/imageUtils";

export const generatePics = async (
  scriptSegments,
  imagesFolder,
  articleToRender,
  scriptSummary
) => {
  const { urlToImage } = articleToRender;
  const images = [];

  const getImageForSegment = async (segmentIndex, segmentText, summary) => {
    const imagePath = path.join(
      imagesFolder,
      `segment-${segmentIndex + 1}.png`
    );

    if (segmentIndex % 3 === 0) {
      // Use urlToImage for the first segment and every third segment
      if (urlToImage) {
        await fetchAndSaveImage(urlToImage, imagePath);
      } else {
        await generateAndSaveImage(segmentText, imagePath, articleToRender);
      }
    } else if (segmentIndex % 3 === 1) {
      // Use Google Custom Search for the second segment and every third segment after that
      const googleImage = await fetchGoogleImage(summary, segmentIndex);
      if (googleImage) {
        await fetchAndSaveImage(googleImage, imagePath);
      } else {
        await generateAndSaveImage(segmentText, imagePath, articleToRender);
      }
    } else {
      // Use AI generated image for the third segment and every third segment after that
      await generateAndSaveImage(segmentText, imagePath, articleToRender);
    }

    return imagePath;
  };

  for (let i = 0; i < scriptSegments.length; i++) {
    const imagePath = await getImageForSegment(
      i,
      scriptSegments[i],
      scriptSummary
    );
    images.push(imagePath);
  }

  return images;
};
