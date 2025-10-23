export interface NoticeRecord {
  id: number;
  title: string;
  author: string;
  date: string;
  isImportant: boolean;
  content?: string;
  isMyNotice?: boolean; // 내가 작성한 공지사항인지 여부
}

export const mockNoticeData: NoticeRecord[] = [
  { 
    id: 1, 
    title: "2025년도 4분기 시스템 점검 안내", 
    author: "관리자", 
    date: "2025-10-01", 
    isImportant: true,
    content: "안녕하세요, 관리자입니다.\n\n2025년 4분기 시스템 점검을 안내드립니다.\n\n정기적인 시스템 점검을 통해 더욱 안정적인 서비스 제공을 위해 노력하고 있습니다.\n\n점검 중 일시적인 불편함이 있을 수 있으니 양해 부탁드립니다.\n\n더 나은 서비스로 찾아뵙겠습니다.\n\n감사합니다.",
    isMyNotice: true
  },
  { 
    id: 2, 
    title: "2025년 4분기 시스템 점검에 대한 공지사항입니다. 자세한 내용은 추후 안내드리겠습니다.", 
    author: "관리자", 
    date: "2025-10-01", 
    isImportant: true,
    content: "시스템 점검 관련 상세 내용은 추후 공지드리겠습니다.",
    isMyNotice: true
  },
  { 
    id: 3, 
    title: "세일즈 팀의 공지사항입니다. 여러분의 많은 관심 부탁드립니다.", 
    author: "개발팀", 
    date: "2025-10-01", 
    isImportant: false,
    content: "세일즈 팀에서 전하는 중요한 공지사항입니다.",
    isMyNotice: false
  },
  { 
    id: 4, 
    title: "고객 서비스 관련 공지사항입니다. 언제든지 문의해 주세요.", 
    author: "영업팀", 
    date: "2025-10-01", 
    isImportant: false,
    content: "고객 서비스 개선을 위한 공지사항입니다.",
    isMyNotice: false
  },
  { 
    id: 5, 
    title: "팀원들과 함께하는 공지사항입니다. 최선을 다하겠습니다.", 
    author: "관리자", 
    date: "2025-10-01", 
    isImportant: false,
    content: "팀원들과 함께 성장해 나가겠습니다.",
    isMyNotice: true
  },
  { 
    id: 6, 
    title: "새로운 도전에 대한 공지사항입니다. 열심히 임하겠습니다.", 
    author: "관리자", 
    date: "2025-10-01", 
    isImportant: false,
    content: "새로운 도전을 통해 더 나은 서비스를 제공하겠습니다.",
    isMyNotice: true
  },
  { 
    id: 7, 
    title: "현재 배정이 완료되지 않았습니다. 추후 공지하겠습니다.", 
    author: "관리자", 
    date: "2025-10-01", 
    isImportant: false,
    content: "배정 관련 사항은 추후 공지드리겠습니다.",
    isMyNotice: true
  },
];
