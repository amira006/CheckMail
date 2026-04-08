#!/usr/bin/env python3
"""
SecureMail Backend - Flask API
Connecte le frontend React avec phishing_analyzer.py

Installation:
    pip install flask flask-cors

Lancement:
    python server.py

Le frontend React doit tourner sur http://localhost:3000
Ce backend tourne sur http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
import sys
import json

# Import direct du module analyzer
sys.path.insert(0, os.path.dirname(__file__))
from phishing_analyzer import analyze

app = Flask(__name__)
CORS(app)  # autorise les appels depuis localhost:3000

# ── /api/analyze ─────────────────────────────────────────────────────────────
@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    data = request.get_json(force=True)
    eml_content = data.get('emlContent', '')
    eml_name    = data.get('emlName', 'email.eml')

    if not eml_content:
        return jsonify({'error': 'Aucun contenu EML reçu'}), 400

    # Écrire le contenu dans un fichier temporaire (mode binaire !)
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.eml', delete=False) as tmp:
        tmp.write(eml_content.encode('utf-8', errors='replace'))
        tmp_path = tmp.name

    try:
        report = analyze(tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    # Construire le score de sécurité (0-100)
    raw_score  = report.get('score', 0)
    safe_score = max(0, min(100, 100 - raw_score))  # sécurisé entre 0 et 100
    verdict_map = {
        'SAFE': 'SAFE',
        'LOW_RISK': 'SAFE',
        'MODERATE_RISK': 'SUSPICIOUS',
        'HIGH_RISK': 'DANGEROUS',
        'PHISHING': 'DANGEROUS',
    }
    verdict = verdict_map.get(report.get('verdict', ''), 'SUSPICIOUS')
    summary = build_summary(report, verdict)

    result_json = {
        'score': safe_score,
        'verdict': verdict,
        'summary': summary,
        'checks': report.get('checks', []),
        'suspicious_urls': report.get('suspicious_urls', []),
        'raw_score': raw_score,
    }

    intro = build_intro_message(result_json, eml_name)
    chips = suggest_chips(verdict)

    return jsonify({
        'result': f"{intro}\nCHIPS: {' | '.join(chips)}",
        'report': result_json,
    })


# ── /api/chat ─────────────────────────────────────────────────────────────────
@app.route('/api/chat', methods=['POST'])
def api_chat():
    data = request.get_json(force=True)
    messages = data.get('messages', [])
    report = data.get('report', {})
    eml_snippet = data.get('emlSnippet', '')

    if not messages:
        return jsonify({'reply': 'Aucun message reçu.'}), 400

    system_prompt = f"""Tu es un expert en cybersécurité spécialisé dans la détection de phishing.
