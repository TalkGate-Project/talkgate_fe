"use client";

import { Suspense, useEffect, useState } from "react";
import Panel from "@/components/common/Panel";
import { useCustomersList } from "@/hooks/useCustomersList";
import { CustomerListItem } from "@/types/customers";
import FilterModal from "@/components/common/FilterModal";
import AssignCustomersModal from "@/components/customers/AssignCustomersModal";
import CustomerDetailModal from "@/components/customers/CustomerDetailModal";
import CustomerCreateModal from "@/components/customers/CustomerCreateModal";
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
    allSelectedOnPage,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
  } = useCustomersSelection();

  const [isFilterOpen, setFilterOpen] = useState(false);
  const [isAssignOpen, setAssignOpen] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const handleSelectAll = () => {
    toggleSelectAll(customers);
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
    setFilters((prev) => ({ ...prev, ...values }));
    setFilterOpen(false);
    setPage(1);
  };

  const handleAssign = async (targetId: number) => {
    try {
      await CustomersService.assign({
        assignmentType: "ids",
        memberId: targetId as any,
        customerIds: selectedIds,
        expectedCount: selectedIds.length,
        projectId: projectId!,
      });
      clearSelection();
      await refetch();
    } catch (e) {
      throw e;
    }
  };

  if (!projectId) return null;

  return (
    <main className="min-h-[calc(100vh-54px)] bg-neutral-10">
      <div className="mx-auto max-w-[1324px] w-full px-0 pt-6 pb-12">
      {/* Top panel: title + search */}
      <Panel
        className="rounded-[14px] mb-9"
        title={
          <div className="flex items-end gap-3">
            <h1 className="text-[24px] leading-[20px] font-bold text-neutral-90">고객목록</h1>
            <span className="w-px h-4 bg-neutral-60 opacity-60" />
            <p className="text-[18px] leading-[20px] font-medium text-neutral-60">고객 데이터를 확인하고 관리하세요</p>
          </div>
        }
        bodyClassName="px-7 pb-4 pt-7 border-t border-neutral-30"
      >
        <CustomersFilterBar
          filters={filters}
          onFilterChange={setFilters}
          onFilterOpen={() => setFilterOpen(true)}
          onSearch={applyFilters}
        />
        <FilterChips
          filters={filters}
          onRemove={removeFilterAndApply}
          onRemoveCategory={removeCategoryFilterAndApply}
          onRemoveDateRange={removeDateRangeFilterAndApply}
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
            onUploadSuccess={refetch}
            onAssignOpen={() => setAssignOpen(true)}
            onCreateOpen={() => setCreateOpen(true)}
          />
        }
        bodyClassName="px-7 pb-7 pt-0"
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
        />
        <CustomersPagination
          total={total}
          selectedCount={selectedIds.length}
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
      />

      <AssignCustomersModal
        open={isAssignOpen}
        onClose={() => setAssignOpen(false)}
        selectedCustomerIds={selectedIds}
        onAssign={handleAssign}
      />

      <CustomerDetailModal open={detailId !== null} onClose={() => setDetailId(null)} customerId={detailId} />

      <CustomerCreateModal
        open={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetch}
      />
      </div>
    </main>
  );
}

export default function CustomersPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-neutral-60">불러오는 중...</div>
      </main>
    }>
      <CustomersPage />
    </Suspense>
  );
}
