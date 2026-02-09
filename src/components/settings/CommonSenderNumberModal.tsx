"use client";

import { useState, useRef } from "react";
import { AssetsService } from "@/services/assets";
import { SmsService } from "@/services/sms";
import { showErrorModal } from "@/lib/errorModalEvents";
import { formatPhoneInput } from "@/utils/format";

interface CommonSenderNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type DocumentType = "representative" | "manager";

export default function CommonSenderNumberModal({
  isOpen,
  onClose,
  onSuccess,
}: CommonSenderNumberModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("manager");
  
  // 파일 상태
  const [file1, setFile1] = useState<File | null>(null); // 통신서비스 이용증명원
  const [file2, setFile2] = useState<File | null>(null); // 사업자등록증 또는 법인등기부등본
  const [file3, setFile3] = useState<File | null>(null); // 신분증 사본
  const [file4, setFile4] = useState<File | null>(null); // 재직증명서

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  const fileInput3Ref = useRef<HTMLInputElement>(null);
  const fileInput4Ref = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!phoneNumber.trim()) {
      showErrorModal({
        type: "error",
        headline: "발신번호를 입력해주세요",
        hideCancel: true,
      });
      return;
    }

    if (!file1) {
      showErrorModal({
        type: "error",
        headline: "통신서비스 이용증명원을 첨부해주세요",
        hideCancel: true,
      });
      return;
    }

    if (!file2) {
      showErrorModal({
        type: "error",
        headline: "사업자등록증 또는 법인등기부등본을 첨부해주세요",
        hideCancel: true,
      });
      return;
    }

    if (!file3) {
      showErrorModal({
        type: "error",
        headline: "신분증 사본을 첨부해주세요",
        hideCancel: true,
      });
      return;
    }

    if (documentType === "manager" && !file4) {
      showErrorModal({
        type: "error",
        headline: "재직증명서를 첨부해주세요",
        hideCancel: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 각 파일에 대한 Presigned URL 발급 (대표자 선택 시 3개, 담당자 선택 시 4개)
      const filesToUpload = documentType === "manager" ? [file1, file2, file3, file4!] : [file1, file2, file3];
      const uploadPromises = filesToUpload.map(async (file) => {
        const presignRes = await AssetsService.presignSenderNumberDoc({
          fileName: file.name,
          fileType: file.type,
        });

        const { uploadUrl, fileUrl } = presignRes.data.data;
        await AssetsService.uploadToS3(uploadUrl, file, file.type);
        return fileUrl;
      });

      const urls = await Promise.all(uploadPromises);
      const [url1, url2, url3] = urls;
      const url4 = documentType === "manager" ? urls[3] : undefined;

      // 2. 프로젝트 발신번호 등록 API 호출
      const cleanedNumber = phoneNumber.replace(/-/g, "");
      await SmsService.registerProjectSenderNumber({
        number: cleanedNumber,
        documentImage1: url1,
        documentImage2: url2,
        documentImage3: url3,
        ...(url4 !== undefined && { documentImage4: url4 }),
      });

      showErrorModal({
        type: "success",
        headline: "발신번호가 성공적으로 등록되었습니다",
        description: "승인 심사 후 사용 가능합니다.",
        hideCancel: true,
        onConfirm: () => {
          onSuccess();
          onClose();
        },
      });
    } catch (error: any) {
      console.error("발신번호 등록 실패:", error);
      
      // 서버에서 반환한 에러 메시지 추출
      let errorMessage = "발신번호 등록에 실패했습니다.";
      const rejectionReason = error?.data?.rejectionReason || error?.data?.data?.rejectionReason;
      
      if (rejectionReason) {
        // 반려 사유가 있는 경우 QA 요구사항 형식으로 표시
        errorMessage = `발신 번호 등록이 반려되었습니다.\n\n사유: ${rejectionReason}\n\n확인 후 다시 등록을 신청해 주세요.`;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showErrorModal({
        type: "error",
        headline: "발신번호 등록에 실패했습니다",
        description: errorMessage,
        hideCancel: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 dark:bg-[#000000CC]" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full h-full md:w-[600px] md:h-auto bg-white dark:bg-neutral-10 md:rounded-[14px] md:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-[64px] flex items-center px-4 md:px-7 md:border-b md:border-neutral-30 dark:md:border-neutral-30 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="md:hidden cursor-pointer w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity mr-2"
            aria-label="뒤로가기"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 19L8 12L15 5"
                stroke="currentColor"
                className="text-neutral-90 dark:text-neutral-80"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className="text-[18px] md:text-[20px] font-semibold md:font-bold text-neutral-90 dark:text-neutral-80">
            공통 발신번호 추가
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex cursor-pointer ml-auto w-8 h-8 items-center justify-center rounded hover:bg-neutral-20 dark:hover:bg-neutral-20 transition-colors"
            aria-label="닫기"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                className="text-neutral-60 dark:text-neutral-60"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 px-4 md:px-7 pt-4 md:pt-7 pb-4">
          {/* 발신번호 입력 */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-90 dark:text-neutral-80 mb-2">
              발신번호
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => {
                const formatted = formatPhoneInput(e.target.value);
                setPhoneNumber(formatted);
              }}
              placeholder="02-1234-5678 또는 010-1234-5678"
              className="w-full h-[42px] px-4 rounded-[5px] border border-neutral-30 dark:border-neutral-30 bg-white dark:bg-neutral-10 text-[14px] text-neutral-90 dark:text-neutral-80 placeholder:text-neutral-40 dark:placeholder:text-neutral-50 focus:outline-none focus:border-neutral-60 dark:focus:border-neutral-60"
            />
            <p className="mt-1.5 text-[12px] text-neutral-60 dark:text-neutral-60">
              숫자만 입력하면 하이픈이 자동으로 추가됩니다.
            </p>
          </div>

          {/* 필요 서류 */}
          <div>
            <h3 className="text-[16px] font-bold text-neutral-90 dark:text-neutral-80 mb-4">
              필요 서류
            </h3>

            <div className="space-y-4">
              {/* 서류 1 */}
              <div>
                <label className="block text-[14px] font-medium text-neutral-90 dark:text-neutral-80 mb-2">
                  1. 통신서비스 이용증명원
                </label>
                <p className="text-[12px] text-neutral-60 dark:text-neutral-60 mb-2">
                  가입확인서, 이용계약등록증명서 등
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInput1Ref.current?.click()}
                    className="cursor-pointer h-[34px] px-4 rounded-[5px] border border-neutral-30 dark:border-neutral-30 bg-white dark:bg-neutral-10 text-[14px] font-medium text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors flex-shrink-0"
                  >
                    파일선택
                  </button>
                  <span className="text-[14px] text-neutral-60 dark:text-neutral-60 truncate min-w-0 flex-1">
                    {file1 ? file1.name : "선택된 파일 없음"}
                  </span>
                  <input
                    ref={fileInput1Ref}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setFile1)}
                    className="hidden"
                  />
                </div>
              </div>

              {/* 서류 2 */}
              <div>
                <label className="block text-[14px] font-medium text-neutral-90 dark:text-neutral-80 mb-2">
                  2. 사업자등록증 또는 법인등기부등본
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInput2Ref.current?.click()}
                    className="cursor-pointer h-[34px] px-4 rounded-[5px] border border-neutral-30 dark:border-neutral-30 bg-white dark:bg-neutral-10 text-[14px] font-medium text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors flex-shrink-0"
                  >
                    파일선택
                  </button>
                  <span className="text-[14px] text-neutral-60 dark:text-neutral-60 truncate min-w-0 flex-1">
                    {file2 ? file2.name : "선택된 파일 없음"}
                  </span>
                  <input
                    ref={fileInput2Ref}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setFile2)}
                    className="hidden"
                  />
                </div>
              </div>

              {/* 서류 3 */}
              <div>
                <label className="block text-[14px] font-medium text-neutral-90 dark:text-neutral-80 mb-3">
                  3. 대표자 신분증 사본 or 담당자 신분증 사본
                </label>
                <div className="flex items-center gap-4 mb-2 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentType("representative");
                        setFile4(null);
                      }}
                      className="cursor-pointer flex items-center justify-center w-5 h-5"
                      aria-label="대표자 신분증 사본 선택"
                    >
                      {documentType === "representative" ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="0.5" y="0.5" width="19" height="19" rx="9.5" stroke="#00E272"/>
                          <rect x="5" y="5" width="10" height="10" rx="5" fill="#00E272"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="0.5" y="0.5" width="19" height="19" rx="9.5" stroke="#959595"/>
                        </svg>
                      )}
                    </button>
                    <span className="text-[14px] text-neutral-90 dark:text-neutral-80">
                      대표자 신분증 사본
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setDocumentType("manager")}
                      className="cursor-pointer flex items-center justify-center w-5 h-5"
                      aria-label="담당자 신분증 사본 선택"
                    >
                      {documentType === "manager" ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="0.5" y="0.5" width="19" height="19" rx="9.5" stroke="#00E272"/>
                          <rect x="5" y="5" width="10" height="10" rx="5" fill="#00E272"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="0.5" y="0.5" width="19" height="19" rx="9.5" stroke="#959595"/>
                        </svg>
                      )}
                    </button>
                    <span className="text-[14px] text-neutral-90 dark:text-neutral-80">
                      담당자 신분증 사본
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInput3Ref.current?.click()}
                    className="cursor-pointer h-[34px] px-4 rounded-[5px] border border-neutral-30 dark:border-neutral-30 bg-white dark:bg-neutral-10 text-[14px] font-medium text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors flex-shrink-0"
                  >
                    파일선택
                  </button>
                  <span className="text-[14px] text-neutral-60 dark:text-neutral-60 truncate min-w-0 flex-1">
                    {file3 ? file3.name : "선택된 파일 없음"}
                  </span>
                  <input
                    ref={fileInput3Ref}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, setFile3)}
                    className="hidden"
                  />
                </div>
              </div>

              {/* 서류 4: 담당자 신분증 선택 시에만 노출 */}
              {documentType === "manager" && (
                <div>
                  <label className="block text-[14px] font-medium text-neutral-90 dark:text-neutral-80 mb-2">
                    4. 재직증명서
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInput4Ref.current?.click()}
                      className="cursor-pointer h-[34px] px-4 rounded-[5px] border border-neutral-30 dark:border-neutral-30 bg-white dark:bg-neutral-10 text-[14px] font-medium text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors flex-shrink-0"
                    >
                      파일선택
                    </button>
                    <span className="text-[14px] text-neutral-60 dark:text-neutral-60 truncate min-w-0 flex-1">
                      {file4 ? file4.name : "선택된 파일 없음"}
                    </span>
                    <input
                      ref={fileInput4Ref}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, setFile4)}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end px-4 md:px-7 py-3 border-t border-neutral-30 dark:border-neutral-30 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer w-[48px] md:w-[48px] h-[34px] rounded-[5px] border border-neutral-30 dark:border-neutral-30 bg-white dark:bg-neutral-10 text-[14px] font-semibold text-ink dark:text-neutral-80 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="cursor-pointer w-[48px] md:w-[48px] h-[34px] rounded-[5px] bg-neutral-90 dark:bg-neutral-80 text-[14px] font-semibold text-white dark:text-neutral-25 hover:bg-neutral-80 dark:hover:bg-neutral-70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
