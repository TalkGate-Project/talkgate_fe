"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clampColumnWidth,
  getCustomerColumnDefinitions,
  type CustomerColumnDefinition,
  type CustomerColumnKey,
  type CustomerTableVariant,
} from "@/components/customers/customerTableColumns";

// 로그아웃 시 `tg_` 접두어 localStorage 항목이 일괄 삭제되므로(auth-utils clearSession),
// 계정별로 남겨야 하는 이 설정은 `tg_`가 아닌 접두어를 쓴다. 키에 userId가 들어가 계정 간에 섞이지 않는다.
const STORAGE_KEY_PREFIX = "talkgate-customer-table-columns";
const STORAGE_VERSION = 1;

type ColumnWidths = Partial<Record<CustomerColumnKey, number>>;

export type CustomerTableColumnSettings = {
  order: CustomerColumnKey[];
  hidden: CustomerColumnKey[];
  /** null이면 기본 너비 비율로 표 폭을 채운다. 한 번이라도 조정하면 px 고정 */
  widths: ColumnWidths | null;
};

type StoredSettings = CustomerTableColumnSettings & { version: number };

function buildStorageKey(userId: number, variant: CustomerTableVariant): string {
  return `${STORAGE_KEY_PREFIX}:v${STORAGE_VERSION}:${userId}:${variant}`;
}

function buildDefaultSettings(variant: CustomerTableVariant): CustomerTableColumnSettings {
  return {
    order: getCustomerColumnDefinitions(variant).map((column) => column.key),
    hidden: [],
    widths: null,
  };
}

/** 저장값을 현재 열 정의에 맞춘다. 없어진 열은 버리고, 새로 생긴 열은 기본 위치 근처에 끼워 넣는다 */
function normalizeSettings(
  variant: CustomerTableVariant,
  raw: Partial<StoredSettings>
): CustomerTableColumnSettings {
  const definitions = getCustomerColumnDefinitions(variant);
  const definitionByKey = new Map(definitions.map((column) => [column.key, column]));

  const storedOrder = Array.isArray(raw.order)
    ? raw.order.filter((key, index, list) => definitionByKey.has(key) && list.indexOf(key) === index)
    : [];
  const order = [...storedOrder];
  definitions.forEach((column, defaultIndex) => {
    if (order.includes(column.key)) return;
    const previousKey = definitions[defaultIndex - 1]?.key;
    const insertAt = previousKey ? order.indexOf(previousKey) + 1 : 0;
    order.splice(insertAt, 0, column.key);
  });

  const hidden = Array.isArray(raw.hidden)
    ? raw.hidden.filter((key) => definitionByKey.get(key)?.hideable)
    : [];

  let widths: ColumnWidths | null = null;
  if (raw.widths && typeof raw.widths === "object") {
    widths = {};
    definitions.forEach((column) => {
      const value = (raw.widths as ColumnWidths)[column.key];
      widths![column.key] =
        typeof value === "number" && Number.isFinite(value)
          ? clampColumnWidth(column, value)
          : column.defaultWidth;
    });
  }

  return { order, hidden, widths };
}

function readSettings(storageKey: string, variant: CustomerTableVariant): CustomerTableColumnSettings {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return buildDefaultSettings(variant);
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    if (!parsed || typeof parsed !== "object" || parsed.version !== STORAGE_VERSION) {
      return buildDefaultSettings(variant);
    }
    return normalizeSettings(variant, parsed);
  } catch (error) {
    console.error("Failed to read customer table column settings:", error);
    return buildDefaultSettings(variant);
  }
}

function writeSettings(storageKey: string, settings: CustomerTableColumnSettings) {
  try {
    const stored: StoredSettings = { version: STORAGE_VERSION, ...settings };
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  } catch (error) {
    console.error("Failed to persist customer table column settings:", error);
  }
}

type UseCustomerTableColumnsParams = {
  variant: CustomerTableVariant;
  /** 로그인 계정 id. 없으면 저장하지 않고 기본값만 쓴다 */
  userId?: number;
  /** 계정·프로젝트 유형이 확정되기 전에는 false로 두어 기본값이 잠깐 보이는 깜빡임을 막는다 */
  enabled: boolean;
};

