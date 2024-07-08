// pages/auth.js
import { useEffect } from "react";
import "./globals.css";

export default function Auth() {
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/oauth2callback`;
    const scope = "https://www.googleapis.com/auth/youtube.upload";
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;

    window.location.href = authUrl;
  }, []);

  return (
    <div className="flex justify-center text-center items-center h-screen">
      <div className="text-5xl font-bold">Redirecting to Google...</div>
    </div>
  );
}
