import axios from "axios";
import fs from "fs";

export const fetchImageFromUrl = async (url, filePath) => {
  try {
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, data);
  } catch (error) {
    console.error(`Error fetching image from URL ${url}:`, error);
  }
};
