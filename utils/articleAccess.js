import fs from "fs";
import path from "path";

const filePath = path.resolve("data", "articles.json");

export const writeArticles = async (articles) => {
  const updatedArticles = articles.map((article) => {
    // Add the "completed" property if it doesn't exist
    if (!article.hasOwnProperty("completed")) {
      article.completed = false;
    }
    return article;
  });

  fs.writeFileSync(filePath, JSON.stringify(updatedArticles, null, 2));
};

export const readArticles = () => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      fs.writeFileSync(filePath, JSON.stringify([]));
      return [];
    } else {
      throw error;
    }
  }
};
