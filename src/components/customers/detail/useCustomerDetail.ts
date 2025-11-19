import { useState, useEffect, useCallback } from "react";
import { CustomersService } from "@/services/customers";
import { CustomerNoteCategoriesService } from "@/services/customerNoteCategories";
import { CustomerDetail } from "@/types/customers";

export type CustomerFormState = {
  name: string;
  contact1: string;
  contact2: string;
  residentFront: string;
  residentBack: string;
  ageRange: string;
  job: string;
  applicationRoute: string;
  site: string;
  mediaCompany: string;
  applicationDate: string;
  assignedMemberName: string;
  assignedTeamName: string;
  specialNotes: string;
  investmentInfo: string;
  investmentProfitLoss: string;
  investmentRiskLevel: string;
};

export const INITIAL_FORM_STATE: CustomerFormState = {
  name: "",
  contact1: "",
  contact2: "",
  residentFront: "",
  residentBack: "",
  ageRange: "",
  job: "",
  applicationRoute: "",
  site: "",
  mediaCompany: "",
  applicationDate: "",
  assignedMemberName: "",
  assignedTeamName: "",
  specialNotes: "",
  investmentInfo: "",
  investmentProfitLoss: "",
  investmentRiskLevel: "",
};

export function useCustomerDetail(customerId: number | null, open: boolean) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string; color?: string }[]>([]);
  
  // Local lists that might be edited separately from the main detail object in the original code,
  // but here we will try to keep them in sync with `detail` or manage them locally if they are purely optimistic.
  // The original code had `messengersLocal`. We can keep that or just modify `detail.messengers`.
  // To be consistent with "graceful" refactoring, we will maintain `detail` as the source of truth for lists
  // where possible, but `messengers` had a specific separate state in the original code.
  const [messengersLocal, setMessengersLocal] = useState<
    { id?: number; messenger: string; account: string; createdAt?: string }[]
  >([]);

  const [form, setForm] = useState<CustomerFormState>(INITIAL_FORM_STATE);

  // Fetch Logic
  const fetchDetail = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await CustomersService.detail(String(customerId)).withProject(
        (window as any)?.tgSelectedProjectId || ""
      );
      const d = (res as any).data?.data || null;
      setDetail(d);

      if (d) {
        setMessengersLocal(d.messengers || []);
        setForm({
          name: d.name || "",
          contact1: d.contact1 || "",
          contact2: d.contact2 || "",
          residentFront: d.residentId?.split("-")[0] || "",
          residentBack: d.residentId?.split("-")[1] || "",
          ageRange: d.ageRange || "",
          job: d.job || "",
          applicationRoute: d.applicationRoute || "",
          site: d.site || "",
          mediaCompany: d.mediaCompany || "",
          applicationDate: d.applicationDate || "",
          assignedMemberName: d.assignedMemberName || "",
          assignedTeamName: d.assignedTeamName || "",
          specialNotes: d.specialNotes || "",
          investmentInfo: d.investmentInfo || "",
          investmentProfitLoss: d.investmentProfitLoss || "",
          investmentRiskLevel: d.investmentRistLevel || "",
        });
      }
    } catch (err) {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await CustomerNoteCategoriesService.list();
      setCategories(((res as any).data?.data || []) as any);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    if (open && customerId) {
      fetchDetail();
      fetchCategories();
    }
  }, [open, customerId, fetchDetail, fetchCategories]);

  // Actions
  const resetForm = () => {
    if (!detail) return;
    setForm({
      name: detail.name || "",
      contact1: detail.contact1 || "",
      contact2: detail.contact2 || "",
      residentFront: detail.residentId?.split("-")[0] || "",
      residentBack: detail.residentId?.split("-")[1] || "",
      ageRange: detail.ageRange || "",
      job: detail.job || "",
      applicationRoute: detail.applicationRoute || "",
      site: detail.site || "",
      mediaCompany: detail.mediaCompany || "",
      applicationDate: detail.applicationDate || "",
      assignedMemberName: detail.assignedMemberName || "",
      assignedTeamName: detail.assignedTeamName || "",
      specialNotes: detail.specialNotes || "",
      investmentInfo: detail.investmentInfo || "",
      investmentProfitLoss: detail.investmentProfitLoss || "",
      investmentRiskLevel: detail.investmentRistLevel || "",
    });
    setMessengersLocal(detail.messengers || []);
  };

  const saveForm = async () => {
    if (!detail) return;
    const residentId =
      form.residentFront || form.residentBack
        ? `${form.residentFront}-${form.residentBack}`
        : undefined;

    await CustomersService.update(String(detail.id), {
      ...form,
      residentId,
      investmentRistLevel: form.investmentRiskLevel || undefined,
      projectId: (window as any)?.tgSelectedProjectId || "",
    });
  };

  // Messenger Actions
  const addMessenger = async (type: string, account: string) => {
    if (!detail) return;
    const toAdd = {
      messenger: type,
      account: account,
      createdAt: new Date().toISOString(),
    };
    setMessengersLocal((prev) => [...prev, toAdd]);
    try {
      await CustomersService.addMessenger({
        customerId: detail.id,
        messenger: type,
        account: account,
        projectId: (window as any)?.tgSelectedProjectId || "",
      });
    } catch {
      // rollback if needed, but original code doesn't
    }
  };

  const removeMessenger = async (index: number) => {
    const target = messengersLocal[index];
    if (!target) return;

    // Optimistic update: UI에서 먼저 제거
    const prevList = messengersLocal;
    const nextList = [...messengersLocal];
    nextList.splice(index, 1);
    setMessengersLocal(nextList);

    // 기존에 저장된 메신저(서버에 id가 있는 경우)만 삭제 API 호출
    if (target.id) {
      try {
        await CustomersService.removeMessenger({
          messengerId: target.id,
          projectId: (window as any)?.tgSelectedProjectId || "",
        });
      } catch (e) {
        // 실패 시 롤백
        setMessengersLocal(prevList);
        alert("메신저 삭제에 실패했습니다.");
      }
    }
  };

  // Payment Actions
  const addPayment = async (date: string, amount: string, method: string, desc: string) => {
    if (!detail) return;
    await CustomersService.addPaymentHistory({
      customerId: detail.id,
      description: desc,
      paymentDate: new Date(date).toISOString(),
      amount: Number(amount),
      paymentMethod: method === "카드" ? "creditCard" : method,
      projectId: (window as any)?.tgSelectedProjectId || "",
    });
    // Optimistic update (missing in original, added for gracefulness)
    setDetail(prev => prev ? ({
      ...prev,
      paymentHistories: [
        ...(prev.paymentHistories || []),
        {
          id: Math.random(), // Temp ID
          description: desc,
          paymentDate: date, // Keep string or ISO? API expects ISO.
          amount: Number(amount),
          paymentMethod: method === "카드" ? "creditCard" : method,
          createdAt: new Date().toISOString()
        } as any 
      ]
    }) : prev);
  };

  const removePayment = async (id: number) => {
    await CustomersService.removePaymentHistory({
      paymentHistoryId: id,
      projectId: (window as any)?.tgSelectedProjectId || "",
    });
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            paymentHistories: prev.paymentHistories.filter((x) => x.id !== id),
          }
        : prev
    );
  };

  // Schedule Actions
  const addSchedule = async (dateIso: string, desc: string) => {
    if (!detail) return;
    await CustomersService.addSchedule({
      customerId: detail.id,
      scheduleTime: dateIso,
      description: desc,
      projectId: (window as any)?.tgSelectedProjectId || "",
    });
    // Optimistic
    setDetail(prev => prev ? ({
        ...prev,
        schedules: [
            ...(prev.schedules || []),
            {
                id: Math.random(),
                scheduleTime: dateIso,
                description: desc,
                createdAt: new Date().toISOString(),
            } as any
        ]
    }) : prev);
  };

  const removeSchedule = async (id: number) => {
    await CustomersService.removeSchedule({
        scheduleId: id,
        projectId: (window as any)?.tgSelectedProjectId || "",
    });
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            schedules: prev.schedules.filter((x) => x.id !== id),
          }
        : prev
    );
  };

  // Note Actions
  const addNote = async (categoryId: number | undefined, note: string) => {
    if (!detail) return;
    await CustomersService.addNote({
        customerId: detail.id,
        categoryId: categoryId || 0,
        note,
        projectId: (window as any)?.tgSelectedProjectId || "",
    });
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            notes: [
              {
                id: Math.random(),
                categoryId: categoryId || 0,
                note,
                createdAt: new Date().toISOString(),
              },
              ...prev.notes,
            ],
          }
        : prev
    );
  };

  const removeNote = async (id: number) => {
    await CustomersService.removeNote({
        noteId: id,
        projectId: (window as any)?.tgSelectedProjectId || "",
    });
    setDetail((prev) =>
      prev
        ? {
            ...prev,
            notes: prev.notes.filter((x) => x.id !== id),
          }
        : prev
    );
  };

  return {
    loading,
    detail,
    categories,
    messengersLocal,
    form,
    setForm,
    actions: {
      resetForm,
      saveForm,
      addMessenger,
      removeMessenger,
      addPayment,
      removePayment,
      addSchedule,
      removeSchedule,
      addNote,
      removeNote,
    },
  };
}

