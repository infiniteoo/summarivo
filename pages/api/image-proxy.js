import fetch from "node-fetch";

const imageProxyHandler = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    res.status(400).send("Image URL is required");
    return;
  }

  try {
    const response = await fetch(url);
    const buffer = await response.buffer();

    res.setHeader("Content-Type", response.headers.get("content-type"));
    res.send(buffer);
  } catch (error) {
    res.status(500).send("Error fetching the image");
  }
};

export default imageProxyHandler;
