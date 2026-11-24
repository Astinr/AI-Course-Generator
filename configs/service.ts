import "server-only";
import axios from "axios";

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3/search";

export const getYoutubeVideos = async (query: string) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is required to fetch course videos.");
  }

  const param = {
    part: "snippet",
    q: query,
    maxResults: 10,
    type: "video",
    videoEmbeddable: "true",
    key: apiKey,
  };

  const response = await axios.get(YOUTUBE_BASE_URL, { params: param });
  return response.data.items;
};
