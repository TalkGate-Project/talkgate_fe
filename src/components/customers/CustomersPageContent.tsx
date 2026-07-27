"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import Panel from "@/components/common/Panel";
import { useCustomersList } from "@/hooks/useCustomersList";
import type { AssignCustomersFilterConditions, CustomerListItem } from "@/types/customers";
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
import BulkScheduleCreateModal from "@/components/customers/BulkScheduleCreateModal";
import CurrentProjectBadge from "@/components/common/CurrentProjectBadge";
import { useCurrentProjectDetail } from "@/hooks/useCurrentProjectDetail";
import { useMyMember } from "@/hooks/useMyMember";
import { useMembersTreeWithoutParent, useTeams } from "@/hooks/useMembersTree";
import type { MemberTreeNode } from "@/types/membersTree";
import { sanitizeContactFilterInput } from "@/utils/format";

function buildAssignmentFilterConditions(
  appliedFilters: Record<string, unknown>
): AssignCustomersFilterConditions {
  const categoryIds = Array.isArray(appliedFilters.categoryIds)
    ? appliedFilters.categoryIds.filter((id): id is number => typeof id === "number")
    : undefined;

  return {
    name: typeof appliedFilters.name === "string" ? appliedFilters.name : undefined,
    contact1:
      typeof appliedFilters.contact1 === "string" ? appliedFilters.contact1 : undefined,
    contact2:
      typeof appliedFilters.contact2 === "string" ? appliedFilters.contact2 : undefined,
    noteContent:
      typeof appliedFilters.noteContent === "string" ? appliedFilters.noteContent : undefined,
    assignType:
      appliedFilters.assignType === "all" ||
      appliedFilters.assignType === "assigned" ||
      appliedFilters.assignType === "unassigned"
        ? appliedFilters.assignType
        : undefined,
    apiKeyId: typeof appliedFilters.apiKeyId === "number" ? appliedFilters.apiKeyId : undefined,
    teamId: typeof appliedFilters.teamId === "number" ? appliedFilters.teamId : undefined,
    memberId: typeof appliedFilters.memberId === "number" ? appliedFilters.memberId : undefined,
    applicationRoute:
      typeof appliedFilters.applicationRoute === "string"
        ? appliedFilters.applicationRoute
        : undefined,
    mediaCompany:
      typeof appliedFilters.mediaCompany === "string" ? appliedFilters.mediaCompany : undefined,
    site: typeof appliedFilters.site === "string" ? appliedFilters.site : undefined,
    categoryIds: categoryIds && categoryIds.length > 0 ? categoryIds : undefined,
    applicationDateFrom:
      typeof appliedFilters.applicationDateFrom === "string"
        ? appliedFilters.applicationDateFrom
        : undefined,
    applicationDateTo:
      typeof appliedFilters.applicationDateTo === "string"
        ? appliedFilters.applicationDateTo
        : undefined,
    assignedAtFrom:
      typeof appliedFilters.assignedAtFrom === "string"
        ? appliedFilters.assignedAtFrom
        : undefined,
    assignedAtTo:
      typeof appliedFilters.assignedAtTo === "string"
        ? appliedFilters.assignedAtTo
        : undefined,
    projectPartnerId:
      typeof appliedFilters.projectPartnerId === "number"
        ? appliedFilters.projectPartnerId
        : undefined,
    ipAddress:
      typeof appliedFilters.ipAddress === "string" ? appliedFilters.ipAddress : undefined,
    keyword: typeof appliedFilters.keyword === "string" ? appliedFilters.keyword : undefined,
    summary:
      typeof appliedFilters.summaryInfo === "string" ? appliedFilters.summaryInfo : undefined,
    specialNotes:
      typeof appliedFilters.notablePoints === "string"
        ? appliedFilters.notablePoints
        : undefined,
  };
}

