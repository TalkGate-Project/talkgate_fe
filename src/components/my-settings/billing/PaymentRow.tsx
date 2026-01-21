import type { Payment } from "@/hooks/useSubscription";
import { formatDateCompact } from "@/utils/datetime";
import { formatAmountKR } from "@/utils/format";
import { getPaymentStatusLabel, getPaymentStatusColor, getPaymentTypeLabel } from "@/lib/utils/billingUtils";

interface PaymentRowProps {
  payment: Payment;
  onDownload: () => void;
  isDownloading: boolean;
}

export default function PaymentRow({
  payment,
  onDownload,
  isDownloading,
}: PaymentRowProps) {
  const statusLabel = getPaymentStatusLabel(payment.status);
  const statusColor = getPaymentStatusColor(payment.status);

  return (
    <div className="flex items-center px-3 md:px-6 py-2 md:py-3 border-b border-neutral-10 md:min-w-[600px]">
      <div className="flex-[1] text-[12px] md:text-[14px] text-foreground">
        {formatDateCompact(payment.createdAt)}
      </div>
      <div className="flex-[1] text-[12px] md:text-[14px] text-foreground">
        {formatAmountKR(payment.amount)}
      </div>
      <div className="flex-[1]">
        <span
          className={`px-2 py-1 text-[11px] md:text-[12px] font-medium rounded ${
            statusColor === "green"
              ? "bg-primary-10 text-primary-80"
              : statusColor === "yellow"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="flex-[1] text-[12px] md:text-[14px] text-foreground">
        {getPaymentTypeLabel(payment.paymentType)}
      </div>
      <div className="w-[48px] flex items-center justify-end flex-shrink-0">
        <button
          className="cursor-pointer p-2 hover:bg-neutral-10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onDownload}
          disabled={isDownloading}
          aria-label="receipt download"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 7H5C3.89543 7 3 7.89543 3 9V18C3 19.1046 3.89543 20 5 20H19C20.1046 20 21 19.1046 21 18V9C21 7.89543 20.1046 7 19 7H16M15 11L12 14M12 14L9 11M12 14L12 4"
              stroke="#B0B0B0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
