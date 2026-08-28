"use client";

import type { CustomerHeaderIdentityValue } from "./utils";

/**
 * 상세 모달 헤더의 이름·연락처 자리. 데스크톱과 모바일 모달이 같은 마크업을 쓴다.
 *
 * 상세를 아직 못 받았으면 스켈레톤으로 자리만 잡는다. 스켈레톤을 h2 안에 넣어 헤더 높이가
 * 이름이 들어올 때와 같게 유지된다(빈 h2의 strut 높이가 그대로 남는다).
 */
export default function CustomerHeaderIdentity({
  identity,
}: {
  identity: CustomerHeaderIdentityValue;
}) {
  if (identity.isIdentityPending) {
    return (
      <h2 className="text-[18px] font-semibold text-neutral-90 dark:text-neutral-90 whitespace-nowrap">
        <span className="sr-only">고객정보를 불러오는 중입니다</span>
        <span aria-hidden className="inline-flex h-[18px] w-[132px] animate-pulse rounded bg-neutral-20 align-middle" />
        <span aria-hidden className="ml-2 inline-flex h-[14px] w-[104px] animate-pulse rounded bg-neutral-20 align-middle" />
      </h2>
    );
  }

  return (
    <>
      <h2 className="text-[18px] font-semibold text-neutral-90 dark:text-neutral-90 whitespace-nowrap">
        {identity.title}
      </h2>
      {identity.contact && (
        <span className="text-[14px] font-medium text-neutral-60 whitespace-nowrap">
          {identity.contact}
        </span>
      )}
    </>
  );
}