function CustomersPageContentInner() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);

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
    sortType,
    sortOrder,
    toggleSort,
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
  // fetch error 시 totalPages 기본값(1)로 인한 페이지 표시 점프를 방지
  const totalPages = data?.data.totalPages ?? (error ? page : 1);
  const total = data?.data.total ?? (error ? customers.length : 0);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!query || !data?.data) return;

    const requestedPage = query.page;
    const responsePage = data.data.page;
    const responseTotalPages = data.data.totalPages;

    // QA 재현 시 page 보정/응답 불일치 여부를 빠르게 확인하기 위한 개발용 진단 로그
    if (requestedPage !== responsePage) {
      console.warn("[customers] page mismatch after refetch", {
        requestedPage,
        responsePage,
        responseTotalPages,
        query,
      });
    }
  }, [data, query]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!error || !query) return;

    console.warn("[customers] refetch failed; preserving current page view", {
      requestedPage: query.page,
      requestedLimit: query.limit,
      query,
      error,
    });
  }, [error, query]);

  const {
    selectedIds,
    selectionMode,
    allSelectedOnPage,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    removeFromSelection,
    syncSelectionWithCustomers,
  } = useCustomersSelection();

  useEffect(() => {
    syncSelectionWithCustomers(data?.data.customers ?? []);
  }, [data?.data.customers, syncSelectionWithCustomers]);

  const [isFilterOpen, setFilterOpen] = useState(false);
  const [isAssignOpen, setAssignOpen] = useState(false);
  const [assignFromDetailId, setAssignFromDetailId] = useState<number | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isSmsOpen, setSmsOpen] = useState(false);
  const [isBulkScheduleOpen, setBulkScheduleOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { project, isLoading: isProjectLoading } = useCurrentProjectDetail();
  const { isAdminOrSubAdmin, role } = useMyMember(projectId);
  const canAssignCustomer =
    role === "admin" || role === "subAdmin" || role === "leader";

  // 권한에 맞는 트리 구조 조회 (자신이 조회할 수 있는 범위 내에서만 반환, 직속 상위 멤버 제외)
  const { data: treeData } = useMembersTreeWithoutParent(projectId);
  const { data: allTeamsData } = useTeams(projectId);

  // 트리에서 모든 멤버를 직렬화하는 함수
  const flattenTreeMembers = useCallback((nodes: MemberTreeNode[]): Array<{ id: number; name: string }> => {
    const result: Array<{ id: number; name: string }> = [];
    const traverse = (node: MemberTreeNode) => {
      result.push({ id: node.id, name: node.name });
      if (node.descendants && node.descendants.length > 0) {
        node.descendants.forEach((descendant) => {
          traverse(descendant);
        });
      }
    };
    nodes.forEach((node) => {
      traverse(node);
    });
    return result;
  }, []);

  // 트리에서 팀 정보 추출 (teamName이 있는 노드 = 팀장)
  const extractTeamsFromTree = useCallback((nodes: MemberTreeNode[]): Map<number, string> => {
    const teamMap = new Map<number, string>();
    const traverse = (node: MemberTreeNode) => {
      if (node.teamName) {
        // 팀장인 경우, 팀 정보 저장
        // allTeamsData에서 해당 팀장의 팀 ID 찾기
        const team = allTeamsData?.find((t) => t.leaderMemberId === node.id);
        if (team) {
          teamMap.set(team.id, team.name);
        }
      }
      if (node.descendants && node.descendants.length > 0) {
        node.descendants.forEach((descendant) => {
          traverse(descendant);
        });
      }
    };
    nodes.forEach((node) => {
      traverse(node);
    });
    return teamMap;
  }, [allTeamsData]);

  // 팀/멤버 옵션 생성
  const teamOptions = useMemo(() => {
    if (!treeData || !allTeamsData) return [];
    
    // 트리에서 추출한 팀 정보
    const treeTeams = extractTeamsFromTree(treeData);
    
    // 트리에 포함된 팀만 필터링하여 옵션 생성
    return allTeamsData
      .filter((team) => treeTeams.has(team.id))
      .map((team) => ({ label: team.name, value: team.id }));
  }, [treeData, allTeamsData, extractTeamsFromTree]);

  const memberOptions = useMemo(() => {
    if (!treeData) return [];
    
    // 트리에서 모든 멤버를 직렬화하여 옵션 생성
    const treeMembers = flattenTreeMembers(treeData);
    return treeMembers.map((m) => ({ label: m.name, value: m.id }));
  }, [treeData, flattenTreeMembers]);

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
    // 모달에서 넘긴 값을 새 필터 상태 전체로 사용 (병합하지 않음 → 초기화 시 빈 값이 적용됨)
    const newFilters = { ...values };
    setFilters(newFilters);
    setFilterOpen(false);
    setPage(1);
    applyFilters(newFilters);
  };

  /** 초기화 버튼: 빈 필터 적용, 모달은 닫지 않음 */
  const handleFilterReset = () => {
    setFilters({});
    setPage(1);
    applyFilters({});
  };

  /** 중복 "더보기" 클릭: 연락처로 필터 적용 후 전체 새로고침 (다른 상태 초기화) */
  const handleFilterByContact = (contact: string) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", String(limit));
    params.set("contact1", sanitizeContactFilterInput(contact));
    window.location.assign(`/customers?${params.toString()}`);
  };

  const handleAssign = async (targetId: number) => {
    try {
      // 상세 모달에서 연 "직원배정"인 경우: 해당 고객 1명만 배정
      const effectiveIds = assignFromDetailId != null ? [assignFromDetailId] : selectedIds;
      const effectiveMode = assignFromDetailId != null ? null : selectionMode;

      // assignmentType 결정 로직:
      // - 전체목록선택 모드(selectionMode === "all")일 때는 filter 사용 (우선순위 높음)
      //   → 이 경우 selectedIds는 비어있지만, UI상 체크박스들이 체크되어 보일 수 있음
      //   → 전체목록선택 후 개별 체크박스를 추가로 체크해도 filter가 우선 적용됨
      // - 그 외의 경우(체크박스로 개별 선택한 경우)는 ids 사용
      if (effectiveMode === "all") {
        // 전체 목록 선택: 필터 기준으로 배정
        await CustomersService.assign({
          assignmentType: "filter",
          memberId: targetId as any,
          filterConditions: buildAssignmentFilterConditions(applied),
          expectedCount: total,
          projectId: projectId!,
        });
      } else {
        // 체크박스로 선택한 경우(또는 상세 모달에서 1명 배정): ID 기준으로 배정
        await CustomersService.assign({
          assignmentType: "ids",
          memberId: targetId as any,
          customerIds: effectiveIds,
          projectId: projectId!,
        });
      }
      clearSelection();
      setAssignFromDetailId(null);
      setAssignOpen(false);
      // 배정 성공 후 정렬 순서가 달라질 수 있으므로 1페이지로 리디렉션
      setPage(1);
      pushPage(1);
      await refetch();
    } catch (e) {
      throw e;
    }
  };

  const handleUnassign = async () => {
    const effectiveIds = assignFromDetailId != null ? [assignFromDetailId] : selectedIds;
    const effectiveMode = assignFromDetailId != null ? null : selectionMode;

    if (effectiveMode === "all") {
      await CustomersService.unassign({
        assignmentType: "filter",
        filterConditions: buildAssignmentFilterConditions(applied),
        expectedCount: total,
        projectId: projectId!,
      });
    } else if (effectiveIds.length > 0) {
      await CustomersService.unassign({
        assignmentType: "ids",
        customerIds: effectiveIds,
        projectId: projectId!,
      });
    }

    clearSelection();
    setAssignFromDetailId(null);
    setAssignOpen(false);
    setPage(1);
    pushPage(1);
    await refetch();
  };

  const handleAssignModalClose = useCallback(() => {
    setAssignOpen(false);
    setAssignFromDetailId(null);
  }, []);

  const handleDetailClose = useCallback(() => {
    setDetailId(null);
  }, []);

  const handleDetailDeleted = useCallback((deletedCustomerId: number) => {
    removeFromSelection([deletedCustomerId]);
    refetch();
    setDetailId(null);
  }, [removeFromSelection, refetch]);

  const handleDetailAssignClick = useCallback(() => {
    if (detailId == null) return;
    setAssignFromDetailId(detailId);
    setAssignOpen(true);
  }, [detailId]);

  if (!projectId) return null;

  return (
    <main className="md:min-h-[calc(100vh-54px)] bg-neutral-10">
      <div className="mx-auto max-w-[1324px] w-full px-0 md:px-6 lg:px-0 pt-0 md:pt-9 pb-0 md:pb-12">
      {/* Top panel: title + search */}
      <Panel
        className="rounded-none md:rounded-[14px] mb-0 md:mb-9"
        title={
          <div className="flex w-full min-w-0 items-center justify-between gap-3 md:items-start">
            <div className="flex min-w-0 items-end gap-3">
              <h1 className="translate-y-[3px] text-[20px] md:text-[24px] leading-[20px] font-bold text-neutral-90 px-1.5 md:px-0">고객목록</h1>
              <span className="hidden md:block w-px h-4 bg-neutral-60 opacity-40" />
              <p className="hidden md:block translate-y-[3px] text-[18px] leading-[20px] font-medium text-neutral-60">고객 데이터를 확인하고 관리하세요</p>
            </div>
            <CurrentProjectBadge
              projectName={project?.name}
              projectLogoUrl={project?.logoUrl}
              loading={isProjectLoading}
              className="max-w-[60%] justify-end md:max-w-[240px]"
            />
          </div>
        }
        bodyClassName="px-6 md:px-7 pb-4 md:pb-[22px] md:pt-[30px] md:border-t md:border-neutral-30"
      >
        <CustomersFilterBar
          filters={filters}
          onFilterChange={setFilters}
          onFilterOpen={() => setFilterOpen(true)}
          onSearch={(override) => applyFilters(override ?? filters)}
        />
        <FilterChips
          filters={applied}
          onRemove={removeFilterAndApply}
          onRemoveCategory={removeCategoryFilterAndApply}
          onRemoveDateRange={removeDateRangeFilterAndApply}
          onResetAll={handleFilterReset}
          teamOptions={teamOptions}
          memberOptions={memberOptions}
          shouldFetchPartners={(project?.isDataProvider ?? false) && isAdminOrSubAdmin}
        />
      </Panel>

      {/* Bottom panel: actions (top-right) + table */}
      <Panel
        className="rounded-none md:rounded-[14px] border-t border-neutral-30 md:border-t-0"
        action={
          <CustomersActions
            projectId={projectId!}
            appliedFilters={applied}
            selectedIds={selectedIds}
            selectionMode={selectionMode}
            total={total}
            selectedCount={selectionMode === "all" ? total : selectedIds.length}
            limit={limit}
            onLimitChange={handleLimitChange}
            onUploadSuccess={refetch}
            onAssignOpen={() => setAssignOpen(true)}
            onCreateOpen={() => setCreateOpen(true)}
            onSmsOpen={() => setSmsOpen(true)}
            onBulkScheduleOpen={() => setBulkScheduleOpen(true)}
            onShareSuccess={() => { refetch(); clearSelection(); }}
            onDeleteSuccess={() => { refetch(); clearSelection(); }}
            onCategoryChangeSuccess={() => { refetch(); clearSelection(); }}
            isDataProvider={project?.isDataProvider ?? false}
            showPartnerAssignButton={(project?.isDataProvider ?? false) && isAdminOrSubAdmin}
            showAssignButton={canAssignCustomer}
            showDeleteButton={isAdminOrSubAdmin}
            showExcelUploadButton={isAdminOrSubAdmin}
            showExcelDownloadButton={isAdminOrSubAdmin}
          />
        }
        headerClassName="px-6 md:px-7 py-4 md:py-6"
        bodyClassName="px-6 md:px-7 pb-2 md:pb-4 pt-0 overflow-x-auto flex flex-col"
      >
        <div className="min-h-[300px] md:min-h-[400px] flex-1">
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
          page={page}
          limit={limit}
          selectionMode={selectionMode}
          projectId={projectId}
          onRefetch={refetch}
          onFilterByContact={handleFilterByContact}
          isDataProvider={project?.isDataProvider ?? false}
          isDataProviderReady={!isProjectLoading}
          sortType={sortType}
          sortOrder={sortOrder}
          onToggleSort={toggleSort}
        />
        </div>
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
        onReset={handleFilterReset}
        projectId={projectId}
        isAdminOrSubAdmin={isAdminOrSubAdmin}
        isDataProvider={project?.isDataProvider ?? false}
        teamOptions={teamOptions}
        memberOptions={memberOptions}
      />

      <AssignCustomersModal
        open={isAssignOpen}
        onClose={handleAssignModalClose}
        selectedCustomerIds={assignFromDetailId != null ? [assignFromDetailId] : selectedIds}
        selectionMode={assignFromDetailId != null ? null : selectionMode}
        totalCount={assignFromDetailId != null ? 1 : total}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
        canUnassign={isAdminOrSubAdmin}
        projectId={projectId!}
      />

      <CustomerDetailModal
        open={detailId !== null}
        onClose={handleDetailClose}
        customerId={detailId}
        onCustomerUpdated={refetch}
        onCustomerDeleted={handleDetailDeleted}
        onAssignClick={detailId != null ? handleDetailAssignClick : undefined}
      />

      <CustomerCreateModal
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetch}
      />

      <SmsModal
        open={isSmsOpen}
        onClose={() => setSmsOpen(false)}
        customers={selectionMode === "all" ? customers : customers.filter((c) => selectedIds.includes(c.id))}
        selectionMode={selectionMode}
        appliedFilters={applied}
        totalCount={total}
        projectId={projectId!}
        onSuccess={() => {
          clearSelection();
          refetch();
        }}
      />

      <BulkScheduleCreateModal
        open={isBulkScheduleOpen}
        onClose={() => setBulkScheduleOpen(false)}
        onSuccess={() => {
          clearSelection();
          refetch();
        }}
        projectId={projectId!}
        selectedIds={selectedIds}
        selectionMode={selectionMode}
        appliedFilters={applied}
        total={total}
        selectedCount={selectionMode === "all" ? total : selectedIds.length}
      />
      </div>
    </main>
  );
}

export default function CustomersPageContent() {
  return (
    <Suspense fallback={null}>
      <CustomersPageContentInner />
    </Suspense>
  );
}

