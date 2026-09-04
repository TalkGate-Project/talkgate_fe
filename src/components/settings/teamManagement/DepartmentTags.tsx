"use client";

interface DepartmentTagsProps {
  departments: string[];
  selectedDepartment: string | null;
  onDepartmentClick: (dept: string) => void;
}

export default function DepartmentTags({
  departments,
  selectedDepartment,
  onDepartmentClick,
}: DepartmentTagsProps) {
  const uniqueDepartments = Array.from(new Set(departments.filter(Boolean)));

  if (uniqueDepartments.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-30 scrollbar-track-transparent pb-1">
      {uniqueDepartments.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onDepartmentClick(tag)}
          className={`px-3 py-1 rounded-[30px] leading-[1] max-h-[22px] flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
            selectedDepartment === tag
              ? "bg-secondary-40 text-neutral-0"
              : "bg-neutral-30 text-neutral-70 hover:bg-neutral-40"
          }`}
        >
          <span className="text-[12px] font-medium leading-[1] whitespace-nowrap">{tag}</span>
        </button>
      ))}
    </div>
  );
}
