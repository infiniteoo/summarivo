import fs from "fs";
import path from "path";

const filePath = path.resolve("data", "articles.json");

export const writeArticles = async (articles) => {
  fs.writeFileSync(filePath, JSON.stringify(articles, null, 2));
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
