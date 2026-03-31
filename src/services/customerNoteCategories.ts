import { apiClient } from "@/lib/apiClient";
import type {
  CustomerNoteCategory,
  CustomerNoteCategoriesListResponse,
} from "@/types/customerNoteCategories";

// Re-export types for convenience
export type { CustomerNoteCategory } from "@/types/customerNoteCategories";

export function normalizeCustomerNoteCategory(input: unknown): CustomerNoteCategory | null {
  if (!input || typeof input !== "object") return null;

  const category = input as CustomerNoteCategory & { color?: string | null };
  return {
    ...category,
    colorCode: category.colorCode ?? category.color ?? undefined,
  };
}

export function normalizeCustomerNoteCategories(input: unknown): CustomerNoteCategory[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((category) => normalizeCustomerNoteCategory(category))
    .filter((category): category is CustomerNoteCategory => !!category);
}

export const CustomerNoteCategoriesService = {
  list(headers?: Record<string, string>) {
    return apiClient.get<CustomerNoteCategoriesListResponse>("/v1/customer-note-categories", headers ? { headers } : undefined);
  },
  create(payload: Record<string, unknown>, headers?: Record<string, string>) {
    return apiClient.post<{ result: true; data: CustomerNoteCategory }>("/v1/customer-note-categories", payload, headers ? { headers } : undefined);
  },
  update(id: string, payload: Record<string, unknown>, headers?: Record<string, string>) {
    return apiClient.patch<{ result: true; data: CustomerNoteCategory }>(`/v1/customer-note-categories/${id}`, payload, headers ? { headers } : undefined);
  },
  remove(id: string, headers?: Record<string, string>) {
    return apiClient.delete<{ result: true }>(`/v1/customer-note-categories/${id}`, headers ? { headers } : undefined);
  },
};
