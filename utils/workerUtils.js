import { Worker } from "worker_threads";
import path from "path";

export const runWorker = (workerData, onComplete, onError) => {
  const worker = new Worker(
    path.join(process.cwd(), "utils", "ffmpegWorker.js"),
    {
      workerData,
    }
  );

  worker.on("message", (message) => {
    if (message.error) {
      console.error("FFmpeg error:", message.error);
      onError(new Error("Error generating video"));
    } else {
      console.log("Video generation complete, message: ", message);
      onComplete();
    }
  });

  worker.on("error", (err) => {
    console.error("Worker error:", err);
    onError(err);
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
      onError(new Error("Error generating video"));
    }
  });
};
