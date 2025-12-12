import { useRef } from "react";
import { CustomersBulkService } from "@/services/customersBulk";
import { AssetsService } from "@/services/assets";
import { CustomersService } from "@/services/customers";

type CustomersActionsProps = {
  projectId: string;
  appliedFilters: any;
  selectedIds: number[];
  onUploadSuccess: () => void;
  onAssignOpen: () => void;
  onCreateOpen: () => void;
  onSmsOpen: () => void;
};

export default function CustomersActions({
  projectId,
  appliedFilters,
  selectedIds,
  onUploadSuccess,
  onAssignOpen,
  onCreateOpen,
  onSmsOpen,
}: CustomersActionsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fileType = file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const presign = await AssetsService.presignBulkImport({ 
        fileName: file.name, 
        fileType,
        projectId,
      });
      const { uploadUrl, fileUrl } = presign.data;
      if (uploadUrl) {
        await AssetsService.uploadToS3(uploadUrl, file, fileType);
      }
      await CustomersBulkService.createImport({
        fileUrl: fileUrl || undefined,
        fileName: file.name,
        projectId,
      });
      alert("업로드 요청이 접수되었습니다.");
      onUploadSuccess();
    } catch (err) {
      console.error(err);
      alert("업로드에 실패했습니다.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExcelDownload = async () => {
    try {
      const exportQuery: Record<string, string | number | boolean | Array<string | number>> = {};
      const appliedForExport: any = appliedFilters;
      
      // API 스펙에 맞는 모든 필터 파라미터 전달 (page, limit 제외)
      if (appliedForExport.name) exportQuery.name = appliedForExport.name;
      if (appliedForExport.contact1) exportQuery.contact1 = appliedForExport.contact1;
      if (appliedForExport.contact2) exportQuery.contact2 = appliedForExport.contact2;
      if (appliedForExport.noteContent) exportQuery.noteContent = appliedForExport.noteContent;
      if (appliedForExport.assignType) exportQuery.assignType = appliedForExport.assignType;
      if (appliedForExport.teamId) exportQuery.teamId = appliedForExport.teamId;
      if (appliedForExport.memberId) exportQuery.memberId = appliedForExport.memberId;
      if (appliedForExport.applicationRoute) exportQuery.applicationRoute = appliedForExport.applicationRoute;
      if (appliedForExport.mediaCompany) exportQuery.mediaCompany = appliedForExport.mediaCompany;
      if (appliedForExport.site) exportQuery.site = appliedForExport.site;
      if (appliedForExport.categoryIds && Array.isArray(appliedForExport.categoryIds) && appliedForExport.categoryIds.length > 0) {
        exportQuery.categoryIds = appliedForExport.categoryIds;
      }
      if (appliedForExport.applicationDateFrom) exportQuery.applicationDateFrom = appliedForExport.applicationDateFrom;
      if (appliedForExport.applicationDateTo) exportQuery.applicationDateTo = appliedForExport.applicationDateTo;
      if (appliedForExport.assignedAtFrom) exportQuery.assignedAtFrom = appliedForExport.assignedAtFrom;
      if (appliedForExport.assignedAtTo) exportQuery.assignedAtTo = appliedForExport.assignedAtTo;
      
      const blobRes = await CustomersBulkService.exportExcel({ projectId, query: exportQuery });
      const blob = blobRes.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "customers.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("다운로드에 실패했습니다.");
    }
  };

  return (
    <div className="w-full flex justify-end items-center gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleExcelUpload}
      />
      <button
        className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold tracking-[-0.02em]"
        onClick={onCreateOpen}
      >
        고객등록
      </button>
      <button
        className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold tracking-[-0.02em] disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onAssignOpen}
        disabled={selectedIds.length === 0}
      >
        일괄배정
      </button>
      <button
        className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-neutral-90 text-neutral-20 text-[14px] font-semibold tracking-[-0.02em] disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onSmsOpen}
        disabled={selectedIds.length === 0}
      >
        문자전송
      </button>
      <button
        className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold tracking-[-0.02em] text-neutral-90 bg-neutral-0"
        onClick={() => fileInputRef.current?.click()}
      >
        엑셀 업로드
      </button>
      <button
        className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-neutral-30 text-[14px] font-semibold tracking-[-0.02em] text-neutral-90 bg-neutral-0"
        onClick={handleExcelDownload}
      >
        엑셀 다운로드
      </button>
      
    </div>
  );
}

