from __future__ import annotations

import json
from typing import Any, TypedDict

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser
from langgraph.graph import StateGraph, END

from app.core.config import get_settings
from app.core.logging import logger
from app.models.schemas import AIAnalysis, RemediationStep
from app.services.vector_store import vector_store

settings = get_settings()


class AgentState(TypedDict):
    alert_name: str
    description: str
    severity: str
    instance: str
    labels: dict[str, str]
    runbook_context: list[dict]
    analysis: AIAnalysis | None
    error: str | None


ANALYSIS_SYSTEM_PROMPT = """You are an expert Site Reliability Engineer AI assistant.
You analyze infrastructure alerts, determine root causes, and provide actionable remediation steps.

You will receive:
1. Alert details (name, severity, description, instance)
2. Relevant runbook excerpts from the organization's knowledge base

Your job is to:
- Identify the most likely root cause
- Explain the issue clearly
- Provide step-by-step remediation instructions
- Rate your confidence (0.0 to 1.0) based on how well the runbooks match
- Note which runbook sources informed your analysis

IMPORTANT: Respond ONLY with valid JSON matching this schema:
{
  "root_cause": "Brief root cause description",
  "explanation": "Detailed technical explanation of the issue",
  "remediation_steps": [
    {
      "step_number": 1,
      "description": "What this step does",
      "command": "optional shell command or null",
      "is_automated": false,
      "risk_level": "low|medium|high"
    }
  ],
  "confidence": 0.85,
  "sources": ["runbook title or section that informed this"],
  "estimated_impact": "Description of blast radius and user impact"
}"""


async def retrieve_context(state: AgentState) -> AgentState:
    query = f"{state['alert_name']} {state['description']} {state['severity']}"
    try:
        results = await vector_store.search(query, k=5)
        state["runbook_context"] = results
        logger.info("context_retrieved", alert=state["alert_name"], docs=len(results))
    except Exception as e:
        logger.error("context_retrieval_failed", error=str(e))
        state["runbook_context"] = []
    return state


async def analyze_incident(state: AgentState) -> AgentState:
    llm = ChatOpenAI(
        model=settings.openai_model,
        temperature=0.1,
        openai_api_key=settings.openai_api_key,
    )

    context_text = "\n\n---\n\n".join(
        f"[Source: {doc['metadata'].get('title', 'Unknown')}]\n{doc['content']}"
        for doc in state["runbook_context"]
    ) if state["runbook_context"] else "No relevant runbooks found. Use your general SRE knowledge."

    user_prompt = f"""## Alert Details
- **Name**: {state['alert_name']}
- **Severity**: {state['severity']}
- **Description**: {state['description']}
- **Instance**: {state['instance']}
- **Labels**: {json.dumps(state['labels'])}

## Relevant Runbook Context
{context_text}

Analyze this alert and provide your diagnosis and remediation plan."""

    try:
        response = await llm.ainvoke([
            SystemMessage(content=ANALYSIS_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ])

        parser = JsonOutputParser()
        parsed = await parser.ainvoke(response)

        steps = [
            RemediationStep(**step) if isinstance(step, dict) else step
            for step in parsed.get("remediation_steps", [])
        ]

        state["analysis"] = AIAnalysis(
            root_cause=parsed["root_cause"],
            explanation=parsed["explanation"],
            remediation_steps=steps,
            confidence=parsed.get("confidence", 0.5),
            sources=parsed.get("sources", []),
            estimated_impact=parsed.get("estimated_impact", "Unknown"),
        )
        logger.info("incident_analyzed", alert=state["alert_name"], confidence=state["analysis"].confidence)
    except Exception as e:
        logger.error("analysis_failed", error=str(e), alert=state["alert_name"])
        state["error"] = str(e)
        state["analysis"] = AIAnalysis(
            root_cause="Analysis failed",
            explanation=f"The AI analysis encountered an error: {e}. Please investigate manually.",
            remediation_steps=[
                RemediationStep(
                    step_number=1,
                    description="Check the alert manually in your monitoring system",
                    risk_level="low",
                )
            ],
            confidence=0.0,
            sources=[],
            estimated_impact="Unable to determine",
        )

    return state


def build_incident_agent() -> Any:
    workflow = StateGraph(AgentState)

    workflow.add_node("retrieve_context", retrieve_context)
    workflow.add_node("analyze_incident", analyze_incident)

    workflow.set_entry_point("retrieve_context")
    workflow.add_edge("retrieve_context", "analyze_incident")
    workflow.add_edge("analyze_incident", END)

    return workflow.compile()


incident_agent = build_incident_agent()


async def run_analysis(
    alert_name: str,
    description: str,
    severity: str,
    instance: str = "",
    labels: dict[str, str] | None = None,
) -> AIAnalysis:
    state: AgentState = {
        "alert_name": alert_name,
        "description": description,
        "severity": severity,
        "instance": instance,
        "labels": labels or {},
        "runbook_context": [],
        "analysis": None,
        "error": None,
    }

    result = await incident_agent.ainvoke(state)

    if result["analysis"] is None:
        raise RuntimeError(f"Agent failed to produce analysis: {result.get('error', 'unknown error')}")

    return result["analysis"]