/**
 * 고객목록 테이블의 열 순서·표시 여부·너비 설정. 계정 × 프로젝트 유형(데이터제공자/일반)별로
 * localStorage에 저장한다.
 */
export function useCustomerTableColumns({ variant, userId, enabled }: UseCustomerTableColumnsParams) {
  const storageKey = enabled && userId ? buildStorageKey(userId, variant) : null;
  const sourceKey = enabled ? storageKey ?? `default:${variant}` : null;

  const [state, setState] = useState<{
    sourceKey: string | null;
    settings: CustomerTableColumnSettings;
  }>(() => ({ sourceKey: null, settings: buildDefaultSettings(variant) }));

  useEffect(() => {
    if (!sourceKey) return;
    const settings = storageKey ? readSettings(storageKey, variant) : buildDefaultSettings(variant);
    setState({ sourceKey, settings });
  }, [sourceKey, storageKey, variant]);

  const isReady = sourceKey !== null && state.sourceKey === sourceKey;
  const settings = isReady ? state.settings : buildDefaultSettings(variant);

  const updateSettings = useCallback(
    (updater: (prev: CustomerTableColumnSettings) => CustomerTableColumnSettings) => {
      setState((prev) => {
        if (prev.sourceKey !== sourceKey) return prev;
        const next = updater(prev.settings);
        if (storageKey) writeSettings(storageKey, next);
        return { sourceKey: prev.sourceKey, settings: next };
      });
    },
    [sourceKey, storageKey]
  );

  const definitions = getCustomerColumnDefinitions(variant);
  const orderedColumns = useMemo(() => {
    const definitionByKey = new Map(definitions.map((column) => [column.key, column]));
    return settings.order
      .map((key) => definitionByKey.get(key))
      .filter((column): column is CustomerColumnDefinition => Boolean(column));
  }, [definitions, settings.order]);

  const visibleColumns = useMemo(
    () => orderedColumns.filter((column) => !settings.hidden.includes(column.key)),
    [orderedColumns, settings.hidden]
  );

  const setColumnOrder = useCallback(
    (order: CustomerColumnKey[]) => updateSettings((prev) => ({ ...prev, order })),
    [updateSettings]
  );

  const setColumnVisible = useCallback(
    (key: CustomerColumnKey, visible: boolean) =>
      updateSettings((prev) => {
        const column = definitions.find((item) => item.key === key);
        if (!column?.hideable) return prev;
        const hidden = prev.hidden.filter((hiddenKey) => hiddenKey !== key);
        return { ...prev, hidden: visible ? hidden : [...hidden, key] };
      }),
    [definitions, updateSettings]
  );

  /** 드래그로 바꾼 너비를 저장한다. 기본(비율) 모드였다면 화면에 보이던 너비 전체를 함께 고정한다 */
  const setColumnWidths = useCallback(
    (widths: ColumnWidths) =>
      updateSettings((prev) => {
        const nextWidths: ColumnWidths = {};
        definitions.forEach((column) => {
          const value = widths[column.key] ?? prev.widths?.[column.key] ?? column.defaultWidth;
          nextWidths[column.key] = clampColumnWidth(column, value);
        });
        return { ...prev, widths: nextWidths };
      }),
    [definitions, updateSettings]
  );

  const resetColumnWidth = useCallback(
    (key: CustomerColumnKey) =>
      updateSettings((prev) => {
        if (!prev.widths) return prev;
        const column = definitions.find((item) => item.key === key);
        if (!column) return prev;
        return { ...prev, widths: { ...prev.widths, [key]: column.defaultWidth } };
      }),
    [definitions, updateSettings]
  );

  const resetColumnSettings = useCallback(
    () => updateSettings(() => buildDefaultSettings(variant)),
    [updateSettings, variant]
  );

  return {
    isReady,
    orderedColumns,
    visibleColumns,
    hiddenKeys: settings.hidden,
    widths: settings.widths,
    setColumnOrder,
    setColumnVisible,
    setColumnWidths,
    resetColumnWidth,
    resetColumnSettings,
  };
}

export type CustomerTableColumnsState = ReturnType<typeof useCustomerTableColumns>;
