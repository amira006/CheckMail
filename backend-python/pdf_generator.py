import io
import os
from datetime import datetime
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    Table, TableStyle, HRFlowable, Image as RLImage
)
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY

# ── Chemins assets (relatifs au fichier pdf_generator.py) ────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.path.join(BASE_DIR, "assets", "logo_checkmail.png")
SIG_PATH = os.path.join(BASE_DIR, "assets", "signature_checkmail.png")

# ── Palette extraite du logo CheckMail ───────────────────────────
C_BLUE_DARK = colors.HexColor('#143c78')
C_BLUE_MID = colors.HexColor('#2878c8')
C_BLUE_LIGHT = colors.HexColor('#a0d4f0')
C_RED = colors.HexColor('#8c1428')
C_BODY = colors.HexColor('#1a1a2e')
C_GREY = colors.HexColor('#555577')
C_LINE = colors.HexColor('#c8dcf0')
C_WHITE = colors.white


# ── Helpers verdict ───────────────────────────────────────────────
def _verdict_color(v):
    v = str(v).upper()
    if v == "SAFE":
        return colors.HexColor('#0e8a5f')
    if v == "SUSPICIOUS":
        return colors.HexColor('#c87800')
    if v == "DANGEROUS":
        return C_RED
    return C_GREY


def _verdict_label(v):
    return {
        "SAFE": "Email Sûr — Aucune Menace Détectée",
        "SUSPICIOUS": "Email Suspect — Vigilance Requise",
        "DANGEROUS": "Email Dangereux — Phishing Confirmé",
    }.get(str(v).upper(), str(v))


def _build_intro(verdict, sender, subject):
    v = str(verdict).upper()
    s = sender or "l'expéditeur inconnu"
    sub = subject or "—"
    base = (
        f"Suite à l'analyse de sécurité effectuée sur l'email reçu de "
        f"<b>{s}</b> avec l'objet <i>\"{sub}\"</i>, notre moteur CheckMail "
    )
    if v == "SAFE":
        return base + (
            "n'a détecté aucune menace active. Le message présente toutes les "
            "caractéristiques d'une communication légitime et authentifiée. "
            "Vous pouvez consulter cet email en toute confiance."
        )
    if v == "SUSPICIOUS":
        return base + (
            "a relevé plusieurs anomalies susceptibles d'indiquer une tentative "
            "de phishing ou d'ingénierie sociale. Bien que la menace ne soit pas "
            "confirmée avec certitude, une vigilance particulière est fortement recommandée."
        )
    return base + (
        "a formellement identifié des indicateurs caractéristiques d'une attaque "
        "de phishing ciblée. Cet email constitue une menace sérieuse pour la "
        "sécurité de vos données personnelles et de votre organisation."
    )


# ── Styles ────────────────────────────────────────────────────────
def _get_styles():
    s = getSampleStyleSheet()
    ADD = s.add

    ADD(ParagraphStyle(name='CM_MetaDate',
        fontName='Helvetica', fontSize=10,
        textColor=C_BODY, leading=15))
    ADD(ParagraphStyle(name='CM_MetaUser',
        fontName='Helvetica-Bold', fontSize=11,
        textColor=C_BLUE_DARK, leading=16))
    ADD(ParagraphStyle(name='CM_MetaLine',
        fontName='Helvetica', fontSize=10,
        textColor=C_BODY, leading=14))
    ADD(ParagraphStyle(name='CM_Salutation',
        fontName='Helvetica-Bold', fontSize=10,
        textColor=C_BODY, leading=16, spaceAfter=6))
    ADD(ParagraphStyle(name='CM_Body',
        fontName='Helvetica', fontSize=10,
        textColor=C_BODY, leading=17, spaceAfter=6,
        alignment=TA_JUSTIFY))
    ADD(ParagraphStyle(name='CM_BulletItem',
        fontName='Helvetica', fontSize=10,
        textColor=C_BODY, leading=16, leftIndent=14, spaceAfter=2))
    ADD(ParagraphStyle(name='CM_BestRegards',
        fontName='Helvetica', fontSize=10,
        textColor=C_BODY, leading=15, spaceBefore=16))
    ADD(ParagraphStyle(name='CM_SigName',
        fontName='Helvetica-Bold', fontSize=11,
        textColor=C_BLUE_DARK, leading=15))
    ADD(ParagraphStyle(name='CM_SigRole',
        fontName='Helvetica', fontSize=9,
        textColor=C_BLUE_MID, leading=13))
    ADD(ParagraphStyle(name='CM_VerdictWhite',
        fontName='Helvetica-Bold', fontSize=10,
        textColor=C_WHITE, leading=16))
    return s


