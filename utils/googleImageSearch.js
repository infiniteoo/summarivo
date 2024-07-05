const axios = require("axios");

const fetchGoogleImage = async (query, i) => {
  const apiKey = process.env.NEXT_PUBLIC_SEARCH_API_KEY; // Your Google API key
  const cx = process.env.NEXT_PUBLIC_SEARCH_ENGINE_ID; // Your Custom Search Engine ID

  const url = `https://www.googleapis.com/customsearch/v1?q=${query}&cx=${cx}&key=${apiKey}&searchType=image&num=10`;

  try {
    const response = await axios.get(url);
    const items = response.data.items;
    console.log("items: ", items);

    if (items && items.length > 0) {
      return items[i].link; // Return the URL of the first image
    } else {
      throw new Error("No images found");
    }
  } catch (error) {
    console.error("Error fetching image from Google Custom Search:", error);
    throw error;
  }
};

export { fetchGoogleImage };
