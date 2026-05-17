export type UserRole = "USER" | "ADMIN";

export type User = {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
};

export type SaasCategory =
  | "EDTECH"
  | "FINTECH"
  | "HEALTHTECH"
  | "PRODUCTIVITY"
  | "MARKETING"
  | "ECOMMERCE"
  | "AI"
  | "DEVELOPER_TOOLS"
  | "OTHER";

export type SaasStage = "IDEA" | "PLANNING" | "MVP" | "LAUNCHED" | "GROWING" | "PAUSED";

export type BusinessModel =
  | "B2B"
  | "B2C"
  | "B2B2C"
  | "FREEMIUM"
  | "SUBSCRIPTION"
  | "ONE_TIME"
  | "OTHER";

export type SustainabilityLevel =
  | "HEALTHY"
  | "VIABLE_WITH_ADJUSTMENTS"
  | "RISKY"
  | "UNSUSTAINABLE"
  | "INSUFFICIENT_DATA";

export type SaasProject = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string | null;
  category: SaasCategory | null;
  stage: SaasStage;
  business_model: BusinessModel | null;
  target_market: string | null;
  target_audience: string | null;
  country_focus: string | null;
  main_problem: string | null;
  value_proposition: string | null;
  pricing_notes: string | null;
  current_price: string | number | null;
  currency: string;
  is_public_sample: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SaasProjectListResponse = {
  items: SaasProject[];
  total: number;
  limit: number;
  offset: number;
};

export type DashboardRecommendation = {
  priority: string;
  title: string;
  message: string;
};

export type PortfolioDashboardResponse = {
  total_projects: number;
  projects_by_stage: Record<string, number>;
  projects_by_category: Record<string, number>;
  average_overall_score: string | number | null;
  scores_by_sustainability: Record<string, number>;
  healthiest_project: {
    project_id: string;
    name: string;
    slug: string;
    overall_score: string | number | null;
    sustainability_level: SustainabilityLevel | null;
  } | null;
  riskiest_project: {
    project_id: string;
    name: string;
    slug: string;
    overall_score: string | number | null;
    sustainability_level: SustainabilityLevel | null;
  } | null;
  recent_projects: Array<{
    project_id: string;
    name: string;
    slug: string;
    stage: SaasStage;
    category: SaasCategory | null;
    created_at: string;
  }>;
  high_alert_projects: Array<{
    project_id: string;
    name: string;
    slug: string;
    alerts: Array<Record<string, unknown>>;
  }>;
  global_recommendations: DashboardRecommendation[];
};
