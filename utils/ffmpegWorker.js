const { parentPort, workerData } = require("worker_threads");
const { spawn } = require("child_process");

const { audioFiles, imageFiles, videoFilePath } = workerData;
console.log("audioFiles: ", audioFiles);
console.log("imageFiles: ", imageFiles);
console.log("videoFilePath: ", videoFilePath);

// Generate filter_complex for FFmpeg
const generateFilterComplex = () => {
  let inputs = [];
  let filterComplexParts = [];
  let filterInput = "";
  let filterConcat = "";

  // Add audio files and generate audio input filter
  audioFiles.forEach((file, index) => {
    inputs.push(`-i ${file}`);
    filterInput += `[${index}:a]`;
  });

  // Add image files and generate image input filter with pan effects
  imageFiles.forEach((file, index) => {
    inputs.push(`-i ${file}`);
    const imageIndex = audioFiles.length + index;

    // Randomly choose pan left or pan right effect
    // const panEffect = Math.random() < 0.5 ? "panleft" : "panright";

    // randomly choose pan left, pan right, zoom in or zoom out effect
    const panEffect =
      Math.random() < 0.2
        ? "panleft"
        : Math.random() < 0.4
        ? "panright"
        : Math.random() < 0.6
        ? "zoomin"
        : Math.random() < 0.8
        ? "zoomout"
        : "static";

    // Apply pan effect based on choice
    if (panEffect === "panleft") {
      console.log("index: ", index);
      console.log("pan left effect");
      // Pan left effect (start zoomed in and pan to the left)
      filterComplexParts.push(
        `[${imageIndex}:v]zoompan=z='if(lte(zoom,1.0),1.5,max(1.0,zoom-0.0015))':d=125:x='if(lte(zoom,1.0),iw/2+(iw/zoom/2),x-4)':y='ih/2-(ih/zoom/2)'[v${index}]`
      );
    } else if (panEffect === "panright") {
      console.log("index: ", index);
      console.log("pan right effect");
      // Pan right effect (start zoomed in and pan to the right)
      filterComplexParts.push(
        `[${imageIndex}:v]zoompan=z='if(lte(zoom,1.0),1.5,max(1.0,zoom-0.0015))':d=125:x='if(lte(zoom,1.0),iw/2-(iw/zoom/2),x+4)':y='ih/2-(ih/zoom/2)'[v${index}]`
      );
    } else if (panEffect === "zoomin") {
      // zoom in
      filterComplexParts.push(
        `[${imageIndex}:v]zoompan=z='if(lte(zoom,1.5),min(1.5,zoom+0.0015),zoom)':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'[v${index}]`
      );
    } else if (panEffect === "zoomout") {
      // zoom out
      filterComplexParts.push(
        `[${imageIndex}:v]zoompan=z='if(lte(zoom,1.0),1.5,max(1.0,zoom-0.0015))':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'[v${index}]`
      );
    } else {
      // Static effect (no pan)
      filterComplexParts.push(
        `[${imageIndex}:v]zoompan=z='if(lte(zoom,2.0),2,max(2.0,zoom-0.0015))':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'[v${index}]`
      );
    }

    filterConcat += `[v${index}][${index}:a]`;
  });

  // Generate filter_complex string for each image and its corresponding audio
  const filterComplex = `${filterComplexParts.join(
    ";"
  )};${filterConcat}concat=n=${imageFiles.length}:v=1:a=1[outv][outa]`;

  return {
    inputs,
    filterComplex,
  };
};

const { inputs, filterComplex } = generateFilterComplex();

const ffmpegArgs = [
  "-y", // Overwrite output file if exists
  ...inputs.flatMap((input) => input.split(" ")),
  "-filter_complex",
  filterComplex,
  "-map",
  "[outv]",
  "-map",
  "[outa]",
  "-s",
  "1920x1080", // Set output resolution to 1920x1080
  "-c:v",
  "libx264", // Output video codec
  "-preset",
  "slow", // Adjust encoding speed/quality
  "-crf",
  "18", // Set constant rate factor for quality (lower means better quality)
  "-c:a",
  "aac", // Output audio codec (AAC)
  "-strict",
  "experimental", // Experimental AAC encoder
  "-b:a",
  "192k", // Bitrate for audio
  videoFilePath, // Output video file path
];

console.log("Running FFmpeg with arguments: ", ffmpegArgs.join(" "));

const ffmpeg = spawn("ffmpeg", ffmpegArgs);

// Capture and log standard output and error streams
ffmpeg.stdout.on("data", (data) => {
  console.log(`FFmpeg stdout: ${data}`);
});

ffmpeg.stderr.on("data", (data) => {
  console.error(`FFmpeg stderr: ${data}`);
});

ffmpeg.on("error", (err) => {
  parentPort.postMessage({ error: err.message });
});

ffmpeg.on("close", (code) => {
  if (code === 0) {
    parentPort.postMessage({ videoFilePath });
  } else {
    parentPort.postMessage({ error: `FFmpeg exited with code ${code}` });
  }
});
