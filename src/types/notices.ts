export interface Notice {
  id: number;
  title: string;
  content: string;
  important: boolean;
  projectId: number;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeListQuery {
  projectId: string | number;
  page?: number;
  limit?: number;
  title?: string;
  important?: boolean;
}

export interface NoticeListData {
  notices: Notice[] | null; // null when no data
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NoticeListResponse {
  result: boolean;
  data: NoticeListData;
}

export interface NoticeResponse {
  result: boolean;
  data: Notice;
}

