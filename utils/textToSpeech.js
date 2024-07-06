import fs from "fs";
import path from "path";
import { synthesizeSpeech } from "@/utils/polly";

export const textToSpeech = async (scriptSegments, audioFolder) => {
  for (const [index, segment] of scriptSegments.entries()) {
    const { audioBuffer } = await synthesizeSpeech(segment);
    const audioPath = path.join(audioFolder, `segment-${index + 1}.mp3`);
    fs.writeFileSync(audioPath, audioBuffer);
  }
};
