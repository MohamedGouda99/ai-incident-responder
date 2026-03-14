import uuid
from datetime import datetime

from app.core.logging import logger
from app.models.schemas import (
    AIAnalysis,
    AlertManagerWebhook,
    AlertSeverity,
    AlertStatus,
    Incident,
)


class IncidentStore:
    def __init__(self) -> None:
        self._incidents: dict[str, Incident] = {}

    def create_from_webhook(self, webhook: AlertManagerWebhook) -> list[Incident]:
        created: list[Incident] = []

        for alert in webhook.alerts:
            severity_raw = alert.labels.severity.lower()
            severity = AlertSeverity(severity_raw) if severity_raw in AlertSeverity.__members__.values() else AlertSeverity.WARNING

            incident = Incident(
                id=str(uuid.uuid4()),
                alert_name=alert.labels.alertname or webhook.commonLabels.get("alertname", "unknown"),
                severity=severity,
                status=AlertStatus.FIRING,
                description=alert.annotations.summary or alert.annotations.description or "No description",
                instance=alert.labels.instance,
                labels={**webhook.commonLabels, **dict(alert.labels)},
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )

            self._incidents[incident.id] = incident
            created.append(incident)
            logger.info("incident_created", incident_id=incident.id, alert=incident.alert_name)

        return created

    def get(self, incident_id: str) -> Incident | None:
        return self._incidents.get(incident_id)

    def list_all(
        self,
        status: AlertStatus | None = None,
        severity: AlertSeverity | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Incident]:
        incidents = list(self._incidents.values())

        if status:
            incidents = [i for i in incidents if i.status == status]
        if severity:
            incidents = [i for i in incidents if i.severity == severity]

        incidents.sort(key=lambda i: i.created_at, reverse=True)
        return incidents[offset : offset + limit]

    def update_status(self, incident_id: str, status: AlertStatus) -> Incident | None:
        incident = self._incidents.get(incident_id)
        if not incident:
            return None

        incident.status = status
        incident.updated_at = datetime.utcnow()

        if status == AlertStatus.RESOLVED:
            incident.resolved_at = datetime.utcnow()

        logger.info("incident_updated", incident_id=incident_id, status=status)
        return incident

    def attach_analysis(self, incident_id: str, analysis: AIAnalysis) -> Incident | None:
        incident = self._incidents.get(incident_id)
        if not incident:
            return None

        incident.ai_analysis = analysis
        incident.status = AlertStatus.INVESTIGATING
        incident.updated_at = datetime.utcnow()

        logger.info("analysis_attached", incident_id=incident_id, confidence=analysis.confidence)
        return incident

    def get_stats(self) -> dict:
        incidents = list(self._incidents.values())
        return {
            "total": len(incidents),
            "firing": sum(1 for i in incidents if i.status == AlertStatus.FIRING),
            "investigating": sum(1 for i in incidents if i.status == AlertStatus.INVESTIGATING),
            "resolved": sum(1 for i in incidents if i.status == AlertStatus.RESOLVED),
            "critical": sum(1 for i in incidents if i.severity == AlertSeverity.CRITICAL),
            "warning": sum(1 for i in incidents if i.severity == AlertSeverity.WARNING),
        }


incident_store = IncidentStore()
