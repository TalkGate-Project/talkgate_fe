"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AssetsService } from "@/services/assets";
import { CustomersBulkService } from "@/services/customersBulk";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";

const ACCEPTED_TYPES = ".xlsx,.xls,.csv";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onUploadSuccess: () => void;
};

// 양식 다운로드 링크 (비어 있음 - 추후 첨부 예정)
const FORM_DOWNLOAD_URL = "https://cdn.talkgate.im/attachment/template.xlsx";
// 이용 가이드 링크
const GUIDE_URL = "https://talkgate.gitbook.io/talkgate/explore-features/customers/data#csv";

export default function CustomerExcelUploadModal({
  isOpen,
  onClose,
  projectId,
  onUploadSuccess,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    if (!submitting) {
      resetState();
      onClose();
    }
  }, [onClose, resetState, submitting]);

  const validateFile = useCallback((file: File): boolean => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) return false;
    return true;
  }, []);

  const onPickFile = useCallback(() => fileInputRef.current?.click(), []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (!file) return;
      if (!validateFile(file)) {
        showErrorModal({
          title: "지원하지 않는 파일 형식",
          headline: "xlsx, xls, .csv 파일만 업로드 가능합니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
        return;
      }
      setSelectedFile(file);
    },
    [validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!currentTarget.contains(relatedTarget)) setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0] || null;
      if (!file) return;
      if (!validateFile(file)) {
        showErrorModal({
          title: "지원하지 않는 파일 형식",
          headline: "xlsx, xls, .csv 파일만 업로드 가능합니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
        return;
      }
      setSelectedFile(file);
    },
    [validateFile]
  );

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const getFileType = useCallback((file: File): string => {
    if (file.type) return file.type;
    const ext = file.name.split(".").pop()?.toLowerCase();
    const mime: Record<string, string> = {
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xls: "application/vnd.ms-excel",
      csv: "text/csv",
    };
    return mime[ext || ""] || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }, []);

  const handleRegister = useCallback(async () => {
    if (!selectedFile || submitting) return;

    setSubmitting(true);
    try {
      const fileType = getFileType(selectedFile);
      const presign = await AssetsService.presignBulkImport({
        fileName: selectedFile.name,
        fileType,
        projectId,
      });
      const { uploadUrl, fileUrl } = presign.data.data;
      if (uploadUrl) {
        await AssetsService.uploadToS3(uploadUrl, selectedFile, fileType);
      }
      await CustomersBulkService.createImport({
        fileUrl: fileUrl || undefined,
        fileName: selectedFile.name,
        projectId,
      });
      resetState();
      onClose();
      onUploadSuccess();
      showErrorModal({
        type: "success",
        title: "고객 등록",
        headline: "고객 등록이 시작되었습니다.",
        description:
          "업로드된 파일을 처리하고 있습니다.\n처리 상태는 설정 > 일괄 등록 이력에서 확인 가능합니다.",
        confirmText: "이력 확인하기",
        cancelText: "취소",
        hideCancel: false,
        onConfirm: () => router.push("/settings?tab=batch-registration"),
      });
    } catch (err: unknown) {
      console.error(err);
      showErrorModal({
        title: "오류 발생",
        headline: "업로드에 실패했습니다. 잠시 후 다시 시도해주세요.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    } finally {
      setSubmitting(false);
    }
  }, [selectedFile, submitting, projectId, getFileType, onUploadSuccess, resetState, onClose, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 dark:bg-[#000000CC]"
        aria-hidden
      />
      <div
        className="relative bg-white dark:bg-neutral-10 md:rounded-[14px] md:w-[440px] w-full max-h-[90vh] md:max-h-[600px] flex flex-col shadow-[0px_13px_61px_rgba(169,169,169,0.366013)] drop-shadow-[0px_8px_12px_rgba(9,30,66,0.1)] dark:shadow-none dark:drop-shadow-none"
      >
        {/* 헤더 - font-weight 600, 18px, line-height 21px */}
        <div className="flex items-center px-6 pt-6 pb-0">
          <h2 className="text-[18px] font-semibold leading-[21px] text-[#000000] dark:text-foreground">
            엑셀 업로드
          </h2>
          <button
            aria-label="닫기"
            className="cursor-pointer ml-auto w-6 h-6 grid place-items-center rounded-full hover:bg-[#F8F8F8] dark:hover:bg-neutral-20 transition-colors"
            onClick={handleClose}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[#B0B0B0] dark:text-neutral-50"
            >
              <path
                d="M6 18L18 6M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="text-center mt-[30px] mb-2">
          <p className="text-[16px] font-medium leading-[24px] text-[#000000] dark:text-foreground">
            양식 작성 후 업로드 시 일괄 등록이 가능합니다.
          </p>
          {FORM_DOWNLOAD_URL ? (
            <a
              href={FORM_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[16px] font-bold leading-[19px] text-[#2563EB] underline mt-1 inline-block"
            >
              양식 다운로드
            </a>
          ) : (
            <span className="text-[16px] font-bold leading-[19px] text-[#2563EB] underline cursor-default mt-1 inline-block">
              양식 다운로드
            </span>
          )}
        </div>

        {/* 본문 - gap 12px between blocks */}
        <div className="flex-1 px-6 pt-3 pb-6 overflow-y-auto">
          <div className="flex flex-col gap-3">
              {/* 안내 영역 - 회색 컨테이너에 전체 포함 (양식 안내 + 다운로드 + 불릿) */}
              <div className="rounded-[5px] bg-[#F8F8F8] dark:bg-neutral-25 px-6 py-3">

                <ul className="space-y-0 text-[14px] font-medium leading-[24px] text-[#474747] dark:text-neutral-80">
                  <li>• 지원형식 : xlsx, xls, .csv 파일만 업로드 가능합니다.</li>
                  <li>• 양식준수 : 지정 양식만 업로드 가능합니다.</li>
                  <li>• 필수항목 : 이름, 연락처는 필수 입력 항목입니다.</li>
                </ul>
              </div>

              {/* 파일 업로드 영역 - Group 44: bg #F8F8F8, padding 12px 24px */}
              <div className="rounded-[5px] bg-[#F8F8F8] dark:bg-neutral-25 px-6 py-3">
                <h3 className="text-[14px] font-medium leading-[24px] text-[#000000] dark:text-foreground mb-3">
                  엑셀 업로드
                </h3>
                {/* textbox: bg #FFFFFF, border 1px dashed #E2E2E2 */}
                <div
                  className={`relative rounded-[5px] bg-white dark:bg-neutral-10 border border-dashed transition-colors ${isDragging
                    ? "border-primary-80 border-2"
                    : "border-[#E2E2E2] dark:border-neutral-30"
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="flex items-center gap-4 px-4 py-3 h-[76px]">
                      <div className="">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_4223_42116)">
                            <path d="M20 20.546C20 21.9596 18.8998 23 17.5431 23H6.4499C5.13427 23 4 21.9818 4 20.6178V4.37715C4 3.08291 5.07315 2.00809 6.34469 2.00708L13.5952 2C13.8166 2 14.015 2.08595 14.1683 2.24065L19.7605 7.88372C19.9158 8.04044 19.999 8.23357 19.999 8.46815V20.545L20 20.546ZM18.3988 20.544V9.26795H15.2495C13.9158 9.28615 12.8357 8.24166 12.7976 6.89585V3.61375L6.3988 3.61577C5.9509 3.61577 5.59619 3.96967 5.59619 4.42973V20.5652C5.59619 21.0243 5.9489 21.3802 6.4018 21.3802H17.5922C18.0501 21.3802 18.3988 21.0293 18.3988 20.543V20.544ZM15.2174 7.65723L17.2575 7.6451L14.4058 4.76744L14.3948 6.89687C14.4419 7.32457 14.7655 7.64307 15.2164 7.65723H15.2174Z" fill="#00B55B" />
                            <path d="M14.9397 16.7462C15.2574 17.0668 15.2894 17.543 14.9949 17.8807C14.7363 18.178 14.2013 18.2761 13.8836 17.9576L11.9989 16.0657L10.1121 17.9576C9.80448 18.2659 9.28744 18.184 9.02292 17.905C8.72332 17.5895 8.7143 17.0941 9.03294 16.7725L10.8656 14.9222L8.98885 13.0172C8.67221 12.6957 8.77041 12.1578 9.063 11.8969C9.4167 11.5814 9.88764 11.6441 10.2153 11.9768L11.9979 13.7806L13.8065 11.9525C14.1221 11.633 14.5941 11.5996 14.9287 11.8949C15.2424 12.1709 15.3115 12.7139 14.9858 13.0445L13.1321 14.9232L14.9397 16.7472V16.7462Z" fill="#00B55B" />
                          </g>
                          <defs>
                            <clipPath id="clip0_4223_42116">
                              <rect width="16" height="21" fill="white" transform="translate(4 2)" />
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#000000] dark:text-foreground truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[12px] text-[#808080] dark:text-neutral-60 mt-0.5">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="파일 제거"
                        className="cursor-pointer shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#252525] hover:bg-[#474747] transition-colors text-white"
                        onClick={removeFile}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 4L12 12M12 4L4 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center py-6 px-4 cursor-pointer"
                      onClick={onPickFile}
                    >
                      {/* Icon/Outline/xls - 24x24, color #B0B0B0 */}
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-[#B0B0B0] dark:text-neutral-50 mb-2"
                      >
                        <path
                          d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2V8H20"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p
                        className="text-[10px] font-medium leading-[14px] text-center text-[#B0B0B0] dark:text-neutral-50 tracking-[-0.02em]"
                        style={{ maxWidth: 180 }}
                      >
                        클릭하거나 드래그하여 업로드
                        <br />
                        xlsx, xls, .csv 파일만 업로드 가능
                      </p>
                    </div>
                  )}
                  {isDragging && !selectedFile && (
                    <div className="absolute inset-0 bg-primary-80/10 dark:bg-primary-80/20 rounded-[5px] flex items-center justify-center z-10 pointer-events-none">
                      <div className="text-[14px] font-semibold text-primary-80">
                        여기에 드롭하세요
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>
            </div>
        </div>

        {/* 하단 버튼 - Line 1px solid #E2E2E2, buttons h-34px */}
        <div className="border-t border-[#E2E2E2] dark:border-neutral-30 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            className="cursor-pointer h-[34px] px-3 rounded-[5px] border border-[#E2E2E2] dark:border-neutral-30 text-[14px] font-semibold leading-[17px] text-[#000000] dark:text-foreground bg-white dark:bg-neutral-10 hover:bg-[#F8F8F8] dark:hover:bg-neutral-25 transition-colors disabled:opacity-50 tracking-[-0.02em]"
            onClick={handleClose}
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="button"
            className="cursor-pointer h-[34px] px-3 rounded-[5px] bg-[#252525] dark:bg-neutral-90 text-[#EDEDED] dark:text-neutral-20 text-[14px] font-semibold leading-[17px] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity tracking-[-0.02em]"
            onClick={handleRegister}
            disabled={!selectedFile || submitting}
          >
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
