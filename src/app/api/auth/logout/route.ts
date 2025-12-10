import { NextRequest, NextResponse } from 'next/server';
import { deleteAuthCookies } from '@/lib/cookies';

/**
 * 로그아웃 API 엔드포인트
 * 
 * POST /api/auth/logout
 * 
 * 모든 인증 관련 쿠키를 삭제합니다.
 * 서브도메인과 메인 도메인 모두에서 쿠키를 삭제합니다.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Logout API] 🚪 로그아웃 요청 수신');

    const response = NextResponse.json({ 
      success: true,
      message: '로그아웃되었습니다.' 
    });

    // 모든 인증 쿠키 삭제
    deleteAuthCookies(response, request);

    console.log('[Logout API] ✅ 쿠키 삭제 완료');

    return response;
  } catch (error) {
    console.error('[Logout API] ❌ 로그아웃 처리 중 에러:', error);
    return NextResponse.json(
      { success: false, message: '로그아웃 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

