import React from "react";

const Toolbar = ({ currentPage, setCurrentPage }) => {
  return (
    <div className="fixed-toolbar">
      <a
        href="#"
        onClick={() => setCurrentPage("articles")}
        className={`block py-2 px-4 mb-2 text-lg hover:bg-gray-700 ${
          currentPage === "articles" ? "bg-gray-700" : ""
        }`}
      >
        Articles
      </a>
      <a
        href="#"
        onClick={() => setCurrentPage("youtube-auth")}
        className={`block py-2 px-4 mb-2 text-lg hover:bg-gray-700 ${
          currentPage === "youtube-auth" ? "bg-gray-700" : ""
        }`}
      >
        YouTube Auth
      </a>
      <a
        href="#"
        onClick={() => setCurrentPage("tiktok-auth")}
        className={`block py-2 px-4 mb-2 text-lg hover:bg-gray-700 ${
          currentPage === "tiktok-auth" ? "bg-gray-700" : ""
        }`}
      >
        Tiktok Auth
      </a>
    </div>
  );
};

export default Toolbar;
