import { useCallback, useMemo, useState } from "react";
import { TeamMember } from "@/types/teams";

export function useDepartmentFilter(
  teamMembers: TeamMember[],
  allDepartments: string[]
) {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const filteredByDepartment = useMemo(() => {
    if (!selectedDepartment) return teamMembers;

    const filterTree = (items: TeamMember[]): TeamMember[] => {
      return items
        .map((item) => {
          const isMatch = item.department === selectedDepartment;
          const filteredChildren = item.children ? filterTree(item.children) : [];

          if (isMatch || filteredChildren.length > 0) {
            return {
              ...item,
              children: isMatch ? item.children : filteredChildren,
            };
          }
          return null;
        })
        .filter(Boolean) as TeamMember[];
    };

    return filterTree(teamMembers);
  }, [teamMembers, selectedDepartment]);

  const handleDepartmentClick = useCallback((dept: string) => {
    setSelectedDepartment((prev) => (prev === dept ? null : dept));
  }, []);

  return {
    selectedDepartment,
    filteredByDepartment,
    handleDepartmentClick,
  };
}
