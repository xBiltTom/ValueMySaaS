import { BusinessModel, SaasCategory, SaasProject, SaasProjectListResponse, SaasStage } from "@/types/api";

export type CreateSaasProjectPayload = {
  name: string;
  description?: string;
  category?: SaasCategory;
  stage: SaasStage;
  business_model?: BusinessModel;
  target_market?: string;
  target_audience?: string;
  country_focus?: string;
  main_problem?: string;
  value_proposition?: string;
  pricing_notes?: string;
  current_price?: number;
  currency: string;
  is_public_sample: boolean;
};

export type { BusinessModel, SaasCategory, SaasProject, SaasProjectListResponse, SaasStage };
