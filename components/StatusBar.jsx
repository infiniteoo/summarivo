import { useState, useEffect } from "react";

const StatusBar = ({ youTubeAuthenticated }) => {
  const [twitterAuthenticated, setTwitterAuthenticated] = useState(false);
  const [facebookAuthenticated, setFacebookAuthenticated] = useState(false);
  const [tikTokAuthenticated, setTikTokAuthenticated] = useState(false);

  useEffect(() => {
    /* checkTwitterAuthentication();
    checkFacebookAuthentication();
    checkTikTokAuthentication(); */
  }, []);

  const checkTwitterAuthentication = async () => {
    // Replace with actual API call
    const response = await fetch("/api/check-twitter-auth");
    const result = await response.json();
    setTwitterAuthenticated(result.authenticated);
  };

  const checkFacebookAuthentication = async () => {
    // Replace with actual API call
    const response = await fetch("/api/check-facebook-auth");
    const result = await response.json();
    setFacebookAuthenticated(result.authenticated);
  };

  const checkTikTokAuthentication = async () => {
    // Replace with actual API call
    const response = await fetch("/api/check-tiktok-auth");
    const result = await response.json();
    setTikTokAuthenticated(result.authenticated);
  };

  return (
    <div className="flex space-x-4 p-4 bg-gray-800 text-white float-right">
      <StatusItem name="YouTube" authenticated={youTubeAuthenticated} />
      <StatusItem name="Twitter" authenticated={twitterAuthenticated} />
      <StatusItem name="Facebook" authenticated={facebookAuthenticated} />
      <StatusItem name="TikTok" authenticated={tikTokAuthenticated} />
    </div>
  );
};

const StatusItem = ({ name, authenticated }) => {
  return (
    <div className="flex items-center space-x-2">
      <div
        className={`h-4 w-4 rounded-full ${
          authenticated ? "bg-green-500" : "bg-red-500"
        } animate-pulse`}
      ></div>
      <span>{name}</span>
    </div>
  );
};

export default StatusBar;
