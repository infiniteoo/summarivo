import { useState, useEffect } from "react";
import "./globals.css";

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [expandedArticle, setExpandedArticle] = useState(null);

  const fetchNewsHeadlines = async () => {
    const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEXT_PUBLIC_NEWSAPI_API_KEY}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const articles = data.articles;

      for (const article of articles) {
        await fetch("/api/articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(article),
        });
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
      setArticles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching saved articles:", error);
      setArticles([]);
    }
  };

  useEffect(() => {
    const initializeArticles = async () => {
      await fetchNewsHeadlines();
      await fetchSavedArticles();
    };

    initializeArticles();
    const interval = setInterval(fetchNewsHeadlines, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const handleExpandArticle = (index) => {
    setExpandedArticle(index === expandedArticle ? null : index);
  };

  const handlePublishToVideo = (article) => {
    console.log("Publishing article to video:", article);
    // Implement your logic to publish to video
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">News Headlines</h1>
      <ul>
        {articles.map((article, index) => (
          <li key={index} className="mb-4">
            <div
              onClick={() => handleExpandArticle(index)}
              className="cursor-pointer"
            >
              <h2 className="text-xl font-semibold">{article.title}</h2>
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
                  <img
                    src={article.urlToImage}
                    alt={article.title}
                    className="mt-2 w-full"
                  />
                )}
                <p className="mt-2">
                  <strong>Published At:</strong>{" "}
                  {new Date(article.publishedAt).toLocaleString()}
                </p>
                <p className="mt-2">
                  <strong>Content:</strong> {article.content}
                </p>
                <button
                  onClick={() => handlePublishToVideo(article)}
                  className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Publish to Video
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
