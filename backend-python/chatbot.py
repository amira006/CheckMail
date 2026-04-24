#!/usr/bin/env python3
"""
CheckMail — Groq Chatbot (Optimised)
Heuristic phishing analysis + lightweight AI explanation
"""

import os
import json
import tempfile
from groq import Groq
from dotenv import load_dotenv
from phishing_analyzer import analyze as heuristic_analyze

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL = "llama-3.1-8b-instant"   # ⚡ faster + fewer tokens


# ── Helpers ─────────────────────────────────────────────

def _is_rate_limit(error: Exception) -> bool:
    err = str(error)
    return "429" in err or "rate_limit" in err.lower()


def _verdict_map(raw_verdict: str) -> str:
    return {
        "SAFE": "SAFE",
        "LOW_RISK": "SAFE",
        "MODERATE_RISK": "SUSPICIOUS",
        "HIGH_RISK": "DANGEROUS",
        "PHISHING": "DANGEROUS",
    }.get(str(raw_verdict).upper(), "SUSPICIOUS")


def _format_checks(checks: list) -> str:
    lines = []
    for c in checks:
        icon = {"ok": "✔", "warn": "⚠", "danger": "✘"}.get(c.get("status"), "-")
        lines.append(
            f"{icon} {c.get('message','')} (+{c.get('points',0)})"
        )
    return "\n".join(lines) if lines else "(none)"


def _run_heuristic(eml_content: str) -> dict:
    try:
        with tempfile.NamedTemporaryFile(mode="wb", suffix=".eml", delete=False) as tmp:
            tmp.write(eml_content.encode("utf-8", errors="replace"))
            tmp_path = tmp.name

        result = heuristic_analyze(tmp_path)
        os.unlink(tmp_path)

        return result

    except Exception as e:
        return {"score": 0, "verdict": "SAFE", "checks": [], "error": str(e)}


# ── Email Analysis ──────────────────────────────────────

def get_analysis(eml_content: str, eml_name: str = "email.eml") -> str:

    heuristic = _run_heuristic(eml_content)

    raw_score = heuristic.get("score", 0)
    safe_score = max(0, min(100, 100 - raw_score))

    verdict = _verdict_map(heuristic.get("verdict", "SAFE"))
    checks_txt = _format_checks(heuristic.get("checks", []))
    susp_urls = heuristic.get("suspicious_urls", [])

    # ⚡ Optimised prompt
    prompt = f"""
Email security analysis.

File: {eml_name}
Score: {safe_score}/100
Verdict: {verdict}
Suspicious URLs: {len(susp_urls)}

Checks:
{checks_txt}

Email extract:
{eml_content[:1200]}

Return EXACTLY:

JSON_START
{{"score": {safe_score}, "verdict": "{verdict}", "summary": "", "recommendation": "", "indicators": []}}
JSON_END

Then give a short HTML explanation (<b>, <br>, <ul><li>).
End with:
CHIPS: question1 | question2 | question3
"""

    try:

        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400
        )

        raw = response.choices[0].message.content

        rep = None

        if "JSON_START" in raw and "JSON_END" in raw:
            json_str = raw.split("JSON_START")[1].split("JSON_END")[0].strip()
            try:
                rep = json.loads(json_str)
            except Exception:
                pass

        if not rep:
            rep = {
                "score": safe_score,
                "verdict": verdict,
                "summary": "Email analysed.",
                "recommendation": "Verify sender before interacting.",
                "indicators": [
                    c["message"] for c in heuristic.get("checks", [])
                    if c["status"] in ("warn", "danger")
                ][:5],
            }

        clean = raw

        if "JSON_START" in raw and "JSON_END" in raw:
            before = raw.split("JSON_START")[0]
            after = raw.split("JSON_END")[1]
            clean = (before + after).strip()

        rep["checks"] = heuristic.get("checks", [])
        rep["suspicious_urls"] = susp_urls

        return json.dumps({"report": rep, "message": clean})

    except Exception as e:

        if _is_rate_limit(e):
            return json.dumps({"error": "rate_limit"})

        fallback_report = {
            "score": safe_score,
            "verdict": verdict,
            "summary": "Heuristic analysis only.",
            "recommendation": "Be cautious with this email.",
            "indicators": [
                c["message"] for c in heuristic.get("checks", [])
                if c["status"] in ("warn", "danger")
            ][:5],
            "checks": heuristic.get("checks", []),
            "suspicious_urls": susp_urls,
        }

        return json.dumps({
            "report": fallback_report,
            "message": f"⚠️ AI unavailable. Heuristic result: score {safe_score}/100."
        })


# ── Chatbot ─────────────────────────────────────────────

def get_ai_reply(messages: list, email_content: str = "", report: dict = None) -> str:

    report = report or {}

    report_ctx = f"""
Score: {report.get('score','?')}/100
Verdict: {report.get('verdict','?')}
Summary: {report.get('summary','?')}
Recommendation: {report.get('recommendation','?')}
"""

    system_instruction = f"""
You are a cybersecurity assistant for CheckMail.

Answer user questions about email risks.

Reply in the SAME LANGUAGE as the user.

{report_ctx}

Email extract:
{email_content[:800] if email_content else '(none)'}

Keep answers short.
Use simple HTML (<b>, <br>, <ul><li>).
Never show JSON.
"""

    groq_messages = [{"role": "system", "content": system_instruction}]

    for m in messages:
        groq_messages.append({
            "role": m["role"],
            "content": m["content"]
        })

    try:

        response = client.chat.completions.create(
            model=MODEL,
            messages=groq_messages,
            max_tokens=300
        )

        return response.choices[0].message.content

    except Exception as e:

        if _is_rate_limit(e):
            return "__RATE_LIMIT__"

        return f"Error: {str(e)}"
