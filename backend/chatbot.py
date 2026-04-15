#!/usr/bin/env python3
"""
CheckMail — Groq Chatbot
Double analyse : phishing_analyzer (heuristique) + LLaMA 3.3 (IA)
"""

import os
import json
import tempfile
from groq import Groq
from dotenv import load_dotenv
from phishing_analyzer import analyze as heuristic_analyze

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ── Helpers ────────────────────────────────────────────────────────────────
def _verdict_map(raw_verdict: str) -> str:
    """Convertit les verdicts heuristiques en SAFE / SUSPICIOUS / DANGEROUS."""
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
            f"  {icon} [{c.get('category','?')}] {c.get('message','')} (+{c.get('points',0)} pts)"
        )
    return "\n".join(lines) if lines else "(aucune)"


def _run_heuristic(eml_content: str) -> dict:
    """Écrit le contenu dans un fichier tmp et lance l'analyseur heuristique."""
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb", suffix=".eml", delete=False
        ) as tmp:
            tmp.write(eml_content.encode("utf-8", errors="replace"))
            tmp_path = tmp.name
        result = heuristic_analyze(tmp_path)
        os.unlink(tmp_path)
        return result
    except Exception as e:
        return {"score": 0, "verdict": "SAFE", "checks": [], "error": str(e)}


# ── Analyse principale ─────────────────────────────────────────────────────
def get_analysis(eml_content: str, eml_name: str = "email.eml") -> str:
    """
    Double analyse :
      1. phishing_analyzer → checks techniques (SPF, DKIM, URLs…)
      2. LLaMA 3.3 via Groq → enrichit le rapport avec ces données
    Retourne un JSON string : {"report": {...}, "message": "html..."}
    """
    # ── Étape 1 : analyse heuristique ─────────────────────────────────────
    heuristic = _run_heuristic(eml_content)
    raw_score = heuristic.get("score", 0)
    safe_score = max(0, min(100, 100 - raw_score))
    verdict = _verdict_map(heuristic.get("verdict", "SAFE"))
    checks_txt = _format_checks(heuristic.get("checks", []))
    susp_urls = heuristic.get("suspicious_urls", [])

    # ── Étape 2 : enrichissement IA ───────────────────────────────────────
    prompt = f"""Tu es un expert en cybersécurité. Voici les résultats d'une analyse heuristique d'un email.

Fichier : {eml_name}
Score de risque brut : {raw_score}/100 → Score de sécurité : {safe_score}/100
Verdict heuristique  : {verdict}
URLs suspectes       : {len(susp_urls)}

Vérifications effectuées :
{checks_txt}

Extrait de l'email :
---
{eml_content[:2500]}
---

Génère un rapport de sécurité. Réponds EXACTEMENT dans ce format :

JSON_START
{{"score": {safe_score}, "verdict": "{verdict}", "summary": "<1-2 phrases résumant le risque>", "recommendation": "<que faire concrètement>", "indicators": [<liste de 3-5 points clés string>]}}
JSON_END

Ensuite, donne une analyse courte en HTML simple (<b>, <br>, <ul><li>).
NE répète PAS le JSON. NE mets PAS de titre "Analyse de l'email".
Termine avec: CHIPS: <question1> | <question2> | <question3>"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=900,
        )
        raw = response.choices[0].message.content

        # Parser le JSON entre JSON_START / JSON_END
        rep = None
        if "JSON_START" in raw and "JSON_END" in raw:
            json_str = raw.split("JSON_START")[1].split("JSON_END")[0].strip()
            try:
                rep = json.loads(json_str)
            except Exception:
                pass

        # Fallback si le JSON est malformé
        if not rep:
            rep = {
                "score": safe_score,
                "verdict": verdict,
                "summary": heuristic.get("metadata", {}).get("subject", "Email analysé."),
                "recommendation": "Vérifiez manuellement cet email.",
                "indicators": [c["message"] for c in heuristic.get("checks", [])
                               if c["status"] in ("warn", "danger")][:5],
            }

        # Nettoyer le message HTML (retirer le bloc JSON)
        clean = raw
        if "JSON_START" in raw and "JSON_END" in raw:
            before = raw.split("JSON_START")[0]
            after = raw.split("JSON_END")[1]
            clean = (before + after).strip()

        # Ajouter les checks et URLs suspectes au rapport
        rep["checks"] = heuristic.get("checks", [])
        rep["suspicious_urls"] = susp_urls

        return json.dumps({"report": rep, "message": clean})

    except Exception as e:
        # Fallback complet sans IA
        fallback_report = {
            "score": safe_score,
            "verdict": verdict,
            "summary": f"Analyse heuristique uniquement (erreur IA : {str(e)[:60]}).",
            "recommendation": "Soyez prudent avec cet email.",
            "indicators": [c["message"] for c in heuristic.get("checks", [])
                           if c["status"] in ("warn", "danger")][:5],
            "checks": heuristic.get("checks", []),
            "suspicious_urls": susp_urls,
        }
        return json.dumps({
            "report": fallback_report,
            "message": f"⚠️ Analyse IA indisponible. Résultat heuristique : score {safe_score}/100, verdict {verdict}.",
        })


# ── Chat ───────────────────────────────────────────────────────────────────
def get_ai_reply(messages: list, email_content: str = "", report: dict = None) -> str:
    """Répond aux questions de l'utilisateur en se basant sur le rapport."""
    report = report or {}
    checks_txt = _format_checks(report.get("checks", []))

    report_ctx = f"""
Score de sécurité : {report.get('score', '?')}/100
Verdict           : {report.get('verdict', '?')}
Résumé            : {report.get('summary', '?')}
Recommandation    : {report.get('recommendation', '?')}
Vérifications     :
{checks_txt}
"""

    system_instruction = f"""You are a cybersecurity expert for CheckMail.
Help the user understand the risks of this email.
IMPORTANT: Always reply in the SAME LANGUAGE the user writes in.
- User writes in French → reply in French
- User writes in English → reply in English
- User writes in Arabic → reply in Arabic
{report_ctx}
Email extract:
---
{email_content[:2000] if email_content else '(unavailable)'}
---
Keep answers short and clear. Basic HTML allowed (<b>, <br>, <ul><li>).
NEVER display raw JSON in your reply."""

    groq_messages = [{"role": "system", "content": system_instruction}]
    for m in messages:
        if not m.get("content", "").startswith("[CTX]"):
            groq_messages.append({"role": m["role"], "content": m["content"]})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            max_tokens=500,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Erreur : {str(e)}"
