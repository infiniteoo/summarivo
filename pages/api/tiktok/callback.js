import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";

const handler = async (req = NextApiRequest, res = NextApiResponse) => {
  try {
    console.log("req.query", req.query);
    console.log("req.headers", req.headers);
    const { code, state } = req.query;

    // Verify state matches the csrfState cookie
    const cookies = cookie.parse(req.headers.cookie || "");
    if (state !== cookies.csrfState) {
      throw new Error("Invalid state parameter");
    }

    // Extract the codeVerifier from the cookies
    const codeVerifier = cookies.codeVerifier;

    console.log("Authorization Code:", code);
    console.log("Code Verifier:", codeVerifier);

    // URL decode the authorization code
    const decodedCode = decodeURIComponent(code);

    // Prepare the request parameters
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_ID,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code: decodedCode,
      grant_type: "authorization_code",
      redirect_uri: process.env.TIKTOK_REDIRECT_URI,
      code_verifier: codeVerifier,
    });

    console.log("Request Params:", params.toString());

    // Exchange the authorization code for an access token
    const response = await fetch(
      "https://open.tiktokapis.com/v2/oauth/token/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cache-Control": "no-cache",
        },
        body: params.toString(),
      }
    );

    const data = await response.json();
    console.log("Access Token Response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to exchange code for token");
    }

    // Store the access token and other data as needed
    // ...

    res.status(200).json({ message: "Authorization successful", data });
  } catch (error) {
    console.error("Error in TikTok Callback Handler:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default handler;
