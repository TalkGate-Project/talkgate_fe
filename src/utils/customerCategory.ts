export const NO_CATEGORY_LABEL = "없음";

export function getCustomerCategoryLabel(name?: string | null): string {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  return normalizedName || NO_CATEGORY_LABEL;
}
