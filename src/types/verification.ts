import type { ApiSuccessResponse } from "./common";

// 본인인증 정보
export type VerificationIdentity = {
  isVerified: boolean;
  name: string;
  phoneNumber: string;
  verifiedAt: string;
};

// 본인인증 정보 조회 응답
export type VerificationIdentityResponse = ApiSuccessResponse<VerificationIdentity>;

// 본인인증 Form 데이터
export type VerificationFormData = {
  req_tx: string;
  cert_method: string;
  web_siteid: string;
  site_cd: string;
  Ret_URL: string;
  ordr_idxx: string;
  up_hash: string;
  cert_otp_use: string;
  cert_enc_use_ext: string;
  res_cd: string;
  res_msg: string;
  web_siteid_hashYN: string;
  kcp_merchant_time: string;
  kcp_cert_lib_ver: string;
  kcp_page_submit_yn: string;
  param_opt_1: string;
  param_opt_2: string;
  param_opt_3: string;
};

// 본인인증 시작 응답 데이터
export type PhoneVerificationData = {
  certViewUrl: string;
  certOdrNo: string;
  formData: VerificationFormData;
};

// 본인인증 시작 응답
export type PhoneVerificationResponse = ApiSuccessResponse<PhoneVerificationData>;

