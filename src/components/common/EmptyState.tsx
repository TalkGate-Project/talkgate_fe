"use client";

export default function EmptyState({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <div className={`flex h-full items-center justify-center text-[14px] ${error ? "text-danger-40" : "text-neutral-60"}`}>
      {message}
    </div>
  );
}


