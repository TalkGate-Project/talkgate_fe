"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type Props = {
  content: string | undefined;
  className?: string;
};

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-[18px] leading-[26px] font-bold mt-3 mb-1.5 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[16px] leading-[24px] font-bold mt-2.5 mb-1 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[15px] leading-[22px] font-semibold mt-2 mb-1 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-[14px] leading-[20px] font-semibold mt-2 mb-0.5 first:mt-0">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-[13px] leading-[20px] font-semibold mt-1.5 mb-0.5 first:mt-0">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-[13px] leading-[20px] font-medium mt-1.5 mb-0.5 first:mt-0">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="mb-1.5 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
  del: ({ children }) => (
    <del className="line-through">{children}</del>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-4 mb-1.5 last:mb-0 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 mb-1.5 last:mb-0 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="pl-0.5">{children}</li>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-secondary-60 underline underline-offset-2 hover:text-secondary-80 break-all"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-[3px] border-neutral-40 pl-3 my-1.5 text-neutral-60 italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block text-[12px] leading-[18px] font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-neutral-30 text-[12px] leading-[18px] px-1 py-0.5 rounded font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-neutral-30 rounded-lg px-3 py-2 my-1.5 overflow-x-auto text-[12px] leading-[18px]">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-1.5">
      <table className="min-w-full border-collapse text-[12px] leading-[18px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-neutral-20">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-neutral-30 px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-neutral-30 px-2 py-1">{children}</td>
  ),
  hr: () => <hr className="border-t border-neutral-30 my-2" />,
};

export default function MarkdownRenderer({ content, className }: Props) {
  if (!content) return null;

  return (
    <div className={`ai-markdown ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
