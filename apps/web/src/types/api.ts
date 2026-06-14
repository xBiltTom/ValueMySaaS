export type UserRole = "USER" | "ADMIN";

export type User = {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: UserRole;
  ai_credits: number;
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

export type DecisionRecommendation =
  | "CONTINUE"
  | "IMPROVE"
  | "PIVOT"
  | "PAUSE"
  | "DISCARD"
  | "INSUFFICIENT_DATA";

export type MaybeNumber = number | string | null;

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

export type MetricSnapshot = {
  id: string;
  saas_project_id: string;
  period_label: string | null;
  captured_at: string;
  created_at: string;
  updated_at: string;
  mrr: MaybeNumber;
  arr: MaybeNumber;
  monthly_revenue: MaybeNumber;
  monthly_costs: MaybeNumber;
  gross_profit: MaybeNumber;
  net_profit: MaybeNumber;
  cash_available: MaybeNumber;
  burn_rate: MaybeNumber;
  total_users: number | null;
  active_users: number | null;
  paying_customers: number | null;
  new_users: number | null;
  new_paying_customers: number | null;
  churned_customers: number | null;
  cac: MaybeNumber;
  marketing_spend: MaybeNumber;
  churn_rate: MaybeNumber;
  retention_rate: MaybeNumber;
  conversion_rate: MaybeNumber;
  arpu: MaybeNumber;
  ltv: MaybeNumber;
  ltv_cac_ratio: MaybeNumber;
  payback_months: MaybeNumber;
  growth_rate: MaybeNumber;
  runway_months: MaybeNumber;
  nps: MaybeNumber;
  avg_session_minutes: MaybeNumber;
  support_tickets: number | null;
  critical_bugs: number | null;
  uptime_percentage: MaybeNumber;
  custom_metrics: Record<string, unknown> | null;
  notes: string | null;
};

export type MetricSnapshotListResponse = {
  items: MetricSnapshot[];
  total: number;
  limit: number;
  offset: number;
};

export type CalculatedMetric = {
  value: MaybeNumber;
  source: "provided" | "calculated" | "missing";
  formula: string | null;
  explanation: string;
};

export type MetricCalculationResponse = {
  project_id: string;
  snapshot_id: string;
  snapshot_captured_at: string;
  previous_snapshot_id: string | null;
  calculation_version: string;
  metrics: Record<string, CalculatedMetric>;
  warnings: string[];
  summary: {
    provided_metrics_count: number;
    calculated_metrics_count: number;
    missing_metrics_count: number;
  };
};

export type SaasScore = {
  id: string;
  saas_project_id: string;
  metric_snapshot_id: string | null;
  overall_score: MaybeNumber;
  financial_score: MaybeNumber;
  growth_score: MaybeNumber;
  retention_score: MaybeNumber;
  product_score: MaybeNumber;
  risk_score: MaybeNumber;
  sustainability_level: SustainabilityLevel;
  decision_recommendation: DecisionRecommendation;
  strengths: Array<Record<string, unknown>> | null;
  weaknesses: Array<Record<string, unknown>> | null;
  alerts: Array<Record<string, unknown>> | null;
  recommendations: Array<Record<string, unknown>> | null;
  scoring_version: string;
  created_at: string;
};

export type SaasScoreListResponse = {
  items: SaasScore[];
  total: number;
  limit: number;
  offset: number;
};

export type IdeaVerdict = "BUILD" | "VALIDATE_FIRST" | "RETHINK";
export type InfrastructureComplexity = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type PlanningAiOutput = {
  overall_score: number;
  problem_clarity_score: number;
  value_prop_score: number;
  market_fit_score: number;
  business_model_score: number;
  pricing_feasibility_score: number;
  verdict: IdeaVerdict;
  verdict_rationale: string;
  market_size_estimate: string;
  infrastructure_complexity: InfrastructureComplexity;
  breakeven_customers: string;
  strengths: string[];
  risks: string[];
  next_steps: string[];
  analysis_id: string;
};

export type ProjectDashboardResponse = {
  project: {
    id: string;
    name: string;
    slug: string;
    stage: SaasStage;
    category: SaasCategory | null;
    business_model: BusinessModel | null;
    current_price: MaybeNumber;
    currency: string;
  };
  latest_snapshot: {
    id: string;
    period_label: string | null;
    captured_at: string;
  } | null;
  latest_score: {
    overall_score: MaybeNumber;
    financial_score: MaybeNumber;
    growth_score: MaybeNumber;
    retention_score: MaybeNumber;
    product_score: MaybeNumber;
    risk_score: MaybeNumber;
    sustainability_level: SustainabilityLevel;
    decision_recommendation: DecisionRecommendation;
  } | null;
  metric_cards: Record<string, MaybeNumber>;
  alerts: Array<Record<string, unknown>>;
  recommendations: Array<Record<string, unknown>>;
  series: Record<
    "mrr" | "monthly_revenue" | "paying_customers" | "active_users" | "churn_rate" | "overall_score",
    Array<{ date: string; label: string | null; value: MaybeNumber }>
  >;
  planning_ai_output: PlanningAiOutput | null;
};

export type ReportType = "BASIC" | "EXECUTIVE" | "AI_ASSISTED" | "SCENARIO_SIMULATION";
export type ReportStatus = "DRAFT" | "GENERATED" | "FAILED";

export type SaasReport = {
  id: string;
  saas_project_id: string;
  user_id: string;
  metric_snapshot_id: string | null;
  score_id: string | null;
  ai_analysis_id: string | null;
  title: string;
  report_type: ReportType;
  status: ReportStatus;
  content: Record<string, unknown> | null;
  file_url: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SaasReportListResponse = {
  items: SaasReport[];
  total: number;
  limit: number;
  offset: number;
};

export type AiProvider = "OPENAI" | "GEMINI" | "ANTHROPIC" | "OPENROUTER" | "GROQ" | "NVIDIA" | "OTHER";

export type AiKey = {
  id: string;
  provider: AiProvider;
  label: string | null;
  key_last_four: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AiKeyListResponse = {
  items: AiKey[];
  total: number;
  limit: number;
  offset: number;
};

export type VerifyAiKeyResponse = {
  ok: boolean;
  provider: AiProvider;
  model_name: string;
  message: string;
};

export type AiAnalysisType =
  | "EXECUTIVE_SUMMARY"
  | "RISK_ANALYSIS"
  | "PRICING_ANALYSIS"
  | "GROWTH_ANALYSIS"
  | "RETENTION_ANALYSIS"
  | "FULL_DIAGNOSIS"
  | "CUSTOM";

export type AiAnalysis = {
  id: string;
  saas_project_id: string;
  metric_snapshot_id: string | null;
  score_id: string | null;
  user_id: string;
  provider: AiProvider;
  model_name: string | null;
  analysis_type: AiAnalysisType;
  prompt_version: string;
  input_context: Record<string, unknown> | null;
  output_text: string;
  output_json: Record<string, unknown> | null;
  tokens_input: number | null;
  tokens_output: number | null;
  estimated_cost: string | number | null;
  created_at: string;
  // Planning-specific structured output
  planning_output?: PlanningAiOutput | null;
};

export type AiAnalysisListResponse = {
  items: AiAnalysis[];
  total: number;
  limit: number;
  offset: number;
};

export type ConversationStatus = "ACTIVE" | "ARCHIVED" | "DELETED";

export type Conversation = {
  id: string;
  saas_project_id: string;
  user_id: string;
  title: string | null;
  provider: AiProvider | null;
  model_name: string | null;
  system_prompt_version: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  total_messages?: number;
};

export type ConversationListResponse = {
  items: Conversation[];
  total: number;
  limit: number;
  offset: number;
};

export type ConversationMessageRole = "SYSTEM" | "USER" | "ASSISTANT" | "TOOL";

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  role: ConversationMessageRole;
  content: string;
  message_metadata: Record<string, unknown> | null;
  token_count: number | null;
  created_at: string;
};

export type ConversationMessageListResponse = {
  items: ConversationMessage[];
  total: number;
  limit: number;
  offset: number;
};

export type SendConversationMessageResponse = {
  conversation_id: string;
  user_message: ConversationMessage;
  assistant_message: ConversationMessage;
  model_name: string;
  provider: AiProvider;
};
