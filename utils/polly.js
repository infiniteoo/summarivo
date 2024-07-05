// utils/polly.js

import AWS from "aws-sdk";

// Configure AWS with your access and secret key.
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Create a Polly client
const polly = new AWS.Polly();

export const synthesizeSpeech = async (text) => {
  const params = {
    OutputFormat: "mp3",
    Text: text,
    Engine: "neural",
    VoiceId: "Danielle",
  };

  try {
    const data = await polly.synthesizeSpeech(params).promise();
    const audioStream = data.AudioStream;
    const audioBuffer = Buffer.from(audioStream);

    // Example: Convert audio buffer to Base64 data URI
    const audioBase64 = audioBuffer.toString("base64");
    const audioDataURI = `data:audio/mpeg;base64,${audioBase64}`;

    return { audioBuffer, audioDataURI };
  } catch (error) {
    console.error("Error synthesizing speech:", error);
    throw error;
  }
};
