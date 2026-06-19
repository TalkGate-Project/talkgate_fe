import type { StatsFilterValues } from "@/components/stats/StatsFilterModal";

/**
 * 통계 필터 값을 URL 쿼리 파라미터와 상호 변환한다.
 * 탭별 충돌을 막기 위해 prefix(예: "at", "am", "st")로 네임스페이스를 구분한다.
 */

type ParamKey =
  | "Route"
  | "Media"
  | "Site"
  | "AppFrom"
  | "AppTo"
  | "AsgFrom"
  | "AsgTo"
  | "Team"
  | "Member";

const STRING_FIELDS: Array<[ParamKey, keyof StatsFilterValues]> = [
  ["Route", "applicationRoute"],
  ["Media", "mediaCompany"],
  ["Site", "site"],
  ["AppFrom", "applicationDateStart"],
  ["AppTo", "applicationDateEnd"],
  ["AsgFrom", "assignedAtStart"],
  ["AsgTo", "assignedAtEnd"],
];

const NUMBER_FIELDS: Array<[ParamKey, "teamId" | "memberId"]> = [
  ["Team", "teamId"],
  ["Member", "memberId"],
];

export function readStatsFilter(search: URLSearchParams, prefix: string): StatsFilterValues {
  const values: StatsFilterValues = {};

  STRING_FIELDS.forEach(([param, field]) => {
    const raw = search.get(`${prefix}${param}`);
    if (raw) (values as Record<string, unknown>)[field] = raw;
  });

  NUMBER_FIELDS.forEach(([param, field]) => {
    const raw = search.get(`${prefix}${param}`);
    if (raw && /^\d+$/.test(raw)) values[field] = Number(raw);
  });

  return values;
}

export function writeStatsFilter(
  params: URLSearchParams,
  prefix: string,
  values: StatsFilterValues
): void {
  STRING_FIELDS.forEach(([param, field]) => {
    const value = values[field] as string | undefined;
    if (value) params.set(`${prefix}${param}`, value);
    else params.delete(`${prefix}${param}`);
  });

  NUMBER_FIELDS.forEach(([param, field]) => {
    const value = values[field];
    if (typeof value === "number") params.set(`${prefix}${param}`, String(value));
    else params.delete(`${prefix}${param}`);
  });
}
