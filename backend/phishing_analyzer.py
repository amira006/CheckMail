#!/usr/bin/env python3
"""
EML Phishing Analyzer - JSON Output
Usage: python phishing_analyzer.py <fichier.eml>
Output: JSON sur stdout
"""

import email
import re
import sys
import socket
import urllib.parse
import json
from email.parser import BytesParser
from email import policy


def analyze(filepath):
    result = {
        "file": filepath,
        "score": 0,
        "verdict": "",
        "is_phishing": False,
        "checks": []
    }

    def flag(category, message, points, status):
        result["score"] += points
        result["checks"].append({
            "category": category,
            "message": message,
            "points": points,
            "status": status
        })

    # LOAD
    try:
        with open(filepath, "rb") as f:
            msg = BytesParser(policy=policy.compat32).parse(f)
    except Exception as e:
        result["error"] = str(e)
        return result

    result["metadata"] = {
        "subject":    msg.get("Subject", ""),
        "from":       msg.get("From", ""),
        "to":         msg.get("To", ""),
        "date":       msg.get("Date", ""),
        "message_id": msg.get("Message-ID", "")
    }

    def extract_domain(addr):
        m = re.search(r'@([\w.\-]+)', addr or "")
        return m.group(1).lower() if m else ""

    def get_body():
        text=""
        for part in msg.walk():
            if part.get_content_type() in ("text/plain", "text/html"):
                try:
                    text+=part.get_payload(decode=True).decode("utf-8", errors="replace")
                except:
                    pass
        return text

    # 1. HEADERS
    from_addr=msg.get("From", "")
    reply_to=msg.get("Reply-To", "")
    return_path=msg.get("Return-Path", "")
    
    from_domain=extract_domain(from_addr)
    rp_domain=extract_domain(return_path)
    rt_domain=extract_domain(reply_to)

    if from_domain and rp_domain and from_domain != rp_domain:
        flag("headers", f"FROM domain ({from_domain}) != Return-Path ({rp_domain})", 20, "warn")
    else:
        flag("headers", "FROM et Return-Path coherents", 0, "ok")

    if reply_to and rt_domain and from_domain and rt_domain != from_domain:
        flag("headers", f"Reply-To ({rt_domain}) different du FROM", 25, "danger")
    else:
        flag("headers", "Pas de Reply-To suspect", 0, "ok")

    name_match = re.match(r'^(.*?)\s*<(.+?)>', from_addr)
    if name_match:
        display = name_match.group(1).strip().lower()
        trusted = ["paypal","amazon","google","microsoft","apple","bank",
                   "netflix","instagram","facebook","dhl","fedex","support","security","admin"]
        for t in trusted:
            if t in display and t not in extract_domain(from_addr):
                flag("headers", f"Nom affiche '{display}' usurpe une marque connue", 30, "danger")
                break
        else:
            flag("headers", "Nom affiche coherent avec l'adresse", 0, "ok")

    subject = msg.get("Subject", "")
    urgent_words = ["urgent","action required","verify","suspended","account",
                    "password","confirm","invoice","payment","alert","warning",
                    "deactivat","expir","limited"]
    hits = [w for w in urgent_words if w.lower() in subject.lower()]
    if len(hits) >= 2:
        flag("headers", f"Sujet tres alarmiste: {hits}", 15, "danger")
    elif hits:
        flag("headers", f"Sujet legerement alarmiste: {hits}", 5, "warn")
    else:
        flag("headers", "Sujet neutre", 0, "ok")

    # 2. AUTHENTICATION
    auth = (msg.get("Authentication-Results", "") or "") + " " + \
           (msg.get("ARC-Authentication-Results", "") or "")

    for proto in ["spf", "dkim", "dmarc"]:
        m = re.search(rf'{proto}=(\w+)', auth, re.IGNORECASE)
        res = m.group(1).lower() if m else None
        if res is None:
            flag("auth", f"{proto.upper()} absent", 10, "warn")
        elif res == "pass":
            flag("auth", f"{proto.upper()} = PASS", 0, "ok")
        elif res in ("fail", "hardfail"):
            flag("auth", f"{proto.upper()} = FAIL", 30, "danger")
        else:
            flag("auth", f"{proto.upper()} = {res}", 10, "warn")

    # 3. RECEIVED CHAIN
    received_list = msg.get_all("Received") or []
    if len(received_list) == 0:
        flag("routing", "Aucun header Received", 20, "danger")
    elif len(received_list) > 8:
        flag("routing", f"Nombre eleve de sauts: {len(received_list)}", 10, "warn")
    else:
        flag("routing", f"Chaine Received normale ({len(received_list)} sauts)", 0, "ok")

    # 4. LINKS
    body = get_body()
    urls = list(set(re.findall(r'https?://[^\s"\'<>]+', body)))
    shorteners = ["bit.ly","tinyurl","t.co","goo.gl","ow.ly","short.io","rebrand.ly","cutt.ly"]
    susp_kw    = ["login","verify","secure","update","confirm","signin","password","recover","suspended"]
    suspicious_urls = []

    for url in urls[:30]:
        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc.lower()
        path   = parsed.path.lower()
        reasons = []
        if any(s in domain for s in shorteners):
            reasons.append("raccourcisseur d'URL")
        if any(k in domain or k in path for k in susp_kw):
            reasons.append("mot-cle suspect dans l'URL")
        if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', domain):
            reasons.append("IP brute comme domaine")
        if re.search(r'[^\x00-\x7F]', domain):
            reasons.append("caracteres Unicode dans le domaine")
        if domain.count('.') > 4:
            reasons.append("trop de sous-domaines")
        if reasons:
            suspicious_urls.append({"url": url[:120], "reasons": reasons})

    if suspicious_urls:
        flag("links", f"{len(suspicious_urls)} URL(s) suspecte(s)", len(suspicious_urls) * 5, "danger")
        result["suspicious_urls"] = suspicious_urls
    else:
        flag("links", "Aucune URL suspecte", 0, "ok")

    # 5. CONTENT
    plain = ""
    for part in msg.walk():
        if part.get_content_type() == "text/plain":
            try:
                plain += part.get_payload(decode=True).decode("utf-8", errors="replace")
            except:
                pass

    if plain:
        text_lower = plain.lower()
        urgency_phrases = ["act now","immediate action","limited time","expire",
                           "suspended","deactivated","verify your","confirm your",
                           "click here","update your payment","unauthorized access"]
        hits_u = [p for p in urgency_phrases if p in text_lower]
        if len(hits_u) >= 3:
            flag("content", f"Langage d'urgence intense: {hits_u[:4]}", 20, "danger")
        elif hits_u:
            flag("content", f"Langage d'urgence modere: {hits_u}", 8, "warn")
        else:
            flag("content", "Pas de langage d'urgence excessif", 0, "ok")

        generic = ["dear customer","dear user","dear member","valued customer"]
        if any(g in text_lower for g in generic):
            flag("content", "Salutation generique non personnalisee", 10, "warn")
        else:
            flag("content", "Salutation personnalisee", 0, "ok")

        sensitive = ["password","credit card","social security","bank account","pin","cvv"]
        hits_s = [s for s in sensitive if s in text_lower]
        if hits_s:
            flag("content", f"Demande infos sensibles: {hits_s}", 25, "danger")
        else:
            flag("content", "Pas de demande d'informations sensibles", 0, "ok")
    else:
        flag("content", "Pas de partie texte brut (HTML uniquement)", 10, "warn")

    # 6. ATTACHMENTS
    dangerous_ext  = [".exe",".bat",".cmd",".vbs",".js",".jar",".ps1",".scr",".lnk",".hta"]
    suspicious_ext = [".zip",".rar",".7z",".iso",".docm",".xlsm",".pptm"]
    attach_count   = 0
    for part in msg.walk():
        if part.get_content_disposition() in ("attachment", "inline"):
            fname = part.get_filename() or ""
            ext   = ("." + fname.rsplit(".", 1)[-1].lower()) if "." in fname else ""
            attach_count += 1
            if ext in dangerous_ext:
                flag("attachments", f"Piece jointe dangereuse: {fname}", 40, "danger")
            elif ext in suspicious_ext:
                flag("attachments", f"Piece jointe suspecte: {fname}", 10, "warn")
            else:
                flag("attachments", f"Piece jointe acceptable: {fname}", 0, "ok")
    if attach_count == 0:
        flag("attachments", "Aucune piece jointe", 0, "ok")

    # 7. METADATA
    msg_id = msg.get("Message-ID", "")
    if msg_id:
        mid_m = re.search(r'@([\w.\-]+)>', msg_id)
        if mid_m and from_domain:
            mid_d = mid_m.group(1).lower()
            if mid_d != from_domain:
                flag("metadata", f"Message-ID domain ({mid_d}) != FROM domain ({from_domain})", 15, "warn")
            else:
                flag("metadata", "Message-ID coherent avec FROM", 0, "ok")
    else:
        flag("metadata", "Pas de Message-ID", 10, "warn")

    # 8. DNS
    if from_domain:
        try:
            ip = socket.gethostbyname(from_domain)
            flag("dns", f"Domaine FROM resout vers {ip}", 0, "ok")
        except socket.gaierror:
            flag("dns", f"Domaine FROM introuvable en DNS: {from_domain}", 20, "danger")

    # VERDICT
    s = result["score"]
    if s <= 15:
        result["verdict"] = "SAFE"
        result["is_phishing"] = False
    elif s <= 35:
        result["verdict"] = "LOW_RISK"
        result["is_phishing"] = False
    elif s <= 60:
        result["verdict"] = "MODERATE_RISK"
        result["is_phishing"] = True
    elif s <= 90:
        result["verdict"] = "HIGH_RISK"
        result["is_phishing"] = True
    else:
        result["verdict"] = "PHISHING"
        result["is_phishing"] = True

    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python phishing_analyzer.py <fichier.eml>"}))
        sys.exit(1)
    output = analyze(sys.argv[1])
    print(json.dumps(output, ensure_ascii=False, indent=2))
    sys.exit(1 if output.get("is_phishing") else 0)