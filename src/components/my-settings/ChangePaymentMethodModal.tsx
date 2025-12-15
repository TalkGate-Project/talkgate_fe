"use client";

import { useState } from "react";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

interface ChangePaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: PaymentMethodData) => void;
  currentBillingInfo?: {
    email?: string;
    cardholderName?: string;
    cardNumber?: string;
    expiryDate?: string;
    cvc?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface PaymentMethodData {
  email: string;
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  country: string;
  postalCode: string;
  agreeToTerms: boolean;
}

export default function ChangePaymentMethodModal({
  isOpen,
  onClose,
  onConfirm,
  currentBillingInfo,
}: ChangePaymentMethodModalProps) {
  const [formData, setFormData] = useState<PaymentMethodData>({
    email: currentBillingInfo?.email || "",
    cardholderName: currentBillingInfo?.cardholderName || "",
    cardNumber: currentBillingInfo?.cardNumber?.replace(/\s/g, "") || "",
    expiryMonth: currentBillingInfo?.expiryDate?.split("/")[0] || "",
    expiryYear: currentBillingInfo?.expiryDate?.split("/")[1] || "",
    cvc: currentBillingInfo?.cvc || "",
    country: currentBillingInfo?.country || "대한민국",
    postalCode: currentBillingInfo?.postalCode || "",
    agreeToTerms: false,
  });

  const handleClose = () => {
    setFormData({
      email: currentBillingInfo?.email || "",
      cardholderName: currentBillingInfo?.cardholderName || "",
      cardNumber: currentBillingInfo?.cardNumber?.replace(/\s/g, "") || "",
      expiryMonth: currentBillingInfo?.expiryDate?.split("/")[0] || "",
      expiryYear: currentBillingInfo?.expiryDate?.split("/")[1] || "",
      cvc: currentBillingInfo?.cvc || "",
      country: currentBillingInfo?.country || "대한민국",
      postalCode: currentBillingInfo?.postalCode || "",
      agreeToTerms: false,
    });
    onClose();
  };

  const handleConfirm = () => {
    if (!formData.email || !formData.cardholderName || !formData.cardNumber || !formData.expiryMonth || !formData.expiryYear || !formData.cvc || !formData.postalCode) {
      showErrorModal({
        title: "알림",
        headline: "모든 필드를 입력해주세요.",
        description: "",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      return;
    }
    if (!formData.agreeToTerms) {
      showErrorModal({
        title: "알림",
        headline: "약관에 동의해주세요.",
        description: "",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
      return;
    }
    onConfirm(formData);
    handleClose();
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 16);
    setFormData({ ...formData, cardNumber: value });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (value.length <= 2) {
      setFormData({ ...formData, expiryMonth: value, expiryYear: "" });
    } else {
      const month = value.slice(0, 2);
      const year = value.slice(2, 4);
      setFormData({ ...formData, expiryMonth: month, expiryYear: year });
    }
  };

  const formatExpiry = (month: string, year: string) => {
    if (!month && !year) return "";
    if (!year) return month;
    return `${month} / ${year}`;
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 3);
    setFormData({ ...formData, cvc: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-[#000000CC]" onClick={handleClose} />

      {/* Modal */}
      <div
        className="relative w-[524px] bg-card dark:bg-neutral-10 rounded-[14px]"
        style={{ filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-6">
          <h2 className="text-[18px] font-semibold text-foreground">결제수단 변경</h2>
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="#B0B0B0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-7 pb-7">
          {/* Forms */}
          <div className="space-y-[10px] mb-6">
            {/* 이메일 정보 */}
            <div className="space-y-2">
              <label className="block text-[13px] text-neutral-60">이메일 정보</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                placeholder="이메일을 입력하세요"
              />
            </div>

            {/* 카드 소유자 이름 */}
            <div className="space-y-2">
              <label className="block text-[13px] text-neutral-60">카드 소유자 이름</label>
              <input
                type="text"
                value={formData.cardholderName}
                onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
                className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                placeholder="카드 소유자 이름을 입력하세요"
              />
            </div>

            {/* 카드 정보 */}
            <div className="space-y-2">
              <label className="block text-[13px] text-neutral-60">카드 정보</label>
              <div className="relative">
                <input
                  type="text"
                  value={formatCardNumber(formData.cardNumber)}
                  onChange={handleCardNumberChange}
                  className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                  placeholder="1234 1234 1234 1234"
                  maxLength={19}
                />
                {/* 카드 브랜드 아이콘 */}
                {formData.cardNumber.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* VISA */}
                    <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className="flex-shrink-0">
                      <rect width="24" height="16" rx="1" fill="white" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5"/>
                      <rect x="1" y="5" width="22" height="6" fill="#171E6C"/>
                    </svg>
                    {/* Mastercard */}
                    <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className="flex-shrink-0">
                      <rect width="24" height="16" rx="1" fill="#252525"/>
                      <circle cx="9" cy="8" r="3" fill="#EB001B"/>
                      <circle cx="15" cy="8" r="3" fill="#F79E1B"/>
                      <path d="M10 8C10 6.895 10.895 6 12 6C13.105 6 14 6.895 14 8C14 9.105 13.105 10 12 10C10.895 10 10 9.105 10 8Z" fill="#FF5F00"/>
                    </svg>
                    {/* Discover */}
                    <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className="flex-shrink-0">
                      <rect width="24" height="16" rx="1" fill="white" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5"/>
                      <rect x="12.6" y="11.7" width="11.4" height="4.3" fill="#F27712"/>
                      <rect x="0.8" y="6.1" width="22.4" height="3.7" fill="#000000"/>
                      <rect x="10.8" y="6.1" width="2.8" height="3.7" fill="#F27712"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* 만료기간 및 보안코드 */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-[4px]">
                <label className="block text-[13px] text-neutral-60">만료기간</label>
                <input
                  type="text"
                  value={formatExpiry(formData.expiryMonth, formData.expiryYear)}
                  onChange={handleExpiryChange}
                  className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-neutral-60 focus:outline-none focus:border-foreground"
                  placeholder="MM / YY"
                  maxLength={7}
                />
              </div>
              <div className="flex-1 space-y-[4px]">
                <label className="block text-[13px] text-neutral-60">보안코드</label>
                <input
                  type="text"
                  value={formData.cvc}
                  onChange={handleCvcChange}
                  className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-neutral-60 focus:outline-none focus:border-foreground"
                  placeholder="CVC"
                  maxLength={3}
                />
              </div>
            </div>

            {/* 청구주소 */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <label className="block text-[13px] text-neutral-60">청구주소</label>
                <div className="relative">
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground appearance-none cursor-pointer pr-8"
                  >
                    <option value="대한민국">대한민국</option>
                    <option value="미국">미국</option>
                    <option value="일본">일본</option>
                    <option value="중국">중국</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="#000000"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="block text-[13px] text-neutral-60">우편번호</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, "") })}
                  className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                  placeholder="00000"
                />
              </div>
            </div>
          </div>

          {/* 약관 동의 */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                className="mt-0.5 w-5 h-5 border border-neutral-50 rounded-[5px] cursor-pointer flex-shrink-0"
              />
              <span className="text-[13px] text-neutral-70 leading-[16px]">
                이용약관에 명시된 바에 따라 요금이 변경될 수 있으며, 구독은 언제든지 취소 가능합니다. 구독함으로써, 당사의{" "}
                <a href="#" className="underline text-foreground">이용약관</a> 및{" "}
                <strong className="font-semibold text-foreground">개인정보 처리 방침</strong>에 동의하는 것으로 간주하며, 서비스 갱신 및 기타 구매를 위해 고객님의 결제 방법을 저장하는 권한을 당사에 부여하는 것에 동의합니다.
              </span>
            </label>
          </div>
        </div>

        {/* Divider - 패딩/마진 없이 전체 너비 */}
        <div className="w-full h-[1px] bg-border"></div>

        {/* Action Buttons */}
        <div className="px-7 py-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 border border-neutral-30 rounded-[5px] text-[14px] font-semibold text-foreground tracking-[-0.02em] hover:bg-neutral-10 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="px-3 py-1.5 bg-neutral-90 text-white dark:text-neutral-0 rounded-[5px] text-[14px] font-semibold tracking-[-0.02em] hover:bg-neutral-80 transition-colors cursor-pointer"
            >
              변경하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

