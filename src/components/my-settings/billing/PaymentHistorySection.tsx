import { useState } from "react";
import Pagination from "@/components/common/Pagination";
import type { Payment } from "@/hooks/useSubscription";
import PaymentRow from "./PaymentRow";

interface PaymentHistorySectionProps {
  payments: Payment[];
  loading: boolean;
  onDownloadReceipt: (paymentId: number) => void;
  downloadingPaymentId: number | null;
}

export default function PaymentHistorySection({
  payments,
  loading: paymentsLoading,
  onDownloadReceipt,
  downloadingPaymentId,
}: PaymentHistorySectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(payments.length / itemsPerPage));
  const paginatedPayments = payments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-card rounded-[14px] pb-5 md:pb-7">
      {/* 제목 */}
      <h2 className="px-6 md:px-7 py-4 md:py-6 text-[16px] md:text-[18px] font-bold text-foreground">
        결제내역
      </h2>

      {/* 구분선 */}
      <div className="px-6 md:px-7 mb-4 md:mb-6">
        <div className="h-[1px] bg-border opacity-70" />
      </div>

      {/* 테이블 */}
      <div className="px-4 md:px-7 overflow-x-auto">
        {/* 테이블 헤더 */}
        <div className="bg-neutral-20 rounded-[8px] h-[36px] md:h-[40px] flex items-center px-3 md:px-6 md:min-w-[600px]">
          <div className="flex-[1] text-[14px] md:text-[16px] font-medium text-neutral-60">
            결제날짜
          </div>
          <div className="flex-[1] text-[14px] md:text-[16px] font-medium text-neutral-60">
            금액
          </div>
          <div className="flex-[1] text-[14px] md:text-[16px] font-medium text-neutral-60">
            상태
          </div>
          <div className="flex-[1] text-[14px] md:text-[16px] font-medium text-neutral-60">
            구독 정보
          </div>
          <div className="w-[48px] flex-shrink-0"></div>
        </div>

        {/* 테이블 본문 */}
        <div>
          {paymentsLoading ? (
            // 로딩 스켈레톤
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center px-3 md:px-6 py-2 md:py-4 border-b border-neutral-10 md:min-w-[600px]"
              >
                <div className="flex-[1]">
                  <div className="h-4 w-24 bg-neutral-20 rounded animate-pulse" />
                </div>
                <div className="flex-[1]">
                  <div className="h-4 w-20 bg-neutral-20 rounded animate-pulse" />
                </div>
                <div className="flex-[1]">
                  <div className="h-4 w-12 bg-neutral-20 rounded animate-pulse" />
                </div>
                <div className="flex-[1]">
                  <div className="h-4 w-16 bg-neutral-20 rounded animate-pulse" />
                </div>
                <div className="w-[48px] flex-shrink-0"></div>
              </div>
            ))
          ) : paginatedPayments.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-neutral-60">
              매출 내역이 없습니다
            </div>
          ) : (
            paginatedPayments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onDownload={() => onDownloadReceipt(payment.id)}
                isDownloading={downloadingPaymentId === payment.id}
              />
            ))
          )}
        </div>
      </div>

      {/* 페이지네이션 */}
      {payments.length > 0 && (
        <div className="flex justify-center mt-4 md:mt-6 px-4 md:px-0">
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
