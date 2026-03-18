export const portfolioProfile = {
  brand: "Cloud Board Lab",
  role: "클라우드와 백엔드를 공부하는 학생 개발자",
  intro: [
    "로컬 개발부터 리눅스 서버 운영, 클라우드 배포까지 직접 경험하며 배우는 과정을 기록합니다.",
    "웹 CRUD, 데이터베이스, 인증, 파일 업로드, 배포 자동화를 한 프로젝트 안에서 차근차근 완성하는 것이 현재 목표입니다.",
  ],
  englishIntro:
    "A student developer building a portfolio-style blog while learning Linux, cloud infrastructure, and full-stack operations.",
  contactLinks: [
    { label: "GitHub", href: "https://github.com/hoyoung94" },
    { label: "Blog", href: "/blog" },
    { label: "Admin", href: "/admin" },
  ],
  quickFacts: [
    "TypeScript + Next.js App Router",
    "PostgreSQL + Prisma",
    "Auth.js 관리자 인증",
    "로컬 첨부파일 업로드 완료",
  ],
};

export const portfolioSections = [
  {
    id: "focus",
    title: "Current Focus",
    titleKo: "현재 집중하는 것",
    items: [
      {
        heading: "웹 CRUD와 관리자 기능 완성",
        period: "현재",
        description:
          "블로그와 게시판을 하나의 서비스 안에서 운영하면서 글 작성, 수정, 삭제, 카테고리, 태그, 첨부파일 흐름을 익히고 있습니다.",
        skills: ["Next.js", "Prisma", "PostgreSQL", "Auth.js"],
      },
      {
        heading: "리눅스와 서버 운영 감각 익히기",
        period: "학습 중",
        description:
          "Ubuntu VM에서 PM2, Nginx, 재배포 흐름을 직접 반복하며 운영 기본기를 쌓고 있습니다.",
        skills: ["Ubuntu", "Nginx", "PM2", "SSH"],
      },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    titleKo: "프로젝트",
    items: [
      {
        heading: "Cloud Board Lab",
        period: "진행 중",
        description:
          "포트폴리오형 홈, 블로그, 게시판, 관리자, 인증, 파일 업로드까지 포함한 실습용 서비스입니다.",
        skills: ["Next.js 16", "React 19", "Tailwind CSS", "Prisma"],
      },
      {
        heading: "Ubuntu Deploy Lab",
        period: "진행 중",
        description:
          "가상머신 Ubuntu에 직접 배포하고, 이후 같은 흐름을 클라우드 환경으로 옮기기 위한 연습 트랙입니다.",
        skills: ["Linux", "Node.js", "Nginx", "PM2"],
      },
    ],
  },
  {
    id: "activities",
    title: "Activities",
    titleKo: "학습 활동",
    items: [
      {
        heading: "기록 중심 학습",
        period: "상시",
        description:
          "실습 내용을 글로 다시 정리하면서 개념, 명령어, 트러블슈팅 과정을 남기고 있습니다.",
        skills: ["Documentation", "Troubleshooting", "Technical Writing"],
      },
      {
        heading: "클라우드/인프라 로드맵 정리",
        period: "상시",
        description:
          "로컬 개발 → 리눅스 서버 → 스토리지 분리 → 클라우드 배포 순서로 학습 경로를 단계적으로 밟고 있습니다.",
        skills: ["Cloud", "Infra", "Deployment", "Roadmapping"],
      },
    ],
  },
  {
    id: "education",
    title: "Education",
    titleKo: "배경",
    items: [
      {
        heading: "클라우드 컴퓨팅 학습 중",
        period: "현재",
        description:
          "학생 신분에서 웹 개발과 클라우드 운영을 함께 익히기 위해 실습 중심 프로젝트를 직접 구성해 진행하고 있습니다.",
        skills: ["Cloud Computing", "Linux", "Web Development"],
      },
    ],
  },
  {
    id: "certifications",
    title: "Planned Certifications",
    titleKo: "준비 중인 자격/주제",
    items: [
      {
        heading: "AWS / Linux / Network 기초 체력 강화",
        period: "예정",
        description:
          "서비스를 직접 운영할 수 있는 수준을 목표로 AWS, 리눅스, 네트워크 관련 학습을 병행합니다.",
        skills: ["AWS", "Linux", "Networking"],
      },
    ],
  },
] as const;

export const portfolioToc = portfolioSections.map((section) => ({
  id: section.id,
  label: section.titleKo,
}));
