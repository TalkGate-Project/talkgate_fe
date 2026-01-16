"use client";

import { useState } from "react";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { BillingService } from "@/services/billing";
import type { BillingTermsType } from "@/types/billing";

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

// 나이스페이 약관 타입 정의
type NicePayTerms = {
  type: BillingTermsType;
  title: string;
  content: string | null;
  loading: boolean;
  expanded: boolean;
  agreed: boolean;
};

const NICEPAY_TERMS_CONFIG: { type: BillingTermsType; label: string }[] = [
  { type: "ElectronicFinancialTransactions", label: "전자금융거래 약관" },
  { type: "CollectPersonalInfo", label: "개인정보 수집 및 이용 약관" },
  { type: "SharingPersonalInformation", label: "개인정보 제3자 제공 약관" },
];

export default function ChangePaymentMethodModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  currentBillingInfo,
}: ChangePaymentMethodModalProps) {
  const [formData, setFormData] = useState<PaymentMethodData>({
    cardNo: "",
    expMonth: "",
    expYear: "",
    idNo: "",
    cardPw: "",
    buyerName: currentBillingInfo?.buyerName || "",
    buyerEmail: currentBillingInfo?.buyerEmail || "",
    buyerTel: currentBillingInfo?.buyerTel || "",
  });
  const [isCardNumberFocused, setIsCardNumberFocused] = useState(false);

  // 나이스페이 약관 상태
  const [nicePayTerms, setNicePayTerms] = useState<NicePayTerms[]>(
    NICEPAY_TERMS_CONFIG.map((config) => ({
      type: config.type,
      title: config.label,
      content: null,
      loading: false,
      expanded: false,
      agreed: false,
    }))
  );

  // 모든 약관 동의 여부
  const allTermsAgreed = nicePayTerms.every((term) => term.agreed);

  // 약관 내용 로드 (펼칠 때 lazy loading)
  const loadTermsContent = async (type: BillingTermsType) => {
    const termIndex = nicePayTerms.findIndex((t) => t.type === type);
    if (termIndex === -1 || nicePayTerms[termIndex].content !== null) return;

    setNicePayTerms((prev) =>
      prev.map((t) =>
        t.type === type ? { ...t, loading: true } : t
      )
    );

    try {
      const response = await BillingService.getTerms(type);
      const data = response.data?.data;
      setNicePayTerms((prev) =>
        prev.map((t) =>
          t.type === type
            ? { ...t, content: data?.content || "약관 내용을 불러올 수 없습니다.", loading: false }
            : t
        )
      );
    } catch (err) {
      console.error("약관 조회 실패:", err);
      setNicePayTerms((prev) =>
        prev.map((t) =>
          t.type === type
            ? { ...t, content: "약관 내용을 불러올 수 없습니다.", loading: false }
            : t
        )
      );
    }
  };

  // 약관 펼침/접기 토글
  const toggleTermExpanded = (type: BillingTermsType) => {
    setNicePayTerms((prev) =>
      prev.map((t) => {
        if (t.type === type) {
          const newExpanded = !t.expanded;
          if (newExpanded && t.content === null) {
            loadTermsContent(type);
          }
          return { ...t, expanded: newExpanded };
        }
        return t;
      })
    );
  };

  // 약관 동의 토글
  const toggleTermAgreed = (type: BillingTermsType) => {
    setNicePayTerms((prev) =>
      prev.map((t) =>
        t.type === type ? { ...t, agreed: !t.agreed } : t
      )
    );
  };

  // 전체 동의
  const toggleAllAgreed = () => {
    const newValue = !allTermsAgreed;
    setNicePayTerms((prev) =>
      prev.map((t) => ({ ...t, agreed: newValue }))
    );
  };

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
    });
    setIsCardNumberFocused(false);
    setNicePayTerms(
      NICEPAY_TERMS_CONFIG.map((config) => ({
        type: config.type,
        title: config.label,
        content: null,
        loading: false,
        expanded: false,
        agreed: false,
      }))
    );
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
    if (!allTermsAgreed) {
      showErrorModal({
        title: "알림",
        headline: "모든 약관에 동의해주세요.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    onConfirm(formData);
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

          {/* 나이스페이 약관 동의 */}
          <div className="border border-neutral-30 rounded-[8px] overflow-hidden">
            {/* 전체 동의 */}
            <div className="px-4 py-3 bg-neutral-10 dark:bg-neutral-20 border-b border-neutral-30">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={allTermsAgreed}
                    onChange={toggleAllAgreed}
                    disabled={isLoading}
                    className="w-5 h-5 appearance-none rounded-[5px] border border-neutral-50 checked:bg-[#00E272] checked:border-[#00E272] cursor-pointer transition-colors disabled:opacity-50"
                  />
                  {allTermsAgreed && (
                    <svg
                      className="absolute top-0 left-0 w-5 h-5 pointer-events-none"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 10L8.5 13.5L15 7"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-[14px] font-semibold text-foreground">
                  전체 동의
                </span>
              </label>
            </div>

            {/* 개별 약관 */}
            {nicePayTerms.map((term) => (
              <div key={term.type} className="border-b border-neutral-30 last:border-b-0">
                <div className="flex items-center justify-between px-4 py-3">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={term.agreed}
                        onChange={() => toggleTermAgreed(term.type)}
                        disabled={isLoading}
                        className="w-4 h-4 appearance-none rounded-[4px] border border-neutral-50 checked:bg-[#00E272] checked:border-[#00E272] cursor-pointer transition-colors disabled:opacity-50"
                      />
                      {term.agreed && (
                        <svg
                          className="absolute top-0 left-0 w-4 h-4 pointer-events-none"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 8L7 11L12 5"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-[13px] text-neutral-70">
                      {term.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleTermExpanded(term.type)}
                    className="cursor-pointer text-[12px] text-neutral-60 hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <span>상세보기</span>
                    <svg
                      className={`w-3 h-3 transition-transform ${term.expanded ? "" : "rotate-180"}`}
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                {term.expanded && (
                  <div className="px-4 py-3 bg-neutral-10 dark:bg-neutral-20 border-t border-neutral-30 max-h-[150px] overflow-y-auto">
                    {term.loading ? (
                      <div className="text-[12px] text-neutral-60">약관을 불러오는 중...</div>
                    ) : (
                      <p className="text-[11px] text-neutral-70 whitespace-pre-line leading-[1.6]">
                        {term.content}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
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

