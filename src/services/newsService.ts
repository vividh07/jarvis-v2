import { env } from '../config/env';

const NEWS_API_KEY = env.newsApiKey;
const COUNTRY = env.newsCountry;

const RSS_FEEDS = [
  'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
  'https://feeds.bbci.co.uk/news/world/asia/india/rss.xml',
];

export interface NewsItem {
  title: string;
  source: string;
}

const parseRssTitles = (xml: string, limit: number): NewsItem[] => {
  const items: NewsItem[] = [];
  const titleRegex = /<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/gi;
  let match;
  while ((match = titleRegex.exec(xml)) !== null && items.length < limit) {
    const title = match[1].trim();
    if (title) {
      items.push({ title, source: 'RSS' });
    }
  }
  return items;
};

const fetchNewsFromRss = async (limit: number): Promise<NewsItem[]> => {
  for (const url of RSS_FEEDS) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const xml = await response.text();
      const items = parseRssTitles(xml, limit);
      if (items.length > 0) return items;
    } catch {
      // try next feed
    }
  }
  return [];
};

export const fetchTopNews = async (): Promise<NewsItem[]> => {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=${COUNTRY}&pageSize=3&apiKey=${NEWS_API_KEY}`
    );

    if (response.ok) {
      const data = await response.json();
      const articles = data.articles?.map((a: { title: string; source: { name: string } }) => ({
        title: a.title,
        source: a.source.name,
      }));
      if (articles?.length) return articles;
    }
  } catch (e) {
    console.error('News API error:', e);
  }

  return fetchNewsFromRss(3);
};
