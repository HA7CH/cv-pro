import ResumeTemplate from "@/components/resume/ResumeTemplate";
import type { ResumeData } from "@/types/resume";

const sample: ResumeData = {
  username: "zhangxiaoming",
  header: { name: "张小明" },
  personalInfo: {
    email: "zhangxiaoming@example.com",
    phone: "+86 138-0000-1234",
  },
  contact: [
    { label: "www.zhangxiaoming.dev", url: "https://www.zhangxiaoming.dev" },
    { label: "github.com/zhangxiaoming", url: "https://github.com/zhangxiaoming" },
  ],
  education: [
    {
      school: "清华大学",
      degree: "人机交互硕士",
      major: "",
      startDate: "2024.09",
      endDate: "预计 2026.06",
    },
    {
      school: "北京大学",
      degree: "计算机科学学士，认知科学辅修",
      major: "",
      startDate: "2020.09",
      endDate: "2024.06",
    },
  ],
  experience: [
    {
      company: "启明 AI 实验室",
      role: "研究助理",
      startDate: "2025.01",
      endDate: "至今",
      bullets: [
        "研究多模态 AI 智能体如何与用户协同完成长文写作任务。",
        "设计并组织了 60 余人参与的两项受控实验，评估智能体的主动介入策略。",
        "参与撰写一篇拟投 ACM CHI 2026 的论文。",
      ],
    },
    {
      company: "北辰科技",
      role: "产品设计实习生",
      startDate: "2024.06",
      endDate: "2024.09",
      bullets: [
        "主导新一代 AI 编排产品的信息架构与视觉设计。",
        "搭建供 12 位设计师在 3 条产品线复用的 Figma 组件系统。",
        "上线的新用户引导流程使第 7 日留存提升 14%。",
      ],
    },
    {
      company: "蓝鲸网络",
      role: "前端工程师",
      startDate: "2023.08",
      endDate: "2024.05",
      bullets: [
        "为 200+ 标注员日常使用的内部数据标注平台开发前端面板。",
        "将旧 SCSS 体系迁移至基于 Tailwind 的设计系统，包体积减少 38%。",
        "指导两位初级工程师完成新人培养与首次生产发布。",
      ],
    },
  ],
  projectsDetailed: [
    {
      title: "主动式 AI 协同写作研究平台",
      type: "研究项目",
      startDate: "2025.01",
      bullets: [
        "端到端搭建研究平台：写作界面、实验员控制台与数据埋点链路。",
        "目前正在支撑一项 n=40 的实验室研究，关注智能体介入时机与信任校准。",
      ],
    },
    {
      title: "zhangxiaoming.dev — 个人作品集",
      type: "独立项目",
      startDate: "2024.03",
      url: "https://www.zhangxiaoming.dev",
      award: "入选 Awwwards Sites of the Day（2024.07）。",
      bullets: [
        "设计并开发了融合 WebGL 与程序化动效的 3D 交互作品集网站。",
        "用 MDX 与自定义版式组件撰写配套的长文案例研究。",
      ],
    },
  ],
  projectsRecent: [],
  skills: [
    { name: "AI & 编程", items: ["Python", "TypeScript", "OpenAI API", "LangChain"] },
    { name: "设计 & 原型设计", items: ["Figma", "Blender", "Rive", "WebGL"] },
    { name: "全栈开发", items: ["React", "Next.js", "Three.js", "Node.js", "Supabase"] },
    { name: "科研 & 研究方法", items: ["以人为中心的设计", "原型制作", "可用性测试"] },
  ],
  meta: { updatedAt: new Date().toISOString() },
};

export default function PreviewZhPage() {
  return <ResumeTemplate data={sample} />;
}
