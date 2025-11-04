export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // 서버사이드 쿠키 존재만으로는 유효 인증을 보장하지 못해 루프 위험이 있어
  // 로그인 페이지에서는 SSR 리디렉션을 하지 않습니다.
  // 클라이언트에서 실제 인증 검사(AuthService.me) 후 필요한 경우만 이동합니다.
  return children;
}


