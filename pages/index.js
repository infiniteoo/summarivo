import { useState } from "react";
import "./globals.css";
import Toolbar from "../components/Toolbar";
import Articles from "../components/Articles";
import YouTubeAuth from "../components/YouTubeAuth";

const Home = () => {
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [currentPage, setCurrentPage] = useState("articles");

  return (
    <div className="main-container">
      <Toolbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {currentPage === "articles" && (
        <Articles
          autoGenerate={autoGenerate}
          setAutoGenerate={setAutoGenerate}
        />
      )}
      {currentPage === "youtube-auth" && <YouTubeAuth />}
    </div>
  );
};

export default Home;
