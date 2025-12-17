"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import Panel from "@/components/common/Panel";
import { useCustomersList } from "@/hooks/useCustomersList";
import { CustomerListItem } from "@/types/customers";
import FilterModal from "@/components/common/FilterModal";
import AssignCustomersModal from "@/components/customers/AssignCustomersModal";
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";
import CustomerCreateModal from "@/components/customers/CustomerCreateModal";
import { SmsModal } from "@/components/customers/sms";
import { CustomersService } from "@/services/customers";
import { getSelectedProjectId } from "@/lib/project";
import { useRouter } from "next/navigation";
import { useCustomersFilters } from "@/hooks/useCustomersFilters";
import { useCustomersSelection } from "@/hooks/useCustomersSelection";
import CustomersFilterBar from "@/components/customers/CustomersFilterBar";
import FilterChips from "@/components/customers/FilterChips";
import CustomersTable from "@/components/customers/CustomersTable";
import CustomersPagination from "@/components/customers/CustomersPagination";
import CustomersActions from "@/components/customers/CustomersActions";
import { MembersTreeService } from "@/services/membersTree";
import { MembersService } from "@/services/members";
import type { MemberListItem } from "@/types/members";

function CustomersPage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "TalkGate - 고객목록";
  }, []);

  useEffect(() => {
    const id = getSelectedProjectId();
    if (!id) {
      router.replace("/projects");
      return;
    }
    setProjectId(id);
  }, [router]);

  const {
    filters,
    setFilters,
    page,
    setPage,
    limit,
    setLimit,
    query,
    applied,
    pushPage,
    applyFilters,
    removeFilterAndApply,
    removeCategoryFilterAndApply,
    removeDateRangeFilterAndApply,
  } = useCustomersFilters(projectId);

  const { data, loading, error, refetch } = useCustomersList(query as any);

  useEffect(() => {
    // refetch happens automatically through deps, this ensures consistency when projectId changes
  }, [projectId]);

  const customers: CustomerListItem[] = data?.data.customers ?? [];
  const totalPages = data?.data.totalPages ?? 1;
  const total = data?.data.total ?? 0;

  const {
    selectedIds,
    setSelectedIds,
    selectionMode,
    allSelectedOnPage,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
  } = useCustomersSelection();

  const [isFilterOpen, setFilterOpen] = useState(false);
  const [isAssignOpen, setAssignOpen] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isSmsOpen, setSmsOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  // 팀/멤버 목록 상태
  const [teams, setTeams] = useState<{ id: number; name: string; leaderMemberId: number; leaderMemberName: string }[]>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);

  // 팀/멤버 목록 fetch
  useEffect(() => {
    if (!projectId) return;
    
    // 팀 목록 가져오기
    MembersTreeService.fetchTeams(projectId)
      .then((teamsList) => {
        setTeams(teamsList || []);
      })
      .catch(() => {
        setTeams([]);
      });

    // 멤버 목록 가져오기
    MembersService.list()
      .then((res) => {
        const membersList = (res.data as any)?.data?.members || (res.data as any)?.members || [];
        setMembers(membersList);
      })
      .catch(() => {
        setMembers([]);
      });
  }, [projectId]);

  // 팀/멤버 옵션 생성
  const teamOptions = useMemo(() => {
    return teams.map((t) => ({ label: t.name, value: t.id }));
  }, [teams]);

  const memberOptions = useMemo(() => {
    return members.map((m) => ({ label: m.name, value: m.id }));
  }, [members]);

  const handleSelectAll = (mode: "page" | "all") => {
    toggleSelectAll(customers, mode);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    pushPage(nextPage);
  };

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
    pushPage(1, nextLimit);
  };

  const handleFilterApply = (values: any) => {
    // 기존 필터(이름, 핸드폰번호 등)와 모달에서 설정한 필터를 병합
    const mergedFilters = { ...filters, ...values };
    setFilters(mergedFilters);
    setFilterOpen(false);
    setPage(1);
    // URL에 필터 적용하여 검색 실행
    applyFilters(mergedFilters);
  };

  const handleAssign = async (targetId: number) => {
    try {
      if (selectionMode === "all") {
        // 전체 목록 선택: 필터 기준으로 배정
        await CustomersService.assign({
          assignmentType: "filters",
          memberId: targetId as any,
          filterConditions: {
            name: applied.name,
            contact1: applied.contact1,
            contact2: applied.contact2,
            noteContent: applied.noteContent,
            teamId: applied.teamId,
            memberId: applied.memberId,
            applicationRoute: applied.applicationRoute,
            mediaCompany: applied.mediaCompany,
            site: applied.site,
            categoryIds: applied.categoryIds,
            applicationDateFrom: applied.applicationDateFrom,
            applicationDateTo: applied.applicationDateTo,
            assignedAtFrom: applied.assignedAtFrom,
            assignedAtTo: applied.assignedAtTo,
          },
          expectedCount: total,
          projectId: projectId!,
        });
      } else {
        // 현재 페이지 선택: ID 기준으로 배정
        await CustomersService.assign({
          assignmentType: "ids",
          memberId: targetId as any,
          customerIds: selectedIds,
          expectedCount: selectedIds.length,
          projectId: projectId!,
        });
      }
      clearSelection();
      await refetch();
    } catch (e) {
      throw e;
    }
  };

  if (!projectId) return null;

  return (
    <main className="min-h-[calc(100vh-54px)] bg-neutral-10">
      <div className="mx-auto max-w-[1324px] w-full px-0 pt-9 pb-12">
      {/* Top panel: title + search */}
      <Panel
        className="rounded-[14px] mb-9"
        title={
          <div className="flex items-end gap-3">
            <h1 className="text-[24px] leading-[20px] font-bold text-neutral-90">고객목록</h1>
            <span className="w-px h-4 bg-neutral-60 opacity-40" />
            <p className="text-[18px] leading-[20px] font-medium text-neutral-60">고객 데이터를 확인하고 관리하세요</p>
          </div>
        }
        bodyClassName="px-7 pb-[22px] pt-[30px] border-t border-neutral-30"
      >
        <CustomersFilterBar
          filters={filters}
          onFilterChange={setFilters}
          onFilterOpen={() => setFilterOpen(true)}
          onSearch={() => applyFilters(filters)}
        />
        <FilterChips
          filters={filters}
          onRemove={removeFilterAndApply}
          onRemoveCategory={removeCategoryFilterAndApply}
          onRemoveDateRange={removeDateRangeFilterAndApply}
          teamOptions={teamOptions}
          memberOptions={memberOptions}
        />
      </Panel>

      {/* Bottom panel: actions (top-right) + table */}
      <Panel
        className="rounded-[14px]"
        action={
          <CustomersActions
            projectId={projectId}
            appliedFilters={applied}
            selectedIds={selectedIds}
            selectionMode={selectionMode}
            onUploadSuccess={refetch}
            onAssignOpen={() => setAssignOpen(true)}
            onCreateOpen={() => setCreateOpen(true)}
            onSmsOpen={() => setSmsOpen(true)}
          />
        }
        headerClassName="px-7 py-6"
        bodyClassName="px-7 pb-4 pt-0"
      >
        <CustomersTable
          customers={customers}
          loading={loading}
          error={!!error}
          selectedIds={selectedIds}
          onSelect={toggleSelect}
          onSelectAll={handleSelectAll}
          allSelectedOnPage={allSelectedOnPage(customers)}
          onCustomerClick={setDetailId}
          totalCount={total}
          selectionMode={selectionMode}
        />
        <CustomersPagination
          total={total}
          selectedCount={selectionMode === "all" ? total : selectedIds.length}
          page={page}
          totalPages={totalPages}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </Panel>
      <FilterModal
        open={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        defaults={filters}
        onApply={handleFilterApply}
        teamOptions={teamOptions}
        memberOptions={memberOptions}
      />

      <AssignCustomersModal
        open={isAssignOpen}
        onClose={() => setAssignOpen(false)}
        selectedCustomerIds={selectedIds}
        onAssign={handleAssign}
        projectId={projectId!}
      />

      <CustomerDetailModal open={detailId !== null} onClose={() => setDetailId(null)} customerId={detailId} />

      <CustomerCreateModal
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetch}
      />

      <SmsModal
        open={isSmsOpen}
        onClose={() => setSmsOpen(false)}
        customers={customers.filter((c) => selectedIds.includes(c.id))}
        selectionMode={selectionMode}
        appliedFilters={applied}
        totalCount={total}
        projectId={projectId!}
      />
      </div>
    </main>
  );
}

export default function CustomersPageWrapper() {
  return (
    <Suspense fallback={null}>
      <CustomersPage />
    </Suspense>
  );
}
