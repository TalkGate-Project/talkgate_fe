import { apiClient } from "@/lib/apiClient";

export type UnconnectedCustomersResponse = {
  result: true;
  data: {
    customers: Array<{ id: number; name: string; contact1?: string; contact2?: string; assignedMember?: Record<string, unknown> }>;
    total: number;
  };
};

export const ConversationsService = {
  linkCustomer(params: { conversationId: number | string; projectId: string; customerId: number }) {
    return apiClient.patch<unknown>(`/v1/conversations/${params.conversationId}/customer`, { customerId: params.customerId }, {
      headers: { "x-project-id": params.projectId },
    });
  },
  unlinkCustomer(params: { conversationId: number | string; projectId: string }) {
    return apiClient.delete<unknown>(`/v1/conversations/${params.conversationId}/customer`, {
      headers: { "x-project-id": params.projectId },
    });
  },
  close(params: { conversationId: number | string; projectId: string }) {
    return apiClient.patch<unknown>(`/v1/conversations/close/${params.conversationId}`, {}, {
      headers: { "x-project-id": params.projectId },
    });
  },
  listUnconnectedCustomers(params: { projectId: string; search?: string; page?: number; limit?: number }) {
    const { projectId, search, page = 1, limit = 20 } = params;
    return apiClient.get<UnconnectedCustomersResponse>(`/v1/conversations/customers/unconnected`, {
      query: { search, page, limit },
      headers: { "x-project-id": projectId },
    });
  },
};


