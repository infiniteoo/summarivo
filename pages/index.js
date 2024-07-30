import { useState, useEffect } from "react";
import Toolbar from "../components/Toolbar";
import Articles from "../components/Articles";
import YouTubeAuth from "../components/YouTubeAuth";
import withSession from "@/lib/session";
import StatusBar from "@/components/StatusBar";

import "./globals.css";
import TikTokAuth from "@/components/TikTokAuth";

const Home = ({ message }) => {
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [currentPage, setCurrentPage] = useState("articles");
  const [youTubeAuthenticated, setYouTubeAuthenticated] = useState(false);

  useEffect(() => {
    if (message) {
      setYouTubeAuthenticated(true);
    } else {
      checkYouTubeAuthentication();
    }
  }, []);

  const checkYouTubeAuthentication = async () => {
    const response = await fetch("/api/check-youtube-auth");
    const result = await response.json();
    setYouTubeAuthenticated(result.authenticated);
  };

  return (
    <div className="main-container">
      <Toolbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="content-area">
        {currentPage === "articles" && (
          <>
            <StatusBar youTubeAuthenticated={youTubeAuthenticated} />
            <Articles
              autoGenerate={autoGenerate}
              hideCompleted={hideCompleted}
              setHideCompleted={setHideCompleted}
              setAutoGenerate={setAutoGenerate}
            />
          </>
        )}
        {currentPage === "youtube-auth" && <YouTubeAuth />}
        {currentPage === "tiktok-auth" && <TikTokAuth />}
      </div>
    </div>
  );
};

export default Home;

export const getServerSideProps = withSession(async ({ req, res }) => {
  const message = req.session.get("message") || null;
  // Clear the message from the session after retrieving it
  req.session.set("message", null);
  await req.session.save();
  return { props: { message } };
});
