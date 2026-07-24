// 뉴스 도메인 타입 — GET /v1/news (커서 기반 무한스크롤)

export interface NewsArticle {
  id: number;
  title: string;
  description: string;
  link: string;
  publisher: string;
  pubDate: string; // ISO string
}

export interface NewsListQuery {
  limit?: number;
  cursor?: number;
}

export interface NewsListResult {
  articles: NewsArticle[];
  nextCursor: number | null;
  hasMore: boolean;
}
