import type { SelectHTMLAttributes } from "react";

export function SelectField({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full rounded-[5px] border border-[#E5E7EB] px-2 pr-6 appearance-none ${
          className ?? ""
        }`}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
        width="8"
        height="6"
        viewBox="0 0 8 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.25896 5.4382C4.05939 5.71473 3.64764 5.71473 3.44807 5.4382L0.0954003 0.792604C-0.143249 0.461921 0.0930391 1.87809e-07 0.500843 2.2346e-07L7.20619 8.0966e-07C7.61399 8.45312e-07 7.85028 0.461922 7.61163 0.792604L4.25896 5.4382Z"
          fill="black"
        />
      </svg>
    </div>
  );
}



