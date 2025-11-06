import { apiClient } from "@/lib/apiClient";
import { decodeNoticeContent, encodeNoticeContent } from "@/lib/notice";
import type {
  Notice,
  NoticeListData,
  NoticeListQuery,
  NoticeListResponse,
  NoticeResponse,
} from "@/types/notices";

export type CreateNoticePayload = {
  projectId: string | number;
  title: string;
  content: string;
  important?: boolean;
};

export type UpdateNoticePayload = {
  projectId: string | number;
  title?: string;
  content?: string;
  important?: boolean;
};

export const NoticesService = {
  async list(query: NoticeListQuery): Promise<NoticeListData> {
    const { projectId, ...qs } = query;
    const res = await apiClient.get<NoticeListResponse>(`/v1/notices`, {
      query: qs,
      headers: { "x-project-id": String(projectId) },
    });
    const { notices, ...rest } = res.data.data;
    return {
      ...rest,
      notices: notices === null ? null : notices.map((notice) => ({
        ...notice,
        content: decodeNoticeContent(notice.content),
      })),
    };
  },
  async create(payload: CreateNoticePayload): Promise<Notice> {
    const { projectId, content, ...body } = payload;
    const res = await apiClient.post<NoticeResponse>(`/v1/notices`, {
      ...body,
      content: encodeNoticeContent(content),
    }, {
      headers: { "x-project-id": String(projectId) },
    });
    const created = res.data.data;
    return {
      ...created,
      content: decodeNoticeContent(created.content),
    };
  },
  async detail(noticeId: number | string, projectId: string | number): Promise<Notice> {
    const res = await apiClient.get<NoticeResponse>(`/v1/notices/${noticeId}`, {
      headers: { "x-project-id": String(projectId) },
    });
    const data = res.data.data;
    return {
      ...data,
      content: decodeNoticeContent(data.content),
    };
  },
  async update(noticeId: number | string, payload: UpdateNoticePayload): Promise<Notice> {
    const { projectId, content, ...body } = payload;
    const res = await apiClient.patch<NoticeResponse>(`/v1/notices/${noticeId}`, {
      ...body,
      ...(content !== undefined ? { content: encodeNoticeContent(content) } : {}),
    }, {
      headers: { "x-project-id": String(projectId) },
    });
    const data = res.data.data;
    return {
      ...data,
      content: decodeNoticeContent(data.content),
    };
  },
  async remove(noticeId: number | string, projectId: string | number): Promise<void> {
    await apiClient.delete(`/v1/notices/${noticeId}`, {
      headers: { "x-project-id": String(projectId) },
    });
  },
};


