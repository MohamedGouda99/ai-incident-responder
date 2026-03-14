from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class AlertStatus(str, Enum):
    FIRING = "firing"
    ACKNOWLEDGED = "acknowledged"
    INVESTIGATING = "investigating"
    REMEDIATING = "remediating"
    RESOLVED = "resolved"


class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class AlertLabel(BaseModel):
    alertname: str = ""
    instance: str = ""
    job: str = ""
    severity: str = "warning"


class AlertAnnotation(BaseModel):
    summary: str = ""
    description: str = ""


class PrometheusAlert(BaseModel):
    status: str = "firing"
    labels: AlertLabel = Field(default_factory=AlertLabel)
    annotations: AlertAnnotation = Field(default_factory=AlertAnnotation)
    startsAt: str = ""
    endsAt: str = ""
    generatorURL: str = ""


class AlertManagerWebhook(BaseModel):
    version: str = "4"
    groupKey: str = ""
    status: str = "firing"
    receiver: str = ""
    groupLabels: dict[str, str] = Field(default_factory=dict)
    commonLabels: dict[str, str] = Field(default_factory=dict)
    commonAnnotations: dict[str, str] = Field(default_factory=dict)
    externalURL: str = ""
    alerts: list[PrometheusAlert] = Field(default_factory=list)


class RemediationStep(BaseModel):
    step_number: int
    description: str
    command: str | None = None
    is_automated: bool = False
    risk_level: str = "low"


class AIAnalysis(BaseModel):
    root_cause: str
    explanation: str
    remediation_steps: list[RemediationStep]
    confidence: float = Field(ge=0.0, le=1.0)
    sources: list[str] = Field(default_factory=list)
    estimated_impact: str = ""


class Incident(BaseModel):
    id: str
    alert_name: str
    severity: AlertSeverity
    status: AlertStatus
    description: str
    instance: str = ""
    labels: dict[str, str] = Field(default_factory=dict)
    ai_analysis: AIAnalysis | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: datetime | None = None


class IncidentUpdate(BaseModel):
    status: AlertStatus | None = None
    ai_analysis: AIAnalysis | None = None


class RunbookUpload(BaseModel):
    title: str
    content: str
    category: str = "general"
    tags: list[str] = Field(default_factory=list)


class RunbookMetadata(BaseModel):
    id: str
    title: str
    category: str
    tags: list[str]
    chunk_count: int
    created_at: datetime


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    services: dict[str, str] = Field(default_factory=dict)
