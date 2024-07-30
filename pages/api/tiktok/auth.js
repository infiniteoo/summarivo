import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import crypto from "crypto";

function generateRandomString(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function base64urlencode(source) {
  return Buffer.from(source).toString("base64url");
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64urlencode(hash);
}

const generateCodeVerifier = () => {
  return crypto.randomBytes(32).toString("base64url");
};

const handler = async (req, res) => {
  try {
    const clientId = process.env.TIKTOK_CLIENT_ID;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    const scopes = "user.info.basic,video.upload,video.publish";

    if (!clientId || !redirectUri) {
      throw new Error(
        "Client ID or Redirect URI is missing in environment variables"
      );
    }

    console.log("Environment Variables Loaded Successfully");
    console.log("Client ID:", clientId);
    console.log("Redirect URI:", redirectUri);

    const state = Math.random().toString(36).substring(2);
    /* const codeVerifier = generateCodeVerifier(); */
    const codeVerifier = generateRandomString(88);
    /*  const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64"); */
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    console.log("Code Verifier:", codeVerifier);
    console.log("Code Challenge:", codeChallenge);

    const encodedRedirectUri = encodeURIComponent(redirectUri);
    console.log("Encoded Redirect URI:", encodedRedirectUri);

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientId}&response_type=code&scope=${scopes}&redirect_uri=${encodedRedirectUri}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    console.log("Auth URL:", authUrl);

    res.setHeader("Set-Cookie", [
      cookie.serialize("csrfState", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        maxAge: 60 * 1, // 1 minute
        sameSite: "lax",
        path: "/",
      }),
      cookie.serialize("codeVerifier", codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        maxAge: 60 * 10, // 10 minutes
        sameSite: "lax",
        path: "/",
      }),
    ]);

    res.writeHead(302, { Location: authUrl });
    res.end();
  } catch (error) {
    console.error("Error in TikTok Auth Handler:", error.message);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: error.message });
  }
};

export default handler;
