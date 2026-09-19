/**
 * ALLA AYURVEDA — FRONTEND 3
 * Workspace Navigation & Constants
 */

export const WORKSPACE_TABS = {
  DASHBOARD: "dashboard",
  MY_STUDIES: "my-studies",
  CREATE_STUDY: "create-study",
  STUDY_DETAILS: "study-details",
  EDIT_STUDY: "edit-study",
  PROTOCOL_BUILDER: "protocol-builder",
  DOCUMENTS: "documents",
  AI_QUALITY_GATE: "ai-quality-gate",
  PARTICIPANTS: "participants",
  NOTIFICATIONS: "notifications",
  PROFILE: "profile",
};

export const NAVIGATION_ITEMS = [
  {
    id: WORKSPACE_TABS.DASHBOARD,
    label: "Dashboard",
    icon: "LayoutDashboard",
    isComingSoon: false,
    description: "Overview of your ongoing studies, research milestones, and recent activity.",
  },
  {
    id: WORKSPACE_TABS.MY_STUDIES,
    label: "My Studies",
    icon: "BookOpen",
    isComingSoon: false,
    description: "View and manage all registered Ayurveda clinical research studies.",
  },
  {
    id: WORKSPACE_TABS.CREATE_STUDY,
    label: "Create Study",
    icon: "FolderPlus",
    isComingSoon: false,
    description: "Initialize a new Ayurveda research study and define study parameters.",
  },
  {
    id: WORKSPACE_TABS.PROTOCOL_BUILDER,
    label: "Protocol Builder",
    icon: "FileCode2",
    isComingSoon: false,
    description: "Build standardized clinical research protocols and formulations.",
  },
  {
    id: WORKSPACE_TABS.DOCUMENTS,
    label: "Documents",
    icon: "Files",
    isComingSoon: false,
    description: "Centralized document repository with versioning and audit trails.",
  },
  {
    id: WORKSPACE_TABS.AI_QUALITY_GATE,
    label: "AI Quality Gate",
    icon: "Sparkles",
    isComingSoon: false,
    description: "Automated AI validation for protocol consistency and completeness.",
  },
  {
    id: WORKSPACE_TABS.PARTICIPANTS,
    label: "Participants",
    icon: "Users",
    isComingSoon: false,
    description: "Manage clinical trial subject recruitment, eligibility, and informed consent.",
  },
  {
    id: WORKSPACE_TABS.NOTIFICATIONS,
    label: "Notifications",
    icon: "Bell",
    isComingSoon: false,
    description: "IEC review updates, verification alerts, and system notices.",
  },
  {
    id: WORKSPACE_TABS.PROFILE,
    label: "Profile",
    icon: "UserCheck",
    isComingSoon: false,
    description: "Researcher credentials, institutional affiliations, and settings.",
  },
];
