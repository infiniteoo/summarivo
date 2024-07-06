// depreciated
// returns top 5 words from a string of text

export function getTopWords(article, topN = 5) {
  // Remove punctuation and convert to lowercase
  article = article.replace(/[^\w\s]/gi, "").toLowerCase();

  // Split the article into words
  const words = article.split(/\s+/);

  // Count the frequency of each word
  const wordCounts = {};
  words.forEach((word) => {
    if (word) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });

  // Convert the wordCounts object to an array of [word, count] pairs
  const wordCountPairs = Object.entries(wordCounts);

  // Sort the pairs based on the count in descending order
  wordCountPairs.sort((a, b) => b[1] - a[1]);

  // Extract the top N words
  const topWords = wordCountPairs.slice(0, topN).map((pair) => pair[0]);

  // Return the top words as a string
  return topWords.join(", ");
}