# ── Canvas header / footer ────────────────────────────────────────
def _draw_page(canvas, doc, meta):
    W, H = A4
    M = 1.8 * cm

    # Bande bleue top
    canvas.setFillColor(C_BLUE_DARK)
    canvas.rect(0, H - 0.55 * cm, W, 0.55 * cm, fill=1, stroke=0)

    # Logo robot
    if os.path.isfile(LOGO_PATH):
        try:
            canvas.drawImage(
                LOGO_PATH,
                M, H - 0.55 * cm - 2.5 * cm,
                width=2.2 * cm, height=2.2 * cm,
                preserveAspectRatio=True, mask='auto'
            )
        except Exception:
            pass

    # Texte CheckMail / Security Engine
    canvas.setFillColor(C_BLUE_DARK)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(M + 2.5 * cm, H - 0.55 * cm - 1.2 * cm, "CheckMail")
    canvas.setFillColor(C_BLUE_MID)
    canvas.setFont("Helvetica", 9)
    canvas.drawString(M + 2.5 * cm, H - 0.55 * cm - 1.9 * cm, "Security Engine")

    # Titre droite
    canvas.setFillColor(C_BLUE_DARK)
    canvas.setFont("Helvetica-Bold", 20)
    canvas.drawRightString(W - M, H - 0.55 * cm - 1.7 * cm, "Rapport de Sécurité")

    # Ligne séparatrice header
    canvas.setStrokeColor(C_LINE)
    canvas.setLineWidth(1.2)
    canvas.line(M, H - 0.55 * cm - 2.9 * cm,
                W - M, H - 0.55 * cm - 2.9 * cm)

    # Ligne séparatrice footer
    canvas.line(M, 1.6 * cm, W - M, 1.6 * cm)

    # Bande bleue bottom
    canvas.setFillColor(C_BLUE_DARK)
    canvas.rect(0, 0, W, 0.45 * cm, fill=1, stroke=0)

    # Contacts footer
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(C_GREY)
    fy = 1.1 * cm
    canvas.drawString(M, fy, "\u2706  +216 12 345 678")
    canvas.drawCentredString(W / 2, fy, "\u25cf  Monastir, Tunisie")
    canvas.drawRightString(W - M, fy, "\u2709  checkmail.support@email.com")


# ── Story builders ────────────────────────────────────────────────
def _meta_block(meta, s):
    gen_date = datetime.now().strftime("%d %B %Y a %H:%M")
    sender = meta.get("from", meta.get("sender", "—"))
    sender_name = meta.get("sender_name", "")
    expediteur = f"{sender_name} &lt;{sender}&gt;" if sender_name else sender
    return [
        Paragraph(f"Genere le {gen_date}", s['CM_MetaDate']),
        Paragraph(meta.get("username", meta.get("user", "—")), s['CM_MetaUser']),
        Paragraph(f"<b>Expediteur :</b> {expediteur}", s['CM_MetaLine']),
        Paragraph(f"<b>Objet :</b> {meta.get('subject', '—')}", s['CM_MetaLine']),
    ]


