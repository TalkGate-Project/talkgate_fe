export interface TeamMember {
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

// 피그마 디자인에 맞는 조직도 데이터
export const mockTeamData: TeamMember[] = [
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
        name: '이온라인',
        avatar: '이',
        role: '팀장',
        department: '온라인영업팀',
        isLeader: true,
        level: 1,
        parentId: '1',
        children: [
          {
            id: '3',
            name: '정온라인',
            avatar: '정',
            role: '팀원',
            department: '온라인영업팀',
            isLeader: false,
            level: 2,
            parentId: '2',
            children: []
          }
        ]
      },
      {
        id: '4',
        name: '최지점장',
        avatar: '최',
        role: '지점장',
        department: '영업2지점',
        isLeader: true,
        level: 1,
        parentId: '1',
        children: [
          {
            id: '5',
            name: '김신규',
            avatar: '김',
            role: '팀원',
            department: '영업2지점',
            isLeader: false,
            level: 2,
            parentId: '4',
            children: []
          }
        ]
      },
      {
        id: '6',
        name: '이본부장',
        avatar: '이',
        role: '본부장',
        department: '영업1지점',
        isLeader: true,
        level: 1,
        parentId: '1',
        children: [
          {
            id: '7',
            name: '최리더',
            avatar: '최',
            role: '리더',
            department: '신규고객팀',
            isLeader: true,
            level: 2,
            parentId: '6',
            children: [
              {
                id: '8',
                name: '김신규',
                avatar: '김',
                role: '팀원',
                department: '신규고객팀',
                isLeader: false,
                level: 3,
                parentId: '7',
                children: []
              },
              {
                id: '9',
                name: '이개발',
                avatar: '이',
                role: '팀원',
                department: '신규고객팀',
                isLeader: false,
                level: 3,
                parentId: '7',
                children: []
              }
            ]
          }
        ]
      }
    ]
  }
];
