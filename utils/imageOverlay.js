// utils/imageOverlay.js
const path = require("path");
const sharp = require("sharp");

async function overlayTextOnImage(
  imagePath,
  leadText,
  summaryText,
  outputImagePath
) {
  try {
    const inputImagePath = imagePath;
    const outputFullPath = outputImagePath;

    console.log("Input Image Path:", inputImagePath);
    console.log("Output Image Path:", outputFullPath);
    console.log("Lead Text:", leadText);
    console.log("Summary Text:", summaryText);

    const image = sharp(inputImagePath);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    const leadFontSize = Math.floor(width / 8.5);
    const summaryFontSize = Math.floor((width / 25) * 2); // Increased by 50%
    const leadPositionX = Math.floor(width * 0.03);
    const leadPositionY = Math.floor(height * 0.2);
    const summaryPositionX = width - Math.floor(width * 0.03); // Adjusting to right side
    const summaryPositionY = Math.floor(height * 0.6); // Adjusting to bottom

    console.log("Lead Font Size:", leadFontSize);
    console.log("Summary Font Size:", summaryFontSize);

    const leadSvgImage = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style="stop-color:yellow;stop-opacity:1" />
            <stop offset="100%" style="stop-color:white;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feOffset result="offOut" in="SourceAlpha" dx="4" dy="4" />
            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="4" />
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>
        </defs>
        <text x="${leadPositionX}" y="${leadPositionY}" font-size="${leadFontSize}" font-weight="bold" fill="url(#gradient)" stroke="black" stroke-width="4" font-family="Verdana" text-anchor="start" filter="url(#shadow)">
          ${leadText}
        </text>
      </svg>
    `;

    const summarySvgLines = summaryText
      .split(" ")
      .reduce((acc, word, index) => {
        if (index % 2 === 0) acc.push([]);
        acc[acc.length - 1].push(word);
        return acc;
      }, [])
      .map((line) => line.join(" "));

    const summarySvgImage = `
      <svg width="${width}" height="${height}">
        <defs>
          <filter id="summaryShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feOffset result="offOut" in="SourceAlpha" dx="7" dy="7" />
            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="4" />
            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
          </filter>
        </defs>
        <text x="${summaryPositionX}" y="${summaryPositionY}" font-size="${summaryFontSize}" font-weight="bold" fill="white" stroke="black" stroke-width="2" font-family="Verdana" text-anchor="end" filter="url(#summaryShadow)">
          ${summarySvgLines
            .map(
              (line, i) =>
                `<tspan x="${summaryPositionX}" dy="${
                  i === 0 ? 0 : 1.2
                }em">${line}</tspan>`
            )
            .join("")}
        </text>
      </svg>
    `;

    console.log("Lead SVG:", leadSvgImage);
    console.log("Summary SVG:", summarySvgImage);

    const leadSvgBuffer = Buffer.from(leadSvgImage);
    const summarySvgBuffer = Buffer.from(summarySvgImage);

    await image
      .composite([
        { input: leadSvgBuffer, gravity: "northwest" },
        { input: summarySvgBuffer, gravity: "southeast" },
      ])
      .toFile(outputFullPath);

    console.log("Text overlay applied successfully");
    return outputFullPath;
  } catch (err) {
    console.error("Error applying text overlay:", err);
    throw err;
  }
}

module.exports = { overlayTextOnImage };