def _body_block(report, meta, s):
    verdict = str(report.get("verdict", "UNKNOWN")).upper()
    vc = _verdict_color(verdict)
    indicators = report.get("indicators") or []
    rec = report.get("recommendation") or ""
    username = meta.get("user", meta.get("username", "Utilisateur"))

    story = []

    # Salutation
    story.append(Paragraph(f"À {username},", s['CM_Salutation']))
    story.append(Spacer(1, 0.3 * cm))

    # Intro
    story.append(Paragraph(
        _build_intro(verdict, meta.get("from", meta.get("sender")), meta.get("subject")),
        s['CM_Body']
    ))
    story.append(Spacer(1, 0.2 * cm))

    # Bloc verdict coloré
    vt_style = ParagraphStyle('_vt_tmp',
                              fontName='Helvetica-Bold', fontSize=10,
                              textColor=C_WHITE, leading=16)
    vtbl = Table(
        [[Paragraph(f"  {_verdict_label(verdict)}  ", vt_style)]],
        colWidths=[14 * cm],
    )
    vtbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), vc),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(vtbl)
    story.append(Spacer(1, 0.3 * cm))

    # Indicateurs
    if indicators:
        intro_ind = ("Les points suivants confirment la légitimité de l'email :"
                     if verdict == "SAFE" else
                     "Les indicateurs suivants ont été relevés lors de l'analyse :")
        story.append(Paragraph(intro_ind, s['CM_Body']))
        for ind in indicators:
            story.append(Paragraph(f"• {ind}", s['CM_BulletItem']))
        story.append(Spacer(1, 0.2 * cm))

    # Recommandation
    if rec:
        story.append(Paragraph(rec, s['CM_Body']))
        story.append(Spacer(1, 0.2 * cm))

    # Conclusion
    story.append(Paragraph(
        "Si vous avez besoin d'une assistance supplémentaire ou de plus amples "
        "informations concernant cette analyse, n'hésitez pas à nous contacter. "
        "Merci de faire confiance à CheckMail pour la protection de vos communications.",
        s['CM_Body']
    ))
    return story


def _signature_block(s):
    story = []
    story.append(Paragraph("Cordialement,", s['CM_BestRegards']))
    story.append(Spacer(1, 0.25 * cm))

    if os.path.isfile(SIG_PATH):
        try:
            left_col = Table([
                [Paragraph("CheckMail", s['CM_SigName'])],
                [Paragraph(
                    "Security Engine — Analyse Automatisée des Menaces",
                    s['CM_SigRole']
                )],
            ], colWidths=[6.5 * cm])
            left_col.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ]))
            sig_tbl = Table(
                [[left_col, RLImage(SIG_PATH, width=3.5 * cm, height=1.4 * cm)]],
                colWidths=[9.5 * cm, 8 * cm]
            )
            sig_tbl.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            story.append(sig_tbl)
        except Exception:
            story.append(Paragraph("CheckMail", s['CM_SigName']))
            story.append(Paragraph(
                "Security Engine — Analyse Automatisée des Menaces",
                s['CM_SigRole']
            ))
    else:
        story.append(Paragraph("CheckMail", s['CM_SigName']))
        story.append(Paragraph(
            "Security Engine — Analyse Automatisée des Menaces",
            s['CM_SigRole']
        ))
    return story


# ── Point d'entrée public ─────────────────────────────────────────
def generate_pdf(report: dict, meta: dict) -> io.BytesIO:
    """
    Génère le rapport PDF CheckMail et retourne un BytesIO.

    Args:
        report: dict avec clés verdict, indicators, recommendation
        meta:   dict avec clés date, username, sender, subject
    """
    # Valeurs par défaut pour éviter les KeyError
    report = report or {}
    meta = meta or {}

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=1.8 * cm, rightMargin=1.8 * cm,
        topMargin=4.2 * cm,
        bottomMargin=2.4 * cm,
    )

    s = _get_styles()
    story = []
    story += _meta_block(meta, s)
    story.append(Spacer(1, 0.6 * cm))
    story += _body_block(report, meta, s)
    story.append(Spacer(1, 0.2 * cm))
    story += _signature_block(s)

    doc.build(
        story,
        onFirstPage=lambda c, d: _draw_page(c, d, meta),
        onLaterPages=lambda c, d: _draw_page(c, d, meta),
    )
    buf.seek(0)
    return buf