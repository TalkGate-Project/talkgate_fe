import { useState, useRef } from "react";
import { CustomerListItem, RecentNote } from "@/types/customers";
import Checkbox from "@/components/common/Checkbox";
import CustomersHoverPopover from "./CustomersHoverPopover";

type CustomersTableProps = {
  customers: CustomerListItem[];
  loading: boolean;
  error: boolean;
  selectedIds: number[];
  onSelect: (customerId: number, checked: boolean) => void;
  onSelectAll: () => void;
  allSelectedOnPage: boolean;
  onCustomerClick: (customerId: number) => void;
};

export default function CustomersTable({
  customers,
  loading,
  error,
  selectedIds,
  onSelect,
  onSelectAll,
  allSelectedOnPage,
  onCustomerClick,
}: CustomersTableProps) {
  const [hoverInfo, setHoverInfo] = useState<{
    name: string;
    notes: RecentNote[];
    top: number;
    left: number;
  } | null>(null);
  const hoverHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, customer: CustomerListItem) => {
    if (hoverHideRef.current) {
      clearTimeout(hoverHideRef.current);
      hoverHideRef.current = null;
    }
    const { clientX, clientY } = e;
    const notes = Array.isArray(customer.recentNotes) ? customer.recentNotes : [];
    setHoveredId(customer.id);
    setHoverInfo({
      name: customer.name,
      notes,
      top: clientY + 12,
      left: Math.min(clientX + 12, window.innerWidth - 400),
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hoverInfo) return;
    const { clientX, clientY } = e;
    setHoverInfo((prev) =>
      prev ? { ...prev, top: clientY + 12, left: Math.min(clientX + 12, window.innerWidth - 400) } : prev
    );
  };

  const handleMouseLeave = () => {
    if (hoverHideRef.current) clearTimeout(hoverHideRef.current);
    hoverHideRef.current = setTimeout(() => {
      setHoverInfo(null);
      setHoveredId(null);
    }, 150);
  };

  const handlePopoverMouseEnter = () => {
    if (hoverHideRef.current) {
      clearTimeout(hoverHideRef.current);
      hoverHideRef.current = null;
    }
  };

  const handlePopoverMouseLeave = () => {
    setHoverInfo(null);
    setHoveredId(null);
  };

  return (
    <>
      <div className="overflow-hidden rounded-[12px]" style={{ width: "100%" }}>
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#EDEDED] dark:bg-[#222222] text-[#808080] dark:text-[#B9B9B9]">
              <th className="px-6 h-[48px] rounded-l-[12px]">
                <input type="checkbox" checked={allSelectedOnPage} onChange={onSelectAll} />
              </th>
              {[
                "이름",
                "신청경로",
                "매체사",
                "사이트",
                "담당팀",
                "담당자",
                "신청시간",
                "배정시간",
              ].map((h, i, arr) => (
                <th
                  key={h}
                  className={`typo-title-2 font-bold px-6 h-[48px] ${i === arr.length - 1 ? "rounded-r-[12px]" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="typo-body-3">
            {loading && (
              <tr>
                <td colSpan={9} className="px-6 h-[72px] text-center text-[#808080] dark:text-[#B9B9B9]">
                  불러오는 중...
                </td>
              </tr>
            )}
            {Boolean(error) && !loading && (
              <tr>
                <td colSpan={9} className="px-6 h-[72px] text-center text-red-500">
                  데이터를 불러오지 못했습니다
                </td>
              </tr>
            )}
            {customers.map((c) => {
              const checked = selectedIds.includes(c.id);
              return (
                <tr
                  key={c.id}
                  className={`border-b-[0.5px] border-[#E2E2E2] dark:border-[#444444] ${
                    hoveredId === c.id ? "bg-[#F8F8F8] dark:bg-[#1A1A1A]" : ""
                  }`}
                  onMouseEnter={(e) => handleMouseEnter(e, c)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <td className="px-6 h-[58px] align-middle">
                    <Checkbox
                      checked={checked}
                      onChange={(next) => onSelect(c.id, next)}
                      ariaLabel={`select ${c.name}`}
                    />
                  </td>
                  <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">
                    <button
                      className="underline underline-offset-2 text-inherit"
                      onClick={() => onCustomerClick(c.id)}
                    >
                      {c.name}
                    </button>
                  </td>
                  <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">
                    {c.applicationRoute}
                  </td>
                  <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">
                    {c.mediaCompany}
                  </td>
                  <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">
                    {c.site}
                  </td>
                  <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">
                    {c.assignedTeamName}
                  </td>
                  <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">
                    {c.assignedMemberName}
                  </td>
                  <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">
                    {new Date(c.applicationDate || c.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 h-[58px] align-middle text-[#252525] dark:text-[#E9E9E9] opacity-80">
                    {c.assignedAt ? new Date(c.assignedAt).toLocaleString() : "-"}
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && !loading && (
              <tr>
                <td colSpan={9} className="px-6 h-[72px] text-center text-[#808080] dark:text-[#B9B9B9]">
                  결과가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hoverInfo && (
        <CustomersHoverPopover
          name={hoverInfo.name}
          notes={hoverInfo.notes}
          top={hoverInfo.top}
          left={hoverInfo.left}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        />
      )}
    </>
  );
}

