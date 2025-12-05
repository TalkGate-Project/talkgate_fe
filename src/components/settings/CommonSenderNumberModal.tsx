"use client";

import { useState, useRef } from "react";
import { AssetsService } from "@/services/assets";
import { SmsService } from "@/services/sms";

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
      alert("발신번호를 입력해주세요.");
      return;
    }

    if (!file1) {
      alert("통신서비스 이용증명원을 첨부해주세요.");
      return;
    }

    if (!file2) {
      alert("사업자등록증 또는 법인등기부등본을 첨부해주세요.");
      return;
    }

    if (!file3) {
      alert("신분증 사본을 첨부해주세요.");
      return;
    }

    if (!file4) {
      alert("재직증명서를 첨부해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 각 파일에 대한 Presigned URL 발급
      const uploadPromises = [file1, file2, file3, file4].map(async (file) => {
        // Presigned URL 요청
        const presignRes = await AssetsService.presignSenderNumberDoc({
          fileName: file.name,
          fileType: file.type,
        });

        const { uploadUrl, fileUrl } = presignRes.data.data;

        // S3에 파일 업로드
        await AssetsService.uploadToS3(uploadUrl, file, file.type);

        return fileUrl;
      });

      const [url1, url2, url3, url4] = await Promise.all(uploadPromises);

      // 2. 프로젝트 발신번호 등록 API 호출
      const cleanedNumber = phoneNumber.replace(/-/g, ""); // 하이픈 제거
      await SmsService.registerProjectSenderNumber({
        number: cleanedNumber,
        documentImage1: url1,
        documentImage2: url2,
        documentImage3: url3,
        documentImage4: url4,
      });

      alert("발신번호가 성공적으로 등록되었습니다. 승인 심사 후 사용 가능합니다.");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("발신번호 등록 실패:", error);
      const errorMessage =
        error?.response?.data?.message || "발신번호 등록에 실패했습니다.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[600px] bg-white rounded-[14px] p-7 mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold text-neutral-90">
            공통 발신번호 추가
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-neutral-20 transition-colors"
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
                stroke="#666666"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* 발신번호 입력 */}
          <div>
            <label className="block text-[14px] font-semibold text-neutral-90 mb-2">
              발신번호
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="010-1234-5678"
              className="w-full h-[42px] px-4 rounded-[5px] border border-neutral-30 text-[14px] text-neutral-90 placeholder:text-neutral-40 focus:outline-none focus:border-neutral-60"
            />
            <p className="mt-1.5 text-[12px] text-neutral-60">
              하이픈 (-)을 포함하여 입력하세요.
            </p>
          </div>

          {/* 필요 서류 */}
          <div>
            <h3 className="text-[16px] font-bold text-neutral-90 mb-4">
              필요 서류
            </h3>

            <div className="space-y-4">
              {/* 서류 1 */}
              <div>
                <label className="block text-[14px] font-medium text-neutral-90 mb-2">
                  통신서비스 이용증명원
                </label>
                <p className="text-[12px] text-neutral-60 mb-2">
                  가입확인서, 이용계약등록증명서 등
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput1Ref.current?.click()}
                    className="h-[38px] px-4 rounded-[5px] border border-neutral-30 bg-white text-[14px] font-medium text-neutral-90 hover:bg-neutral-10 transition-colors"
                  >
                    파일선택
                  </button>
                  <span className="text-[14px] text-neutral-60">
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
                <label className="block text-[14px] font-medium text-neutral-90 mb-2">
                  사업자등록증 또는 법인등기부등본
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput2Ref.current?.click()}
                    className="h-[38px] px-4 rounded-[5px] border border-neutral-30 bg-white text-[14px] font-medium text-neutral-90 hover:bg-neutral-10 transition-colors"
                  >
                    파일선택
                  </button>
                  <span className="text-[14px] text-neutral-60">
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
                <label className="block text-[14px] font-medium text-neutral-90 mb-3">
                  대표자 신분증 사본 or 담당자 신분증 사본
                </label>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="documentType"
                      value="representative"
                      checked={documentType === "representative"}
                      onChange={(e) =>
                        setDocumentType(e.target.value as DocumentType)
                      }
                      className="w-4 h-4 text-[#22C55E] focus:ring-[#22C55E]"
                    />
                    <span className="text-[14px] text-neutral-90">
                      대표자 신분증 사본
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="documentType"
                      value="manager"
                      checked={documentType === "manager"}
                      onChange={(e) =>
                        setDocumentType(e.target.value as DocumentType)
                      }
                      className="w-4 h-4 text-[#22C55E] focus:ring-[#22C55E]"
                    />
                    <span className="text-[14px] text-neutral-90">
                      담당자 신분증 사본
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput3Ref.current?.click()}
                    className="h-[38px] px-4 rounded-[5px] border border-neutral-30 bg-white text-[14px] font-medium text-neutral-90 hover:bg-neutral-10 transition-colors"
                  >
                    파일선택
                  </button>
                  <span className="text-[14px] text-neutral-60">
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

              {/* 서류 4 */}
              <div>
                <label className="block text-[14px] font-medium text-neutral-90 mb-2">
                  재직증명서
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInput4Ref.current?.click()}
                    className="h-[38px] px-4 rounded-[5px] border border-neutral-30 bg-white text-[14px] font-medium text-neutral-90 hover:bg-neutral-10 transition-colors"
                  >
                    파일선택
                  </button>
                  <span className="text-[14px] text-neutral-60">
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
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-8">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-[42px] px-6 rounded-[5px] border border-neutral-30 bg-white text-[14px] font-semibold text-neutral-90 hover:bg-neutral-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-[42px] px-6 rounded-[5px] bg-neutral-90 text-[14px] font-semibold text-white hover:bg-neutral-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
