// pages/api/oauth2callback.js
import { google } from "googleapis";
import withSession from "@/lib/session";

async function handler(req, res) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["host"];
  const redirectUri = `${protocol}://${host}/api/oauth2callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    redirectUri
  );

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is missing" });
  }

  console.log("Authorization code received:", code);
  console.log("Client ID:", process.env.YOUTUBE_CLIENT_ID);
  console.log("Client Secret:", process.env.YOUTUBE_CLIENT_SECRET);
  console.log("Redirect URI:", redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log("Tokens obtained:", tokens);

    // Store the tokens in the session
    req.session.set("tokens", tokens);
    await req.session.save();

    // Store a message in the session
    req.session.set("message", "YouTube Authenticated.");
    await req.session.save();

    // Redirect to the upload page
    res.redirect("/"); // was originally "/upload"
  } catch (error) {
    console.error(
      "Error during token exchange:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to exchange authorization code for tokens",
      details: error.message,
    });
  }
}

export default withSession(handler);
