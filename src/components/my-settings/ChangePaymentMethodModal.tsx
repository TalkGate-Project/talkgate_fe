"use client";

import { useState } from "react";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

interface ChangePaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: PaymentMethodData) => void;
  isLoading?: boolean;
  currentBillingInfo?: {
    id?: number;
    buyerEmail?: string;
    buyerName?: string;
    buyerTel?: string;
  };
}

export interface PaymentMethodData {
  cardNo: string;
  expMonth: string;
  expYear: string;
  idNo: string;
  cardPw: string;
  buyerName: string;
  buyerEmail: string;
  buyerTel: string;
}

export default function ChangePaymentMethodModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  currentBillingInfo,
}: ChangePaymentMethodModalProps) {
  const [formData, setFormData] = useState<PaymentMethodData & { agreeToTerms: boolean }>({
    cardNo: "",
    expMonth: "",
    expYear: "",
    idNo: "",
    cardPw: "",
    buyerName: currentBillingInfo?.buyerName || "",
    buyerEmail: currentBillingInfo?.buyerEmail || "",
    buyerTel: currentBillingInfo?.buyerTel || "",
    agreeToTerms: false,
  });
  const [isCardNumberFocused, setIsCardNumberFocused] = useState(false);

  const resetForm = () => {
    setFormData({
      cardNo: "",
      expMonth: "",
      expYear: "",
      idNo: "",
      cardPw: "",
      buyerName: currentBillingInfo?.buyerName || "",
      buyerEmail: currentBillingInfo?.buyerEmail || "",
      buyerTel: currentBillingInfo?.buyerTel || "",
      agreeToTerms: false,
    });
    setIsCardNumberFocused(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleConfirm = () => {
    // 필수 필드 검증
    if (!formData.cardNo || formData.cardNo.length < 15) {
      showErrorModal({
        title: "알림",
        headline: "올바른 카드 번호를 입력해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }
    if (!formData.expMonth || !formData.expYear) {
      showErrorModal({
        title: "알림",
        headline: "카드 만료일을 입력해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }
    if (!formData.idNo || (formData.idNo.length !== 6 && formData.idNo.length !== 10)) {
      showErrorModal({
        title: "알림",
        headline: "생년월일(6자리) 또는 사업자번호(10자리)를 입력해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }
    if (!formData.cardPw || formData.cardPw.length !== 2) {
      showErrorModal({
        title: "알림",
        headline: "카드 비밀번호 앞 2자리를 입력해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }
    if (!formData.buyerName) {
      showErrorModal({
        title: "알림",
        headline: "카드 소유자 이름을 입력해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }
    if (!formData.buyerEmail) {
      showErrorModal({
        title: "알림",
        headline: "이메일을 입력해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }
    if (!formData.buyerTel) {
      showErrorModal({
        title: "알림",
        headline: "연락처를 입력해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }
    if (!formData.agreeToTerms) {
      showErrorModal({
        title: "알림",
        headline: "약관에 동의해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    // API에 전달할 데이터 (agreeToTerms 제외)
    const { agreeToTerms, ...apiData } = formData;
    onConfirm(apiData);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted;
  };

  // 카드 번호 마스킹 처리 (가운데 8자리 * 처리)
  const maskCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "").replace(/\D/g, "");
    if (cleaned.length <= 4) {
      return cleaned;
    }
    if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 4)} ${"*".repeat(cleaned.length - 4)}`;
    }
    if (cleaned.length <= 12) {
      const first4 = cleaned.slice(0, 4);
      const middle = "*".repeat(cleaned.length - 8);
      const last4 = cleaned.slice(-4);
      return `${first4} ${middle} ${last4}`;
    }
    // 12자리 이상: 앞 4자리 + **** **** + 뒤 4자리
    const first4 = cleaned.slice(0, 4);
    const last4 = cleaned.slice(-4);
    return `${first4} **** **** ${last4}`;
  };

  // 카드 번호 표시 값 (포커스 중에는 실제 숫자, 포커스가 벗어나면 마스킹)
  const getCardNumberDisplayValue = () => {
    if (isCardNumberFocused) {
      return formatCardNumber(formData.cardNo);
    }
    return maskCardNumber(formData.cardNo);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "").slice(0, 16);
    setFormData({ ...formData, cardNo: value });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (value.length <= 2) {
      setFormData({ ...formData, expMonth: value, expYear: "" });
    } else {
      const month = value.slice(0, 2);
      const year = value.slice(2, 4);
      setFormData({ ...formData, expMonth: month, expYear: year });
    }
  };

  const formatExpiry = (month: string, year: string) => {
    if (!month && !year) return "";
    if (!year) return month;
    return `${month} / ${year}`;
  };

  const handleIdNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData({ ...formData, idNo: value });
  };

  const handleCardPwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 2);
    setFormData({ ...formData, cardPw: value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11);
    setFormData({ ...formData, buyerTel: value });
  };

  const formatPhone = (value: string) => {
    if (!value) return "";
    if (value.length <= 3) return value;
    if (value.length <= 7) return `${value.slice(0, 3)}-${value.slice(3)}`;
    return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-[#000000CC]" onClick={handleClose} />

      {/* Modal */}
      <div
        className="relative w-full h-full md:h-auto md:w-[524px] bg-card dark:bg-neutral-10 rounded-none md:rounded-[14px] md:max-h-[90vh] overflow-y-auto flex flex-col"
        style={{ filter: "drop-shadow(0px 8px 12px rgba(9, 30, 66, 0.1))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 md:px-7 pt-4 md:pt-7 pb-4 md:pb-6">
          <button
            onClick={handleClose}
            className="text-foreground hover:text-neutral-60 transition-colors cursor-pointer flex-shrink-0"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-[18px] font-semibold text-foreground">결제수단 변경</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-7 pb-4 md:pb-7">
          {/* Forms */}
          <div className="space-y-[10px] mb-6">
            {/* 카드 소유자 이름 */}
            <div className="space-y-2">
              <label className="block text-[13px] text-neutral-60">카드 소유자 이름</label>
              <input
                type="text"
                value={formData.buyerName}
                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                placeholder="카드 소유자 이름을 입력하세요"
              />
            </div>

            {/* 카드 번호 */}
            <div className="space-y-2">
              <label className="block text-[13px] text-neutral-60">카드 번호</label>
              <div className="relative">
                <input
                  type="text"
                  value={getCardNumberDisplayValue()}
                  onChange={handleCardNumberChange}
                  onFocus={() => setIsCardNumberFocused(true)}
                  onBlur={() => setIsCardNumberFocused(false)}
                  className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                  placeholder="1234 **** **** 1234"
                  maxLength={19}
                />
                {/* 카드 브랜드 아이콘 */}
                {formData.cardNo.length > 0 && (
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
                  </div>
                )}
              </div>
            </div>

            {/* 만료기간 및 비밀번호 앞 2자리 */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-[4px]">
                <label className="block text-[13px] text-neutral-60">만료기간</label>
                <input
                  type="text"
                  value={formatExpiry(formData.expMonth, formData.expYear)}
                  onChange={handleExpiryChange}
                  className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                  placeholder="MM / YY"
                  maxLength={7}
                />
              </div>
              <div className="flex-1 space-y-[4px]">
                <label className="block text-[13px] text-neutral-60">비밀번호 앞 2자리</label>
                <input
                  type="password"
                  value={formData.cardPw}
                  onChange={handleCardPwChange}
                  className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                  placeholder="••"
                  maxLength={2}
                />
              </div>
            </div>

            {/* 생년월일 / 사업자번호 */}
            <div className="space-y-2">
              <label className="block text-[13px] text-neutral-60">생년월일 (6자리) 또는 사업자번호 (10자리)</label>
              <input
                type="text"
                value={formData.idNo}
                onChange={handleIdNoChange}
                className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                placeholder="YYMMDD 또는 사업자번호"
                maxLength={10}
              />
            </div>

            {/* 이메일 정보 */}
            <div className="space-y-2">
              <label className="block text-[13px] text-neutral-60">이메일</label>
              <input
                type="email"
                value={formData.buyerEmail}
                onChange={(e) => setFormData({ ...formData, buyerEmail: e.target.value })}
                className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                placeholder="이메일을 입력하세요"
              />
            </div>

            {/* 연락처 */}
            <div className="space-y-2">
              <label className="block text-[13px] text-neutral-60">연락처</label>
              <input
                type="tel"
                value={formatPhone(formData.buyerTel)}
                onChange={handlePhoneChange}
                className="w-full h-[40px] px-3 py-2 bg-card border border-neutral-30 rounded-[6px] text-[14px] text-foreground focus:outline-none focus:border-foreground"
                placeholder="010-0000-0000"
                maxLength={13}
              />
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

        {/* Action Buttons - 모바일에서 하단 고정 */}
        <div className="px-4 md:px-7 py-4 mt-auto md:mt-0">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 border border-neutral-30 rounded-[5px] text-[14px] font-semibold text-foreground tracking-[-0.02em] hover:bg-neutral-10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 bg-neutral-90 text-white dark:text-neutral-0 rounded-[5px] text-[14px] font-semibold tracking-[-0.02em] hover:bg-neutral-80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "변경 중..." : "변경하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

