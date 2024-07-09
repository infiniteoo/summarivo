const { google } = require("googleapis");

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.force-ssl",
];

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID,
  process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_YOUTUBE_REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  redirect_uri: process.env.NEXT_PUBLIC_YOUTUBE_REDIRECT_URI,
});

console.log("Authorize this app by visiting this url:", authUrl);

async function getToken(code) {
  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: process.env.NEXT_PUBLIC_YOUTUBE_REDIRECT_URI,
  });
  oauth2Client.setCredentials(tokens);
  console.log("Tokens acquired:", tokens);
  // Store the tokens in the session or database
}

module.exports = { oauth2Client, getToken };
