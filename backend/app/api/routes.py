from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.core.logging import logger
from app.models.schemas import (
    AIAnalysis,
    AlertManagerWebhook,
    AlertSeverity,
    AlertStatus,
    HealthResponse,
    Incident,
    IncidentUpdate,
    RunbookMetadata,
    RunbookUpload,
)
from app.services.incident_store import incident_store
from app.services.vector_store import vector_store
from app.agents.incident_agent import run_analysis

router = APIRouter()


async def _analyze_incident_bg(incident_id: str) -> None:
    incident = incident_store.get(incident_id)
    if not incident:
        return

    try:
        analysis = await run_analysis(
            alert_name=incident.alert_name,
            description=incident.description,
            severity=incident.severity.value,
            instance=incident.instance,
            labels=incident.labels,
        )
        incident_store.attach_analysis(incident_id, analysis)
    except Exception as e:
        logger.error("bg_analysis_failed", incident_id=incident_id, error=str(e))


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services={"vector_store": "ok", "incident_store": "ok"},
    )


@router.post("/webhook/alertmanager", response_model=list[Incident])
async def receive_alertmanager_webhook(
    webhook: AlertManagerWebhook,
    background_tasks: BackgroundTasks,
) -> list[Incident]:
    incidents = incident_store.create_from_webhook(webhook)

    for incident in incidents:
        background_tasks.add_task(_analyze_incident_bg, incident.id)

    logger.info("webhook_received", alerts=len(incidents), status=webhook.status)
    return incidents


@router.get("/incidents", response_model=list[Incident])
async def list_incidents(
    status: AlertStatus | None = None,
    severity: AlertSeverity | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Incident]:
    return incident_store.list_all(status=status, severity=severity, limit=limit, offset=offset)


@router.get("/incidents/stats")
async def get_incident_stats() -> dict:
    return incident_store.get_stats()


@router.get("/incidents/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str) -> Incident:
    incident = incident_store.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/incidents/{incident_id}", response_model=Incident)
async def update_incident(incident_id: str, update: IncidentUpdate) -> Incident:
    incident = incident_store.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if update.status:
        incident_store.update_status(incident_id, update.status)

    updated = incident_store.get(incident_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Incident not found")
    return updated


@router.post("/incidents/{incident_id}/analyze", response_model=AIAnalysis)
async def analyze_incident(incident_id: str) -> AIAnalysis:
    incident = incident_store.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    analysis = await run_analysis(
        alert_name=incident.alert_name,
        description=incident.description,
        severity=incident.severity.value,
        instance=incident.instance,
        labels=incident.labels,
    )

    incident_store.attach_analysis(incident_id, analysis)
    return analysis


@router.post("/runbooks", response_model=RunbookMetadata)
async def upload_runbook(runbook: RunbookUpload) -> RunbookMetadata:
    metadata = await vector_store.ingest_runbook(
        title=runbook.title,
        content=runbook.content,
        category=runbook.category,
        tags=runbook.tags,
    )
    return metadata


@router.get("/runbooks", response_model=list[RunbookMetadata])
async def list_runbooks() -> list[RunbookMetadata]:
    return await vector_store.list_runbooks()


@router.delete("/runbooks/{runbook_id}")
async def delete_runbook(runbook_id: str) -> dict:
    deleted = await vector_store.delete_runbook(runbook_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Runbook not found")
    return {"deleted": True, "runbook_id": runbook_id}


@router.post("/runbooks/search")
async def search_runbooks(query: str, k: int = 5) -> list[dict]:
    return await vector_store.search(query, k=k)
