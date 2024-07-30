# Summarivo

Welcome to Summarivo, an innovative and fully automated YouTube video creator powered by generative AI. Summarivo takes the latest news, generates summaries, and produces videos that are automatically uploaded to YouTube. This project leverages a combination of cutting-edge technologies, including NewsApi.org, OpenAI, Amazon Polly, and FFmpeg.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

Summarivo automates the entire process of creating and uploading YouTube videos based on the latest news. Here's how it works:

1. **News Retrieval**: Fetches the top 25 current news stories from [NewsApi.org](https://newsapi.org/).
2. **Article Scraping**: Extracts the full text of each news article.
3. **Content Summarization**: Uses [OpenAI](https://openai.com/) to summarize the article into a concise script.
4. **Voice Over Creation**: Generates voice-over audio using [Amazon Polly](https://aws.amazon.com/polly/).
5. **Image Generation**: Creates images using OpenAI's image generation capabilities and custom Google image searches.
6. **Video Production**: Combines audio and images using [FFmpeg](https://ffmpeg.org/) to produce the final video.
7. **Automatic Upload**: Uploads the generated video to YouTube.

## Features

- **Fully Automated**: From news retrieval to video upload, the entire process is automated.
- **Real-Time News**: Stays updated with the latest news stories.
- **AI-Powered Summarization**: Uses state-of-the-art AI to generate concise and informative summaries.
- **High-Quality Voice Over**: Utilizes Amazon Polly for natural-sounding voice synthesis.
- **Custom Visuals**: Generates relevant images to accompany the script.
- **Seamless Integration**: Automatically uploads videos to YouTube.

## Tech Stack

- **Frontend**: Next.js
- **Backend**: Node.js
- **APIs**: NewsApi.org, OpenAI, Amazon Polly, Google Custom Search
- **Media Processing**: FFmpeg
- **Database**: MongoDB (optional, for storing video metadata)

## Setup and Installation

To set up the project locally, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/summarivo.git
   cd summarivo
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Variables: Create a .env file in the root directory and set the following variables:**:

   ```NEWS_API_KEY=your_newsapi_key
   OPENAI_API_KEY=your_openai_key
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_custom_search_api_key
   YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. **Run the development server:**:

   ```npm run dev

   ```

5. **Build for production:**:
   ```npm run build
   npm start
   ```

## Usage

Once the project is set up, Summarivo will automatically fetch the latest news, generate summaries, and create videos. You can configure the frequency of news updates and video uploads in the settings.

## Configuration

You can customize various aspects of Summarivo by modifying the configuration files and environment variables. Key configurations include:

- **News Sources**: Specify preferred news sources in the NewsApi.org settings.
- **Voice Over Language**: Choose from various voices and languages supported by Amazon Polly.
- **Image Sources**: Configure Google Custom Search for specific image categories.
- **Video Settings**: Adjust video resolution, frame rate, and other parameters in the FFmpeg settings.

## Contributing

We welcome contributions to Summarivo! If you'd like to contribute, please fork the repository and create a pull request with your changes. For major changes, please open an issue first to discuss what you would like to add.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
