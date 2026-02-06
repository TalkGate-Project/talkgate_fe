import crypto from 'crypto';
import { logger } from '@/lib/logger';

/**
 * URL에 노출되는 토큰을 암호화/복호화하는 유틸리티
 *
 * - AES-256-GCM 알고리즘 사용 (암호화 + 무결성 검증)
 * - 서버 사이드(API Route)에서만 사용
 * - 출력은 base64url 인코딩으로 URL-safe
 */

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.');
  }
  return Buffer.from(key, 'hex');
}

/**
 * 토큰을 AES-256-GCM으로 암호화합니다.
 * 반환 형식: {iv}.{authTag}.{encrypted} (모두 base64url 인코딩)
 */
export function encryptToken(token: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'base64url');
    encrypted += cipher.final('base64url');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted}`;
  } catch (error) {
    logger.serverError('[Crypto] 토큰 암호화 실패:', error);
    throw error;
  }
}

/**
 * AES-256-GCM으로 암호화된 토큰을 복호화합니다.
 * 입력 형식: {iv}.{authTag}.{encrypted} (모두 base64url 인코딩)
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const parts = encryptedToken.split('.');
    if (parts.length !== 3) {
      throw new Error('잘못된 암호화 토큰 형식입니다.');
    }

    const [ivStr, authTagStr, encrypted] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivStr, 'base64url');
    const authTag = Buffer.from(authTagStr, 'base64url');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64url', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.serverError('[Crypto] 토큰 복호화 실패:', error);
    throw error;
  }
}
