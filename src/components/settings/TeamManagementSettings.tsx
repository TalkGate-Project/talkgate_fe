"use client";

import { useState } from "react";

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

  // 조직도 데이터
  const [teamData] = useState<TeamMember[]>([
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
            <div 
              className="absolute left-0 top-0 bottom-0 w-px bg-[#F8F8F8]"
              style={{ left: `${indentLevel - 12}px` }}
            />
          )}
          
          <div 
            className={`flex items-center px-6 py-5 gap-4 border border-[#E2E2E2] rounded-[12px] cursor-move transition-all ${
              item.isLeader 
                ? 'bg-gradient-to-r from-[rgba(214,250,232,0.3)] to-[rgba(214,250,232,0.3)]' 
                : 'bg-[#F8F8F8]'
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

  const renderTreeView = () => {
    return (
      <div className="relative min-h-[500px] overflow-auto">
        <div className="p-8">
          {/* Root level */}
          <div className="flex justify-center mb-8">
            {teamData.map((rootItem) => (
              <div key={rootItem.id} className="relative">
                {renderTreeNode(rootItem)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTreeNode = (item: TeamMember) => {
    const hasChildren = item.children && item.children.length > 0;
    
    return (
      <div className="relative">
        {/* Node */}
        <div className={`flex flex-col items-center p-4 border border-[#E2E2E2] rounded-[12px] min-w-[120px] cursor-move transition-all ${
          item.isLeader 
            ? 'bg-gradient-to-b from-[rgba(214,250,232,0.3)] to-[rgba(214,250,232,0.3)]' 
            : 'bg-[#F8F8F8]'
        } ${dragOverItem === item.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''} ${
          draggedItem?.id === item.id ? 'opacity-50' : ''
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, item)}
        onDragOver={(e) => handleDragOver(e, item.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, item.id)}
        onDragEnd={handleDragEnd}>
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-[16px] font-semibold mb-2 ${
            item.isLeader ? 'bg-[#00B55B]' : 'bg-[#808080]'
          }`}>
            {item.avatar}
          </div>
          
          {/* Name */}
          <div className="text-[14px] font-semibold text-[#000000] text-center mb-1">
            {item.name}
          </div>
          
          {/* Department tag */}
          <div className="px-2 py-1 bg-[#D3E1FE] rounded-[30px]">
            <span className="text-[10px] font-medium text-[#4D82F3]">
              {item.department}
            </span>
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && (
          <div className="relative mt-4">
            {/* Vertical line from parent to children */}
            <div className="absolute left-1/2 top-0 w-px h-4 bg-[#F8F8F8] transform -translate-x-1/2" />
            
            {/* Horizontal line connecting children */}
            <div className="relative flex justify-center items-start gap-8 pt-4">
              {item.children!.map((child, index) => (
                <div key={child.id} className="relative">
                  {/* Horizontal line to child */}
                  <div className={`absolute top-0 w-8 h-px bg-[#F8F8F8] ${
                    index === 0 ? 'left-0' : index === item.children!.length - 1 ? 'right-0' : 'left-1/2 transform -translate-x-1/2'
                  }`} />
                  
                  {/* Vertical line from horizontal to child */}
                  <div className="absolute top-0 left-1/2 w-px h-4 bg-[#F8F8F8] transform -translate-x-1/2" />
                  
                  {/* Child node */}
                  <div className="pt-4">
                    {renderTreeNode(child)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

    // 드래그 앤 드롭 로직 구현
    console.log(`Moving ${draggedItem.name} to ${targetId}`);
    // 실제 구현에서는 여기서 데이터 구조를 업데이트해야 합니다.
    
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