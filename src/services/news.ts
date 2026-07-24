import { apiClient } from "@/lib/apiClient";
import type { ApiSuccessResponse } from "@/types/common";
import type { NewsListQuery, NewsListResult } from "@/types/news";

export const NewsService = {
  // 뉴스 목록 조회 (커서 기반 무한스크롤)
  async list(query?: NewsListQuery): Promise<NewsListResult> {
    const res = await apiClient.get<ApiSuccessResponse<NewsListResult>>("/v1/news", {
      query: query as Record<string, string | number | boolean | null | undefined>,
    });
    return res.data.data;
  },
};

export type { NewsArticle, NewsListQuery, NewsListResult } from "@/types/news";
