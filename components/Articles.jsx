import React, { useState, useEffect } from "react";
import Image from "next/image";

const Articles = ({ autoGenerate, setAutoGenerate }) => {
  const [articles, setArticles] = useState([]);
  const [expandedArticle, setExpandedArticle] = useState(null);

  const fetchNewsHeadlines = async () => {
    const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEXT_PUBLIC_NEWSAPI_API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const articles = data.articles.reverse();
      console.log("Fetched news articles:", articles);

      for (const newArticle of articles) {
        if (
          newArticle.title !== null ||
          newArticle.title !== undefined ||
          newArticle.title !== "[Removed]" ||
          newArticle.title !== "[removed]"
        ) {
          console.log("Saving article:", newArticle);
          await fetch("/api/articles", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ newArticle, autoGenerate }),
          });
        }
      }

      fetchSavedArticles();
    } catch (error) {
      console.error("Error fetching news articles:", error);
    }
  };

  const fetchSavedArticles = async () => {
    try {
      const response = await fetch("/api/articles");
      const data = await response.json();
      setArticles(Array.isArray(data.reverse()) ? data : []);
    } catch (error) {
      console.error("Error fetching saved articles:", error);
      setArticles([]);
    }
  };

  useEffect(() => {
    const initializeArticles = async () => {
      if (autoGenerate) {
        await fetchNewsHeadlines();
      }
      await fetchSavedArticles();
    };

    initializeArticles();
    const interval = setInterval(fetchNewsHeadlines, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoGenerate]);

  const handleExpandArticle = (index) => {
    setExpandedArticle(index === expandedArticle ? null : index);
  };
  const handleUploadVideo = (article) => {
    console.log("Uploading video for article:", article);
    fetch("/api/upload-from-front-end", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(article),
    });
  };

  const handlePublishToVideo = (article) => {
    console.log("Publishing article to video:", article);
    fetch("/api/generate-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(article),
    });
  };

  const handleDeleteArticle = async (article) => {
    try {
      await fetch(`/api/articles?url=${encodeURIComponent(article.url)}`, {
        method: "DELETE",
      });
      fetchSavedArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
    }
  };

  const handleAutoGenerateToggle = () => {
    setAutoGenerate(!autoGenerate);
  };

  return (
    <div className="">
      <h1 className="text-3xl font-bold mb-6">News Headlines</h1>
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={autoGenerate}
            onChange={handleAutoGenerateToggle}
            className="mr-2"
          />
          Auto-generate videos
        </label>
      </div>
      <ul>
        {articles.map((article, index) => (
          <li
            key={index}
            className={`mb-4 border border-gray-700 rounded-lg p-4 ${
              expandedArticle === index ? "bg-gray-800" : "bg-gray-900"
            } hover:bg-gray-800 transition-colors`}
          >
            <div
              onClick={() => handleExpandArticle(index)}
              className="cursor-pointer flex justify-between items-center"
            >
              <h2 className="text-xl font-semibold">{article.title}</h2>
              <span className="text-2xl font-bold">
                {expandedArticle === index ? "-" : "+"}
              </span>
            </div>
            {expandedArticle === index && (
              <div className="mt-2">
                <p>
                  <strong>Source:</strong> {article.source.name}
                </p>
                <p>
                  <strong>Author:</strong> {article.author}
                </p>
                <p>
                  <strong>Description:</strong> {article.description}
                </p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400"
                >
                  Read more
                </a>
                {article.urlToImage && (
                  <Image
                    src={`/api/image-proxy?url=${encodeURIComponent(
                      article.urlToImage
                    )}`}
                    alt={article.title}
                    width={600}
                    height={400}
                    className="mt-2"
                  />
                )}
                <p className="mt-2">
                  <strong>Published At:</strong>{" "}
                  {new Date(article.publishedAt).toLocaleString()}
                </p>
                <p className="mt-2">
                  <strong>Content:</strong> {article.content}
                </p>
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handlePublishToVideo(article)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Publish to Video
                  </button>
                  <button
                    onClick={() => handleUploadVideo(article)}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Upload Video
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(article)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Delete Article
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Articles;