Tu analyses des emails et réponds aux questions de l'utilisateur en français de façon claire et pédagogique.
Rapport d'analyse :
- Score : {report.get('score', '?')}/100
- Verdict : {report.get('verdict', '?')}
- Résumé : {report.get('summary', '?')}
Vérifications effectuées :
{format_checks(report.get('checks', []))}
Extrait de l'email :
{eml_snippet[:1500] if eml_snippet else '(non disponible)'}
Réponds directement et professionnellement."""

    try:
        import urllib.request

        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        if not api_key:
            # Mode sans API
            reply = heuristic_reply(messages[-1].get('content', ''), report)
            return jsonify({'reply': reply})

        payload = json.dumps({
            'model': 'claude-sonnet-4-20250514',
            'max_tokens': 600,
            'system': system_prompt,
            'messages': [m for m in messages if not m.get('content', '').startswith('[CTX]')][-8:],
        }).encode('utf-8')

        req = urllib.request.Request(
            'https://api.anthropic.com/v1/messages',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
            },
            method='POST'
        )
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            reply = result['content'][0]['text']
        return jsonify({'reply': reply})

    except Exception:
        reply = heuristic_reply(messages[-1].get('content', ''), report)
        return jsonify({'reply': reply})


# ── Helpers ───────────────────────────────────────────────────────────────────
def build_summary(report, verdict):
    checks = report.get('checks', [])
    dangers = [c for c in checks if c['status'] == 'danger']
    warns = [c for c in checks if c['status'] == 'warn']
    oks = [c for c in checks if c['status'] == 'ok']

    if verdict == 'SAFE':
        return f"Email légitime. {len(oks)} vérifications réussies. SPF, DKIM et DMARC valides."
    elif verdict == 'SUSPICIOUS':
        items = ', '.join(c['message'][:40] for c in (dangers + warns)[:2])
        return f"Email suspect. Points d'attention : {items}."
    else:
        items = ', '.join(c['message'][:40] for c in dangers[:2])
        return f"Email dangereux. {len(dangers)} problème(s) critique(s) détecté(s) : {items}."


def build_intro_message(report, eml_name):
    verdict = report['verdict']
    score = report['score']
    checks = report['checks']
    dangers = [c for c in checks if c['status'] == 'danger']
    warns = [c for c in checks if c['status'] == 'warn']

    emoji = {'SAFE': '✅', 'SUSPICIOUS': '⚠️', 'DANGEROUS': '🚨'}.get(verdict, 'ℹ️')
    label = {'SAFE': 'sûr', 'SUSPICIOUS': 'suspect', 'DANGEROUS': 'dangereux'}.get(verdict, '?')

    lines = [f"{emoji} <strong>L'analyse de <em>{eml_name}</em> est terminée.</strong>"]
    lines.append(f"Score de sécurité : <strong>{score}/100</strong> — Email {label}.")

    if dangers:
        lines.append(f"<br>🔴 <strong>{len(dangers)} problème(s) critique(s) :</strong>")
        for d in dangers[:3]:
            lines.append(f"&nbsp;&nbsp;• {d['message']}")

    if warns:
        lines.append(f"<br>🟡 <strong>{len(warns)} avertissement(s) :</strong>")
        for w in warns[:2]:
            lines.append(f"&nbsp;&nbsp;• {w['message']}")

    lines.append("<br>Posez-moi vos questions sur cet email.")
    return '<br>'.join(lines)


def suggest_chips(verdict):
    if verdict == 'SAFE':
        return ['Pourquoi cet email est sûr ?', 'Que vérifie SPF/DKIM ?', 'Puis-je cliquer les liens ?']
    elif verdict == 'SUSPICIOUS':
        return ['Pourquoi cet email est suspect ?', 'Les liens sont-ils dangereux ?', 'Que faire maintenant ?']
    else:
        return ['Pourquoi est-ce du phishing ?', 'Comment me protéger ?', 'Signaler cet email ?']


def format_checks(checks):
    lines = []
    for c in checks:
        icon = {'ok': '✔', 'warn': '⚠', 'danger': '✘'}.get(c.get('status'), '-')
        lines.append(f"  {icon} [{c.get('category','?')}] {c.get('message','')} (+{c.get('points',0)} pts)")
    return '\n'.join(lines) if lines else '(aucune)'


def heuristic_reply(question, report):
    q = question.lower()
    v = report.get('verdict', 'SAFE')
    s = report.get('score', 100)
    chk = report.get('checks', [])

    if any(w in q for w in ['phishing', 'dangereux', 'suspect', 'risque', 'sûr', 'safe']):
        if v == 'SAFE':
            return f"✅ Cet email est sûr (score {s}/100). SPF, DKIM et DMARC valides."
        elif v == 'SUSPICIOUS':
            warns = [c['message'] for c in chk if c['status'] in ('warn', 'danger')][:2]
            return f"⚠️ Email suspect (score {s}/100). Points d'attention : {', '.join(warns)}."
        else:
            dangers = [c['message'] for c in chk if c['status'] == 'danger'][:2]
            return f"🚨 Email dangereux (score {s}/100). Problèmes : {', '.join(dangers)}."

    return f"Analyse : score {s}/100, verdict {v}."


if __name__ == '__main__':
    print("=" * 50)
    print("  SecureMail Backend démarré")
    print("  URL : http://localhost:5000")
    print("  Frontend React : http://localhost:3000")
    print("=" * 50)
    app.run(debug=True, port=5000)