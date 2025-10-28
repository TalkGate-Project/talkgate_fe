"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
  isLeader: boolean;
  level: number;
  parentId?: string;
  children?: TeamMember[];
  isExpanded?: boolean;
}

interface ViewMode {
  type: 'list' | 'tree';
}

export default function TeamManagementSettings() {
  const [viewMode, setViewMode] = useState<ViewMode>({ type: 'list' });
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<TeamMember | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  // Tree canvas pan/zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 조직도 데이터
  // 팀/멤버 트리 데이터 (드래그앤드랍으로 재배치될 수 있으므로 setter 필요)
  const [teamData, setTeamData] = useState<TeamMember[]>([
    {
      id: '1',
      name: '박본부장',
      avatar: '박',
      role: '본부장',
      department: '영업본부',
      isLeader: true,
      level: 0,
      children: [
        {
          id: '2',
          name: '이본부장',
          avatar: '이',
          role: '본부장',
          department: '영업1지점',
          isLeader: true,
          level: 1,
          parentId: '1',
          children: [
            {
              id: '3',
              name: '최리더',
              avatar: '최',
              role: '리더',
              department: '신규고객팀',
              isLeader: true,
              level: 2,
              parentId: '2',
              children: [
                {
                  id: '4',
                  name: '김신규',
                  avatar: '김',
                  role: '팀원',
                  department: '신규고객팀',
                  isLeader: false,
                  level: 3,
                  parentId: '3'
                },
                {
                  id: '5',
                  name: '이개발',
                  avatar: '이',
                  role: '팀원',
                  department: '신규고객팀',
                  isLeader: false,
                  level: 3,
                  parentId: '3'
                }
              ]
            }
          ]
        },
        {
          id: '6',
          name: '이온라인',
          avatar: '이',
          role: '팀장',
          department: '온라인영업팀',
          isLeader: true,
          level: 1,
          parentId: '1',
          children: [
            {
              id: '7',
              name: '정온라인',
              avatar: '정',
              role: '팀원',
              department: '온라인영업팀',
              isLeader: false,
              level: 2,
              parentId: '6',
              children: [
                {
                  id: '8',
                  name: '김신규',
                  avatar: '김',
                  role: '팀원',
                  department: '온라인영업팀',
                  isLeader: false,
                  level: 3,
                  parentId: '7'
                }
              ]
            }
          ]
        },
        {
          id: '9',
          name: '최지점장',
          avatar: '최',
          role: '지점장',
          department: '영업2지점',
          isLeader: true,
          level: 1,
          parentId: '1',
          children: [
            {
              id: '10',
              name: '김신규',
              avatar: '김',
              role: '팀원',
              department: '영업2지점',
              isLeader: false,
              level: 2,
              parentId: '9'
            }
          ]
        }
      ]
    }
  ]);

  const handleViewModeChange = (mode: 'list' | 'tree') => {
    setViewMode({ type: mode });
  };

  // Design tokens used across list/tree (spacing, connector, node sizes)
  const TOKENS = {
    connector: { rootWidth: 1.5, width: 1, depth0: '#E2E2E2', depthN: '#E9E9E9' },
    node: {
      specs: {
        0: { w: 148, h: 44, avatar: 32 },
        1: { w: 136, h: 44, avatar: 28 },
        n: { w: 120, h: 40, avatar: 24 },
      },
    },
    gaps: { verticalRoot: 24, vertical: 20, horizontalDesktop: 24, horizontalTablet: 16 },
  } as const;

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // 검색 시 관련 조직도 펼치기
    if (term) {
      const expandedSet = new Set<string>();
      // 검색어와 일치하는 항목의 부모들을 모두 펼치기
      const findAndExpandParents = (items: TeamMember[], parentIds: string[] = []) => {
        items.forEach(item => {
          if (item.name.toLowerCase().includes(term.toLowerCase()) || 
              item.department.toLowerCase().includes(term.toLowerCase())) {
            parentIds.forEach(parentId => expandedSet.add(parentId));
          }
          if (item.children) {
            findAndExpandParents(item.children, [...parentIds, item.id]);
          }
        });
      };
      findAndExpandParents(teamData);
      setExpandedItems(expandedSet);
    } else {
      setExpandedItems(new Set());
    }
  };

  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderListItems = (items: TeamMember[], parentLevel: number = 0) => {
    return items.map((item, index) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems.has(item.id);
      const indentLevel = item.level * 24; // 24px per level
      
      return (
        <div key={item.id} className="relative mb-2">
          {/* Vertical line for hierarchy */}
          {item.level > 0 && (
            <>
              <div 
                className="absolute left-0 top-0 bottom-0 w-px"
                style={{ left: `${indentLevel - 12}px`, background: '#E2E2E2' }}
              />
              {/* elbow connector */}
              <div 
                className="absolute h-px"
                style={{ left: `${indentLevel - 12}px`, top: 34, width: 12, background: '#E2E2E2' }}
              />
            </>
          )}
          
          <div 
            className={`flex items-center px-6 py-5 gap-4 border border-[#E2E2E2] rounded-[12px] cursor-move transition-all ${
              item.isLeader 
                ? 'bg-gradient-to-r from-[rgba(214,250,232,0.3)] to-[rgba(214,250,232,0.3)]' 
                : 'bg-white'
            } ${searchTerm && (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              item.department.toLowerCase().includes(searchTerm.toLowerCase())) ? 'ring-2 ring-blue-300' : ''} ${
              dragOverItem === item.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''
            } ${draggedItem?.id === item.id ? 'opacity-50' : ''}`}
            style={{ marginLeft: `${indentLevel}px` }}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
            onDragEnd={handleDragEnd}
          >
            {/* Expand/Collapse button */}
            {hasChildren && (
              <button
                onClick={() => toggleExpand(item.id)}
                className="w-6 h-6 flex items-center justify-center border border-[#E2E2E2] rounded-[5px] transform rotate-90 hover:bg-gray-50 transition-colors"
              >
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M9 18L15 12L9 6" 
                    stroke="#B0B0B0" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[14px] font-semibold ${
              item.isLeader ? 'bg-[#00B55B]' : 'bg-[#808080]'
            }`}>
              {item.avatar}
            </div>
            
            {/* Name */}
            <div className="text-[16px] font-semibold text-[#000000]">
              {item.name}
            </div>
            
            {/* Department tag */}
            <div className="px-3 py-1 bg-[#D3E1FE] rounded-[30px]">
              <span className="text-[12px] font-medium text-[#4D82F3]">
                {item.department}
              </span>
            </div>
          </div>
          
          {/* Render children if expanded */}
          {hasChildren && isExpanded && (
            <div className="ml-0">
              {renderListItems(item.children!, item.level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Simple pan/zoom handlers (Ctrl+wheel zoom, Middle/Shift drag pan)
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom((z) => {
      const next = Math.min(2, Math.max(0.6, z - e.deltaY * 0.0015));
      return Number(next.toFixed(2));
    });
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 1 && !e.shiftKey) return;
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan.x, pan.y]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanningRef.current) return;
    setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
  }, []);

  const onMouseUp = useCallback(() => { isPanningRef.current = false; }, []);

  const renderTreeView = () => {
    return (
      <div className="relative min-h-[500px] overflow-auto" onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} role="tree" aria-label="조직도 트리">
        <div className="p-8">
          {/* Pannable/zoomable canvas */}
          <div className="relative" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center top' }}>
            {/* Root level */}
            <div className="flex justify-center mb-8">
              {teamData.map((rootItem) => (
                <div key={rootItem.id} className="relative">
                  {renderTreeNode(rootItem, 0)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTreeNode = (item: TeamMember, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const spec = level === 0 ? TOKENS.node.specs[0] : level === 1 ? TOKENS.node.specs[1] : TOKENS.node.specs.n;
    const nodeMinWidth = `${spec.w}px`;
    const nodeHeight = `${spec.h}px`;
    const connectorColor = level === 0 ? TOKENS.connector.depth0 : TOKENS.connector.depthN;
    const connectorWidth = level === 0 ? TOKENS.connector.rootWidth : TOKENS.connector.width;
    const verticalToChildren = level === 0 ? 18 : 14; // px
    const childrenTopPadding = level === 0 ? 18 : 14; // px

    return (
      <div className="relative">
        {/* Department badge above node, truncation for long labels */}
        <div className="absolute -top-[22px] left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D3E1FE] rounded-[30px] max-w-[160px]">
          <span className="block text-[12px] font-medium text-[#4D82F3] opacity-80 truncate" title={item.department}>{item.department}</span>
        </div>

        {/* Node pill: focus-visible ring, drag handle zone, leader tint */}
        <div className={`group relative flex items-center px-4 gap-3 border border-[#E2E2E2] rounded-[12px] cursor-move transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4D82F3]/40 ${
          item.isLeader 
            ? 'bg-gradient-to-b from-[rgba(214,250,232,0.3)] to-[rgba(214,250,232,0.3)]' 
            : 'bg-white'
        } ${dragOverItem === item.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''} ${
          draggedItem?.id === item.id ? 'opacity-50' : ''
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, item)}
        onDragOver={(e) => handleDragOver(e, item.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, item.id)}
        onDragEnd={handleDragEnd}
        role="treeitem"
        aria-label={`${item.department} ${item.name}`}
        aria-grabbed={draggedItem?.id === item.id}
        style={{ minWidth: nodeMinWidth, height: nodeHeight }}
        >
          {/* Drag handle (visible on hover) */}
          <div className="hidden group-hover:flex items-center justify-center text-[#B0B0B0] cursor-grab active:cursor-grabbing" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 4h2v2H7V4zm4 0h2v2h-2V4zM7 9h2v2H7V9zm4 0h2v2h-2V9zM7 14h2v2H7v-2zm4 0h2v2h-2v-2z" fill="#B0B0B0"/></svg>
          </div>
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[14px] font-semibold ${
            item.isLeader ? 'bg-[#00B55B]' : 'bg-[#808080]'
          }`}>
            {item.avatar}
          </div>
          {/* Name */}
          <div className="text-[16px] font-semibold text-[#000000] tracking-[0.2px]">{item.name}</div>
          {/* Role chip (optional) */}
          {item.isLeader && (
            <div className="ml-1 px-2 py-0.5 rounded-[30px] bg-[#E8F5E8]">
              <span className="text-[10px] font-semibold text-[#00B55B]">리더</span>
            </div>
          )}

          {/* Hover tooltip with meta info */}
          <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] bg-[#252525] text-white text-[12px] px-2 py-1 rounded shadow-md whitespace-nowrap">
            {item.department} · {item.role}
          </div>
        </div>
        
        {/* Children */}
        <AnimatePresence initial={false}>
          {hasChildren && (
            <motion.div className="relative mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              {/* Vertical connector from parent to children */}
              <div
                className="absolute left-1/2 top-0 transform -translate-x-1/2"
                style={{ width: connectorWidth, height: verticalToChildren, background: connectorColor, borderRadius: 9999 }}
              />

              {/* Horizontal connector across children */}
              <div className="relative flex justify-center items-start gap-6 md:gap-6 sm:gap-4"
                   style={{ paddingTop: childrenTopPadding }}>
                <div className="absolute top-0 h-px rounded"
                     style={{ left: '12px', right: '12px', background: connectorColor }} />

                {item.children!.map((child) => (
                  <div key={child.id} className="relative pt-4">
                    {/* Vertical drop from horizontal to child */}
                    <div className="absolute top-0 left-1/2 rounded"
                      style={{ width: connectorWidth, height: 16, background: connectorColor, transform: 'translateX(-50%)' }}
                    />
                    {/* Child node */}
                    <div className="pt-4">
                      {renderTreeNode(child, level + 1)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const flattenTeamData = (items: TeamMember[], level: number = 0): TeamMember[] => {
    let result: TeamMember[] = [];
    items.forEach(item => {
      result.push({ ...item, level });
      if (item.children) {
        result = result.concat(flattenTeamData(item.children, level + 1));
      }
    });
    return result;
  };

  // ===== Drag & Drop 재배치 유틸리티 =====
  // 트리에서 특정 id 노드를 제거하고, 제거된 노드와 갱신된 트리를 반환
  function removeNodeById(items: TeamMember[], targetId: string): { next: TeamMember[]; removed: TeamMember | null } {
    let removed: TeamMember | null = null;
    const next = items.map((n) => ({ ...n, children: n.children ? [...n.children] : undefined }));
    function walk(arr: TeamMember[]): TeamMember[] {
      const out: TeamMember[] = [];
      for (const node of arr) {
        if (node.id === targetId) {
          removed = { ...node };
          continue;
        }
        if (node.children && node.children.length) {
          node.children = walk(node.children);
        }
        out.push(node);
      }
      return out;
    }
    return { next: walk(next), removed };
  }

  // 트리에서 특정 id의 노드 정보를 찾음 (부모 id와 현재 레벨 포함)
  function findNodeInfo(items: TeamMember[], targetId: string, parentId?: string, level: number = 0): { node: TeamMember; parentId?: string; level: number } | null {
    for (const node of items) {
      if (node.id === targetId) return { node, parentId, level: node.level ?? level } as any;
      if (node.children) {
        const found = findNodeInfo(node.children, targetId, node.id, (node.level ?? level) + 1);
        if (found) return found;
      }
    }
    return null;
  }

  // 노드 및 하위 노드의 level과 parentId를 일괄 갱신
  function updateLevels(node: TeamMember, baseLevel: number, parentId?: string) {
    node.level = baseLevel;
    node.parentId = parentId;
    if (node.children && node.children.length) {
      node.children = node.children.map((c) => {
        const copy = { ...c };
        updateLevels(copy, baseLevel + 1, node.id);
        return copy;
      });
    }
  }

  // 대상(targetId)의 형제 다음 위치로 노드를 삽입 (동일 부모의 다음 순서)
  function insertAfterSibling(items: TeamMember[], targetId: string, node: TeamMember, newParentId?: string, newLevel: number = 0): TeamMember[] {
    const clone = items.map((n) => ({ ...n, children: n.children ? [...n.children] : undefined }));
    function walk(arr: TeamMember[], parentId?: string): TeamMember[] {
      const out: TeamMember[] = [];
      for (let i = 0; i < arr.length; i++) {
        const cur = arr[i];
        out.push(cur);
        if (cur.id === targetId) {
          const toInsert = { ...node };
          updateLevels(toInsert, newLevel, newParentId);
          out.splice(out.length, 0, toInsert);
        }
        if (cur.children && cur.children.length) {
          cur.children = walk(cur.children, cur.id);
        }
      }
      return out;
    }
    return walk(clone);
  }

  // 드래그 앤 드롭 핸들러들
  const handleDragStart = (e: React.DragEvent, item: TeamMember) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(targetId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem || draggedItem.id === targetId) {
      setDraggedItem(null);
      return;
    }

    // 1) 소스 노드 제거
    const { next: withoutSource, removed } = removeNodeById(teamData, draggedItem.id);
    if (!removed) {
      setDraggedItem(null);
      return;
    }

    // 2) 타겟 정보 조회 (타겟의 부모/레벨 확인)
    const info = findNodeInfo(withoutSource, targetId);
    if (!info) {
      setDraggedItem(null);
      return;
    }

    // 3) 소스 노드를 타겟의 다음 형제 위치로 삽입 (동일 부모)
    const updated = insertAfterSibling(withoutSource, targetId, removed, info.parentId, info.level);

    // 4) 트리 상태 갱신
    setTeamData(updated);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <div className="w-full h-full bg-white rounded-[14px] p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[24px] font-bold text-[#252525]">팀관리</h1>
        <button className="px-4 py-2 bg-[#252525] text-[#D0D0D0] rounded-[5px] text-[14px] font-semibold hover:bg-[#333333] transition-colors">
          팀 생성
        </button>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-[#E2E2E2] mb-6 opacity-50" />

      {/* Organization Chart Info */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[16px] font-semibold text-[#000000] mb-2">조직도 정보</h2>
          <p className="text-[14px] text-[#808080]">
            조직 및 멤버를 드래그하여 자유롭게 이동할 수 있습니다.
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex border border-[#E2E2E2] rounded-[5px]">
          <button
            onClick={() => handleViewModeChange('list')}
            className={`flex items-center gap-2 px-3 py-2 rounded-l-[5px] text-[14px] font-medium transition-colors ${
              viewMode.type === 'list'
                ? 'bg-[#252525] text-white'
                : 'bg-white text-[#808080] hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            리스트
          </button>
          <button
            onClick={() => handleViewModeChange('tree')}
            className={`flex items-center gap-2 px-3 py-2 rounded-r-[5px] text-[14px] font-medium transition-colors ${
              viewMode.type === 'tree'
                ? 'bg-[#252525] text-white'
                : 'bg-white text-[#808080] hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h18v18H3V3zM9 9h6v6H9V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            트리
          </button>
        </div>
      </div>

      {/* Search Bar (only for list view) */}
      {viewMode.type === 'list' && (
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="직원 및 팀 이름을 검색하세요"
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-[5px] text-[14px] text-[#808080] focus:outline-none focus:border-[#252525]"
            />
          </div>
          <button className="px-4 py-2 bg-[#252525] text-[#D0D0D0] rounded-[5px] text-[14px] font-semibold hover:bg-[#333333] transition-colors">
            검색
          </button>
        </div>
      )}

      {/* Filter Tags (only for list view) */}
      {viewMode.type === 'list' && (
        <div className="flex gap-2 mb-6">
          {['영업본부', '영업1지점', '신규고객팀', '온라인영업팀', '영업2지점'].map((tag) => (
            <div key={tag} className="px-3 py-1 bg-[#E2E2E2] rounded-[30px]">
              <span className="text-[12px] font-medium text-[#595959]">
                {tag}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="w-full h-px bg-[#E2E2E2] mb-6" />

      {/* Content Area */}
      <div className="relative">
        {viewMode.type === 'list' ? renderListItems(teamData) : renderTreeView()}
      </div>
    </div>
  );
}