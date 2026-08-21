"use client";

import Image from "next/image";
import type { AssetItemFormState } from "@/types/debtRelief";

export const ASSET_ICON: Record<AssetItemFormState["category"], string> = {
  house: "/images/debt-relief/assets/home-icon@4x.png",
  land: "/images/debt-relief/assets/land-icon@4x.png",
  jeonse_deposit: "/images/debt-relief/assets/home-icon-2@4x.png",
  vehicle: "/images/debt-relief/assets/car-icon@4x.png",
  financial_asset: "/images/debt-relief/assets/wallet-icon@4x.png",
};

export function AssetIcon({ category }: { category: AssetItemFormState["category"] }) {
  return (
    <Image
      src={ASSET_ICON[category]}
      alt=""
      width={80}
      height={80}
      unoptimized
      className="h-5 w-5 object-contain"
    />
  );
}
