import cheerio from "cheerio";
import axios from "axios";

export const fetchFullArticleContent = async (url) => {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extract the text content of the article
    let articleContent = $("article").text();

    // Remove excess whitespace (newlines, tabs, multiple spaces)
    articleContent = articleContent
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Remove URLs
    articleContent = articleContent.replace(/https?:\/\/[^\s]+/g, "");

    return articleContent;
  } catch (error) {
    console.error("Error fetching full article:", error);
    return null;
  }
};
