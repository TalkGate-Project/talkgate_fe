"use client";

import { useEffect, useState, useRef } from "react";
import BaseModal from "@/components/common/BaseModal";
import DatePicker from "@/components/common/DatePicker";
import TimePicker from "@/components/common/TimePicker";
import { RadioButton, MAX_IMAGES } from "@/components/customers/sms";
import { useDebtReliefSmsForm } from "./useDebtReliefSmsForm";
import DebtReliefPhonePreview from "./DebtReliefPhonePreview";
import { AssetsService } from "@/services/assets";
import { ProjectsService } from "@/services/projects";
import { useSelectedProjectId } from "@/hooks/useSelectedProjectId";
import { showErrorModal } from "@/providers/ErrorFeedbackModalProvider";
import { formatPhoneNumber } from "@/utils/format";

export type DebtReliefSmsModalProps = {
  open: boolean;
  onClose: () => void;
  diagnosisId: string;
  subtitle: string;
  initialBody: string;
  recipientName: string;
  recipientPhone: string;
};

export default function DebtReliefSmsModal({
  open,
  onClose,
  diagnosisId,
  subtitle,
  initialBody,
  recipientName,
  recipientPhone,
}: DebtReliefSmsModalProps) {
  const [projectId] = useSelectedProjectId();

  const {
    selectedSenderKey,
    selectedSender,
    senderNumbers,
    loadingSenders,
    contentType,
    businessName,
    title,
    body,
    imageFiles,
    sendMethod,
    messageType,
    scheduledDate,
    scheduledTime,
    sending,
    handleSenderChange,
    setContentType,
    setBusinessName,
    setTitle,
    setBody,
    setSendMethod,
    setScheduledDate,
    setScheduledTime,
    loadSenderNumbers,
    fileInputRef,
    handleFileSelect,
    handleFileChange,
    handleRemoveFile,
    handleSend,
    handleReset,
  } = useDebtReliefSmsForm();

  const [uploadingImages, setUploadingImages] = useState(false);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  // 부모에서 `{smsTemplate && <Modal open />}` 로 마운트하면 첫 open이 true라서
  // prev를 open으로 초기화하면 열림 전환을 놓쳐 템플릿 본문이 세팅되지 않는다.
  const prevOpenRef = useRef(false);

  // 모달이 열릴 때 발신번호/상호명 로드 + 템플릿 본문으로 초기화, 닫힐 때 폼 리셋
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      loadSenderNumbers();
      handleReset(initialBody);

      ProjectsService.detailById()
        .then((res) => {
          const project = (res.data as any)?.data ?? res.data;
          if (project?.name) setBusinessName(project.name);
        })
        .catch((err) => {
          console.error("프로젝트 정보 로드 실패:", err);
        });
    }
    if (!open && prevOpenRef.current) {
      handleReset();
    }
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialBody]);

  useEffect(() => {
    if (!open) setIsMobilePreviewOpen(false);
  }, [open]);

  const canSend = Boolean(selectedSender) && body.trim().length > 0 && !(sendMethod === "scheduled" && (!scheduledDate || !scheduledTime));

  const handleSubmit = async () => {
    if (!canSend || sending || uploadingImages || !projectId) return;

    try {
      const imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        try {
          for (const img of imageFiles) {
            const fileType = img.file.type || "image/jpeg";
            const presignedRes = await AssetsService.presignMmsAttachment({
              fileName: img.file.name,
              fileType,
            });
            const presignedData = (presignedRes.data as any)?.data ?? presignedRes.data;
            if (presignedData?.uploadUrl) {
              await AssetsService.uploadToS3(presignedData.uploadUrl, img.file, fileType);
              if (presignedData.fileUrl) imageUrls.push(presignedData.fileUrl);
            }
          }
        } catch {
          showErrorModal({
            title: "오류 발생",
            headline: "이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.",
            confirmText: "확인",
            cancelText: null,
            hideCancel: true,
          });
          return;
        } finally {
          setUploadingImages(false);
        }
      }

      const result = await handleSend({
        projectId,
        diagnosisId,
        recipientName,
        recipientPhone,
        content: body,
        imageUrls,
      });

      if (result.success) {
        showErrorModal({
          type: "success",
          headline: result.message || "문자 발송이 완료되었습니다.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
          onConfirm: () => {
            onClose();
          },
        });
      } else {
        showErrorModal({
          type: "error",
          headline: result.message || "문자 발송에 실패했습니다. 잠시 후 다시 시도해주세요.",
          confirmText: "확인",
          cancelText: null,
          hideCancel: true,
        });
      }
    } catch (error) {
      console.error("발송 처리 중 오류:", error);
      showErrorModal({
        title: "오류 발생",
        headline: "문자 발송 중 오류가 발생했습니다.",
        confirmText: "확인",
        cancelText: null,
        hideCancel: true,
      });
    }
  };

  const formFields = (
    <>
      {/* 발신번호 */}
      <div className="mb-5">
        <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">발신번호</label>
        <div className="relative">
          {loadingSenders ? (
            <div className="w-full h-[34px] px-3 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] text-neutral-60 dark:text-neutral-60 flex items-center bg-neutral-10 dark:bg-neutral-20">
              발신번호 로딩 중...
            </div>
          ) : senderNumbers.length === 0 ? (
            <div className="w-full h-[34px] px-3 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] text-neutral-60 dark:text-neutral-60 flex items-center bg-neutral-10 dark:bg-neutral-20">
              등록된 발신번호가 없습니다
            </div>
          ) : (
            <>
              <select
                value={selectedSenderKey ?? ""}
                onChange={(e) => handleSenderChange(e.target.value)}
                className="w-full h-[34px] px-3 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] leading-[17px] text-ink dark:text-neutral-90 appearance-none bg-card dark:bg-neutral-10 pr-10 outline-none focus:border-neutral-60 dark:focus:border-neutral-60"
              >
                {senderNumbers.map((num) => {
                  const key = `${num.source}-${num.id}`;
                  return (
                    <option key={key} value={key}>
                      {formatPhoneNumber(num.phoneNumber)} ({num.source === "project" ? "공통" : "개인"})
                    </option>
                  );
                })}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                width="10"
                height="8"
                viewBox="0 0 10 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.40544 7.4382C5.20587 7.71473 4.79413 7.71473 4.59456 7.4382L0.241885 2.7926C0.00323535 2.46192 0.239523 2 0.647327 2L9.35267 2C9.76048 2 9.99676 2.46192 9.75812 2.7926L5.40544 7.4382Z"
                  fill="currentColor"
                  className="fill-ink dark:fill-neutral-90"
                />
              </svg>
            </>
          )}
        </div>
      </div>

      {/* 수신자 */}
      <div className="mb-5">
        <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">수신자</label>
        <span className="inline-flex items-center gap-1 h-[28px] px-3 max-w-full bg-neutral-20 dark:bg-neutral-25 rounded-[30px] text-[13px] text-neutral-70 dark:text-neutral-70">
          <span className="truncate max-w-[130px]">{recipientName}</span>
          <span className="shrink-0">{formatPhoneNumber(recipientPhone)}</span>
        </span>
      </div>

      {/* 메시지 유형 */}
      <div className="mb-5">
        <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">
          메시지 유형 (90byte 초과 시 LMS)
        </label>
        <span
          className={`inline-flex items-center h-[24px] px-3 rounded-[30px] text-[12px] leading-[24px] font-semibold ${
            messageType === "SMS"
              ? "bg-[#00E272]/20 dark:!bg-[#D6FAE8E5] text-[#00A854]"
              : messageType === "LMS"
              ? "bg-[#FFB800]/20 text-[#B88200]"
              : "bg-[#FF6B6B]/20 text-[#D83232]"
          }`}
        >
          {messageType}
        </span>
      </div>

      {/* 광고 / 정보 유형 */}
      <div className="mb-5">
        <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">광고 / 정보 유형</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="debtReliefContentType"
              value="advertising"
              checked={contentType === "advertising"}
              onChange={() => setContentType("advertising")}
              className="sr-only"
            />
            <RadioButton checked={contentType === "advertising"} />
            <span className="text-[14px] text-ink dark:text-neutral-90">광고성</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="debtReliefContentType"
              value="informational"
              checked={contentType === "informational"}
              onChange={() => setContentType("informational")}
              className="sr-only"
            />
            <RadioButton checked={contentType === "informational"} />
            <span className="text-[14px] text-ink dark:text-neutral-90">정보성</span>
          </label>
        </div>

        {contentType === "advertising" && (
          <div className="mt-5">
            <label className="block text-[13px] leading-[16px] text-neutral-60 dark:text-neutral-60 mb-2">상호명</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="상호명을 입력하세요"
              className="w-full h-[34px] px-3 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] leading-[17px] text-ink dark:text-neutral-90 placeholder:text-neutral-60 dark:placeholder:text-neutral-60 bg-card dark:bg-neutral-10 outline-none focus:border-neutral-60 dark:focus:border-neutral-60"
            />
          </div>
        )}
      </div>

      {/* 제목 (LMS/MMS) */}
      <div className="mb-5">
        <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">제목 (LMS/MMS)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="(광고) 제목을 입력하세요"
          className="w-full h-[34px] px-3 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] leading-[17px] text-ink dark:text-neutral-90 placeholder:text-neutral-60 dark:placeholder:text-neutral-60 bg-card dark:bg-neutral-10 outline-none focus:border-neutral-60 dark:focus:border-neutral-60"
        />
      </div>

      {/* 본문 */}
      <div className="mb-5">
        <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">본문</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="발송할 메시지를 입력하세요"
          rows={10}
          className="w-full px-3 py-2 border border-neutral-30 dark:border-neutral-30 rounded-[5px] text-[14px] leading-[1.4] tracking-[-0.02em] text-ink dark:text-neutral-90 placeholder:text-neutral-60 dark:placeholder:text-neutral-60 bg-card dark:bg-neutral-10 outline-none focus:border-neutral-60 dark:focus:border-neutral-60 resize-none"
        />
      </div>

      {/* 이미지 첨부 */}
      <div className="mb-5">
        <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">이미지 첨부 (선택)</label>
        <div className="flex items-center gap-3 flex-wrap">
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg" onChange={handleFileChange} className="hidden" multiple />
          <button
            type="button"
            onClick={handleFileSelect}
            disabled={imageFiles.length >= MAX_IMAGES}
            className="h-[34px] px-3 border border-neutral-30 rounded-[5px] text-[14px] font-semibold text-ink bg-white dark:bg-neutral-10 hover:bg-neutral-10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            파일선택
          </button>
          {imageFiles.length === 0 ? (
            <span className="text-[14px] text-neutral-60 dark:text-neutral-60">선택된 파일 없음</span>
          ) : (
            <span className="text-[14px] text-neutral-60 dark:text-neutral-60">{imageFiles.length}/{MAX_IMAGES}개 선택됨</span>
          )}
        </div>
        {imageFiles.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {imageFiles.map((img) => (
              <div key={img.id} className="flex items-center gap-2">
                <span className="text-[13px] text-ink dark:text-neutral-90 truncate max-w-[250px]">{img.file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(img.id)}
                  className="cursor-pointer text-neutral-60 dark:text-neutral-60 hover:text-ink dark:hover:text-neutral-90 flex-shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 12L12 4M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 발송방식 */}
      <div>
        <label className="block text-[14px] leading-[17px] text-neutral-60 dark:text-neutral-60 mb-2">발송방식</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="debtReliefSendMethod"
              value="immediate"
              checked={sendMethod === "immediate"}
              onChange={() => setSendMethod("immediate")}
              className="sr-only"
            />
            <RadioButton checked={sendMethod === "immediate"} />
            <span className="text-[14px] text-ink dark:text-neutral-90">즉시발송</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="debtReliefSendMethod"
              value="scheduled"
              checked={sendMethod === "scheduled"}
              onChange={() => setSendMethod("scheduled")}
              className="sr-only"
            />
            <RadioButton checked={sendMethod === "scheduled"} />
            <span className="text-[14px] text-ink dark:text-neutral-90">예약발송</span>
          </label>
        </div>

        {sendMethod === "scheduled" && (
          <div className="mt-4 flex gap-3">
            <div className="flex-1 relative">
              <DatePicker value={scheduledDate} onChange={setScheduledDate} placeholder="날짜 선택" minDate={new Date()} className="pr-10 dark:bg-neutral-20" panelOffsetY={6} />
            </div>
            <div className="flex-1 relative">
              <TimePicker value={scheduledTime} onChange={setScheduledTime} placeholder="시간 선택" minuteStep={10} className="pr-10 dark:bg-neutral-20" restrictAdHours panelOffsetY={6} />
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (!open) return null;

  return (
    <BaseModal
      onClose={onClose}
      overlayClassName="bg-black/30 dark:bg-[#000000CC]"
      positionerClassName="h-full p-0 md:h-auto md:min-h-full md:flex md:items-center md:justify-center md:p-4"
      containerClassName="relative w-full h-full md:w-[calc(100%-2rem)] md:max-w-[848px] md:max-h-[90vh] lg:w-[848px] lg:min-w-[848px] lg:max-h-[703px] xl:max-h-[753px] overflow-hidden md:overflow-y-auto rounded-none md:rounded-[14px] bg-card dark:bg-neutral-10"
      ariaLabel="문자 전송"
      fullScreenOnMobile
    >
      <div className="relative w-full h-full flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 min-w-0">
            <button
              aria-label="back"
              onClick={() => (isMobilePreviewOpen ? setIsMobilePreviewOpen(false) : onClose())}
              className="cursor-pointer w-6 h-6 grid place-items-center shrink-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" className="text-neutral-90 dark:text-neutral-90" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2 className="text-[18px] leading-[21px] font-semibold text-neutral-90 dark:text-neutral-90 truncate">
              {isMobilePreviewOpen ? "미리보기" : `문자전송 | ${subtitle}`}
            </h2>
          </div>
          {isMobilePreviewOpen ? (
            <div className="w-6 h-6 shrink-0" />
          ) : (
            <button
              aria-label="preview"
              onClick={() => setIsMobilePreviewOpen(true)}
              className="cursor-pointer w-6 h-6 grid place-items-center text-neutral-90 dark:text-neutral-90 shrink-0"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 12C2 12 5.63636 5 12 5C18.3636 5 22 12 22 12C22 12 18.3636 19 12 19C5.63636 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between px-7 pt-6 pb-4">
          <h2 className="text-[18px] font-semibold leading-[21px] text-neutral-90 dark:text-neutral-90">
            문자전송 <span className="text-neutral-40 dark:text-neutral-50 font-normal mx-1">|</span> {subtitle}
          </h2>
          <button aria-label="close" onClick={onClose} className="cursor-pointer w-6 h-6 grid place-items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" className="text-neutral-60 dark:text-neutral-50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Mobile Content */}
        <div className="md:hidden flex-1 overflow-y-auto px-6 pb-4">
          {isMobilePreviewOpen ? (
            <DebtReliefPhonePreview
              senderNumber={selectedSender?.phoneNumber ?? "010-0000-0000"}
              title={title}
              body={body}
              imageFiles={imageFiles}
              contentType={contentType}
              businessName={businessName}
              mode="mobile"
            />
          ) : (
            formFields
          )}
        </div>

        {/* Desktop Content */}
        <div className="hidden md:flex px-7 pb-6 gap-8">
          <div className="flex-1 min-w-0 max-w-[384px]">{formFields}</div>
          <div className="flex-1 min-w-0 max-w-[384px]">
            <DebtReliefPhonePreview
              senderNumber={selectedSender?.phoneNumber ?? "010-0000-0000"}
              title={title}
              body={body}
              imageFiles={imageFiles}
              contentType={contentType}
              businessName={businessName}
            />
          </div>
        </div>

        {/* Mobile Footer */}
        {!isMobilePreviewOpen && (
          <div className="md:hidden border-t border-neutral-30 dark:border-neutral-30 px-6 py-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-[50px] rounded-[10px] border border-neutral-30 dark:border-neutral-30 text-[18px] font-semibold text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend || sending || uploadingImages}
              className={`h-[50px] rounded-[10px] text-[18px] font-semibold ${
                canSend && !sending && !uploadingImages
                  ? "bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0 cursor-pointer"
                  : "bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0 cursor-not-allowed opacity-50"
              }`}
            >
              발송요청
            </button>
          </div>
        )}

        {/* Desktop Footer */}
        <div className="hidden md:flex border-t border-neutral-30 dark:border-neutral-30 px-7 py-3 justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] px-3 rounded-[5px] border border-neutral-30 dark:border-neutral-30 text-[14px] font-semibold text-ink dark:text-neutral-80 bg-card dark:bg-neutral-10 hover:bg-neutral-10 dark:hover:bg-neutral-20 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend || sending || uploadingImages}
            className={`h-[34px] px-3 rounded-[5px] text-[14px] font-semibold transition-colors ${
              canSend && !sending && !uploadingImages
                ? "bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0 hover:bg-neutral-80 dark:hover:bg-neutral-70 cursor-pointer"
                : "bg-neutral-90 dark:bg-neutral-80 text-neutral-0 dark:text-neutral-0 cursor-not-allowed opacity-50"
            }`}
          >
            {sending ? "발송 중..." : uploadingImages ? "이미지 업로드 중..." : "발송요청"}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
