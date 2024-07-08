import React from "react";

const YouTubeAuth = () => {
  const handleAuthClick = () => {
    window.location.href = "/auth";
  };
  return (
    <div className="content-area">
      <div className="flex justify-center items-center text-center mt-72 overflow-hidden">
        <button
          onClick={handleAuthClick}
          className="bg-blue-500 text-white py-4 px-8 rounded-lg text-2xl hover:bg-blue-400"
        >
          Authenticate with Google
        </button>
      </div>
    </div>
  );
};

export default YouTubeAuth;
