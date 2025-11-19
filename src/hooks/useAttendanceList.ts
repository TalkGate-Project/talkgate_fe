import { useState, useEffect } from "react";
import { AttendanceService } from "@/services/attendance";
import { AttendanceItem } from "@/types/attendance";

interface UseAttendanceListProps {
  projectId: string | null;
  date: string;
  page: number;
  limit: number;
}

export function useAttendanceList({
  projectId,
  date,
  page,
  limit,
}: UseAttendanceListProps) {
  const [rows, setRows] = useState<AttendanceItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    AttendanceService.list({
      projectId,
      date,
      page,
      limit,
    })
      .then((res) => {
        const response = res.data as any;
        if (response?.result && response?.data) {
          setRows(response.data.attendances || []);
          setTotalPages(response.data.totalPages || 1);
        } else {
          setRows([]);
          setTotalPages(1);
        }
      })
      .catch((e: any) =>
        setError(e?.data?.message || e?.message || "불러오지 못했습니다")
      )
      .finally(() => setLoading(false));
  }, [projectId, date, page, limit]);

  return {
    rows,
    totalPages,
    loading,
    error,
  };
}

