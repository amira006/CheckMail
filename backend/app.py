#!/usr/bin/env python3
"""
CheckMail Backend — Flask API
Modules : chatbot.py       (get_analysis, get_ai_reply)
          pdf_generator.py (generate_pdf)
Port    : 5002
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json

from chatbot import get_analysis, get_ai_reply
from pdf_generator import generate_pdf

app = Flask(__name__)
CORS(app)


# ── /api/analyze ───────────────────────────────────────────────────────────
@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True) or {}
    eml_content = data.get("emlContent", "")
    eml_name = data.get("emlName", "email.eml")

    if not eml_content:
        return jsonify({"error": "Aucun contenu email reçu."}), 400

    # get_analysis retourne un JSON string {"report": {...}, "message": "..."}
    raw = get_analysis(eml_content, eml_name)

    try:
        parsed = json.loads(raw)
    except Exception:
        parsed = {"report": None, "message": raw}

    report = parsed.get("report") or {}
    message = parsed.get("message", "")

    # Extraire les CHIPS si présents dans le message
    chips = []
    if "CHIPS:" in message:
        chips_line = message.split("CHIPS:")[-1].strip().splitlines()[0]
        chips = [c.strip() for c in chips_line.split("|") if c.strip()][:3]
        message = message[:message.rfind("CHIPS:")].strip()

    # Chips par défaut selon verdict
    if not chips:
        v = report.get("verdict", "")
        if v == "SAFE":
            chips = ["Pourquoi cet email est sûr ?", "Que vérifie SPF/DKIM ?", "Puis-je cliquer les liens ?"]
        elif v == "SUSPICIOUS":
            chips = ["Pourquoi est-il suspect ?", "Les liens sont-ils dangereux ?", "Que faire maintenant ?"]
        else:
            chips = ["Pourquoi est-ce du phishing ?", "Comment me protéger ?", "Signaler cet email ?"]

    return jsonify({
        "report": report,   # objet direct → frontend lit data.report
        "result": message,  # HTML affiché dans le chat
        "chips": chips,
    })


# ── /api/chat ──────────────────────────────────────────────────────────────
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    messages = data.get("messages", [])
    eml_snippet = data.get("emlSnippet", data.get("email_content", ""))
    report = data.get("report") or {}

    if not messages:
        return jsonify({"reply": "Aucun message reçu."}), 400

    reply = get_ai_reply(messages, eml_snippet, report)
    return jsonify({"reply": reply})


# ── /api/report/export ────────────────────────────────────────────────────
@app.route("/api/report/export", methods=["POST"])
def export_pdf():
    try:
        data = request.get_json(silent=True) or {}
        report = data.get("report") or {}
        meta = data.get("meta") or {}

        buffer = generate_pdf(report, meta)
        verdict = str(report.get("verdict", "UNKNOWN")).upper()
        score = int(report.get("score", 0))

        return send_file(
            buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"CheckMail_{verdict}_{score}.pdf",
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Main ───────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 50)
    print("  CheckMail Backend — port 5002")
    print("  Frontend React  — http://localhost:3000")
    print("=" * 50)
    app.run(debug=True, port=5002)
