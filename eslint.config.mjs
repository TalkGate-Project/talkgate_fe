import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // 개발 단계에서 타입 관련 규칙 완화
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      
      // React 관련 규칙 완화
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "warn",
      
      // Next.js 관련 규칙 완화
      "@next/next/no-img-element": "off", // 외부/동적 이미지의 경우 <Image /> 사용 시 문제 발생 가능
      "@next/next/no-html-link-for-pages": "warn",
      
      // 기타 규칙 완화
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
];

export default eslintConfig;
