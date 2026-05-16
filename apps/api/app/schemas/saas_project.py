from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BusinessModel, SaasCategory, SaasStage


class SaasProjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    category: SaasCategory | None = None
    stage: SaasStage = SaasStage.IDEA
    business_model: BusinessModel | None = None
    target_market: str | None = Field(default=None, max_length=255)
    target_audience: str | None = None
    country_focus: str | None = Field(default=None, max_length=100)
    main_problem: str | None = None
    value_proposition: str | None = None
    pricing_notes: str | None = None
    current_price: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=10)
    is_public_sample: bool = False


class SaasProjectCreate(SaasProjectBase):
    pass


class SaasProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    slug: str | None = Field(
        default=None, min_length=1, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
    )
    description: str | None = None
    category: SaasCategory | None = None
    stage: SaasStage | None = None
    business_model: BusinessModel | None = None
    target_market: str | None = Field(default=None, max_length=255)
    target_audience: str | None = None
    country_focus: str | None = Field(default=None, max_length=100)
    main_problem: str | None = None
    value_proposition: str | None = None
    pricing_notes: str | None = None
    current_price: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=10)
    is_public_sample: bool | None = None


class SaasProjectRead(SaasProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
