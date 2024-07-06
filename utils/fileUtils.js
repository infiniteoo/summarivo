import fs from "fs";
import path from "path";

export const createDirectories = (baseDir, subDirs) => {
  subDirs.forEach((dir) => {
    const fullPath = path.join(baseDir, dir);
    fs.mkdirSync(fullPath, { recursive: true });
  });
};

export const writeFile = (filePath, content) => {
  fs.writeFileSync(filePath, content);
};

export const readFiles = (directory) => {
  return fs.readdirSync(directory).map((file) => path.join(directory, file));
};
