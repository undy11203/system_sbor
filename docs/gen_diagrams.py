# -*- coding: utf-8 -*-
"""
gen_diagrams.py  –  генерирует PNG-диаграммы для главы 3
Запускать перед build_glava3.py
"""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch
import numpy as np
import os

OUT = os.path.dirname(os.path.abspath(__file__))

# Настройки шрифта (использовать системный, поддерживающий кириллицу)
plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["axes.unicode_minus"] = False

# ── Цвета ─────────────────────────────────────────────────────────────────────
C_FRONT  = "#4A90D9"   # синий — frontend
C_BACK   = "#27AE60"   # зелёный — backend
C_DB     = "#E67E22"   # оранжевый — БД
C_EXT    = "#8E44AD"   # фиолетовый — внешние сервисы
C_ARROW  = "#555555"
C_BG     = "#F8F9FA"

def box(ax, x, y, w, h, text, color, fontsize=10, text_color="white"):
    rect = FancyBboxPatch((x - w/2, y - h/2), w, h,
                          boxstyle="round,pad=0.05",
                          linewidth=1.2, edgecolor="#333333",
                          facecolor=color, zorder=3)
    ax.add_patch(rect)
    ax.text(x, y, text, ha="center", va="center",
            fontsize=fontsize, color=text_color,
            fontweight="bold", zorder=4,
            wrap=True, multialignment="center")

def arrow(ax, x1, y1, x2, y2, label="", color=C_ARROW, lw=1.5):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color=color,
                                lw=lw, mutation_scale=14),
                zorder=2)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx + 0.05, my, label, fontsize=8, color=color,
                ha="left", va="center", zorder=5)

def darrow(ax, x1, y1, x2, y2, label="", color=C_ARROW):
    """Двунаправленная стрелка."""
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="<|-|>", color=color,
                                lw=1.5, mutation_scale=14), zorder=2)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx + 0.05, my, label, fontsize=8, color=color,
                ha="left", va="center", zorder=5)


# ══════════════════════════════════════════════════════════════════════════════
# Рисунок 1 — Архитектура системы
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(12, 7))
ax.set_xlim(0, 12); ax.set_ylim(0, 7)
ax.axis("off")
ax.set_facecolor(C_BG); fig.patch.set_facecolor(C_BG)

# Заголовок
ax.text(6, 6.6, "Архитектура системы", ha="center", va="center",
        fontsize=13, fontweight="bold", color="#222222")

# Слой Frontend
ax.add_patch(FancyBboxPatch((0.3, 4.2), 3.4, 1.9,
    boxstyle="round,pad=0.1", linewidth=1.5,
    edgecolor=C_FRONT, facecolor="#EAF4FC", zorder=1))
ax.text(2.0, 6.0, "Frontend (React + TypeScript)", ha="center",
        fontsize=9, color=C_FRONT, fontweight="bold")
box(ax, 1.3, 5.3, 1.4, 0.55, "LoginPage\n(email + код)", C_FRONT, 8)
box(ax, 2.9, 5.3, 1.4, 0.55, "StudentForm\nPage", C_FRONT, 8)
box(ax, 1.3, 4.65, 1.4, 0.55, "Secretary\nPage", C_FRONT, 8)
box(ax, 2.9, 4.65, 1.4, 0.55, "Autocomplete\nComponent", C_FRONT, 8)

# Слой Backend
ax.add_patch(FancyBboxPatch((4.2, 2.3), 4.6, 3.8,
    boxstyle="round,pad=0.1", linewidth=1.5,
    edgecolor=C_BACK, facecolor="#EAFAF1", zorder=1))
ax.text(6.5, 6.0, "Backend (Spring Boot 3)", ha="center",
        fontsize=9, color=C_BACK, fontweight="bold")
box(ax, 5.1, 5.3, 1.5, 0.5, "AuthController\n+ JwtFilter", C_BACK, 8)
box(ax, 6.8, 5.3, 1.5, 0.5, "Application\nController", C_BACK, 8)
box(ax, 5.1, 4.65, 1.5, 0.5, "FormSchema\nController", C_BACK, 8)
box(ax, 6.8, 4.65, 1.5, 0.5, "Ontology\nController", C_BACK, 8)
box(ax, 5.1, 4.0, 1.5, 0.5, "Application\nService", C_BACK, 8)
box(ax, 6.8, 4.0, 1.5, 0.5, "OntologyService\n+ DocFill", C_BACK, 8)
box(ax, 5.1, 3.35, 1.5, 0.5, "AuthService\n+ EmailService", C_BACK, 8)
box(ax, 6.8, 3.35, 1.5, 0.5, "FormSchema\nService", C_BACK, 8)
box(ax, 5.9, 2.7, 1.8, 0.5, "SecurityConfig\n(JWT, Roles)", C_BACK, 8)

# Слой хранилища
ax.add_patch(FancyBboxPatch((0.3, 0.3), 5.4, 1.5,
    boxstyle="round,pad=0.1", linewidth=1.5,
    edgecolor=C_DB, facecolor="#FEF9E7", zorder=1))
ax.text(3.0, 1.72, "Хранилища данных", ha="center",
        fontsize=9, color=C_DB, fontweight="bold")
box(ax, 1.4, 1.0, 2.0, 0.55, "Apache Jena Fuseki\n(OWL/RDF, SPARQL)", C_DB, 8, "#333")
box(ax, 3.9, 1.0, 2.0, 0.55, "PostgreSQL\n(codes, schemas, statuses)", C_DB, 8, "#333")

# Внешние сервисы
ax.add_patch(FancyBboxPatch((9.0, 0.3), 2.7, 3.8,
    boxstyle="round,pad=0.1", linewidth=1.5,
    edgecolor=C_EXT, facecolor="#F5EEF8", zorder=1))
ax.text(10.35, 4.05, "Внешние\nсервисы", ha="center",
        fontsize=9, color=C_EXT, fontweight="bold")
box(ax, 10.35, 3.3, 2.0, 0.55, "SMTP\n(Gmail)", C_EXT, 8)
box(ax, 10.35, 2.5, 2.0, 0.55, "Camunda BPM\n(koi-reminders)", C_EXT, 8)
box(ax, 10.35, 1.7, 2.0, 0.55, "Petrovich4j\n(склонение ФИО)", C_EXT, 8)
box(ax, 10.35, 0.9, 2.0, 0.55, "hepler\n(шаблоны DOCX)", C_EXT, 8)

# Стрелки: Frontend ↔ Backend
darrow(ax, 3.7, 5.1, 4.2, 5.1, "REST/JSON")

# Backend → Хранилища
arrow(ax, 5.9, 2.45, 1.4, 1.3, "", C_DB)
arrow(ax, 5.9, 2.45, 3.9, 1.3, "", C_DB)

# Backend → Внешние
arrow(ax, 8.8, 4.0, 9.0, 3.3, "", C_EXT)
arrow(ax, 8.8, 3.35, 9.0, 2.5, "", C_EXT)
arrow(ax, 8.8, 4.0, 9.0, 1.7, "", C_EXT)
arrow(ax, 8.8, 4.0, 9.0, 0.9, "", C_EXT)

plt.tight_layout()
plt.savefig(os.path.join(OUT, "diag_architecture.png"), dpi=150, bbox_inches="tight")
plt.close()
print("diag_architecture.png OK")


# ══════════════════════════════════════════════════════════════════════════════
# Рисунок 2 — Схема аутентификации (sequence-style)
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(11, 6))
ax.set_xlim(0, 11); ax.set_ylim(0, 6)
ax.axis("off")
ax.set_facecolor(C_BG); fig.patch.set_facecolor(C_BG)

ax.text(5.5, 5.7, "Схема аутентификации пользователя",
        ha="center", fontsize=13, fontweight="bold", color="#222222")

# Участники
participants = [
    (1.2, "Браузер\n(клиент)", C_FRONT),
    (3.8, "AuthController\n(Backend)", C_BACK),
    (6.5, "CodeStorage\nService", C_BACK),
    (9.0, "Email\nService\n(SMTP)", C_EXT),
]
for x, name, c in participants:
    box(ax, x, 5.1, 1.7, 0.65, name, c, 8)
    ax.plot([x, x], [0.3, 4.77], color="#AAAAAA", lw=1, ls="--", zorder=1)

# Шаги
steps = [
    (1.2, 3.8, 4.5, 3.8,  "POST /api/auth/send-code\n{email}"),
    (3.8, 3.4, 6.5, 3.4,  "save(email, code, ttl=10min)"),
    (3.8, 3.0, 9.0, 3.0,  "sendVerificationCode(email, code)"),
    (9.0, 2.6, 1.2, 2.6,  "← Письмо с кодом подтверждения"),
    (1.2, 2.2, 4.5, 2.2,  "POST /api/auth/verify\n{email, code}"),
    (3.8, 1.8, 6.5, 1.8,  "verify(email, code) → ok"),
    (4.5, 1.4, 1.2, 1.4,  "← 200 OK {token, email, role}"),
    (1.2, 1.0, 4.5, 1.0,  "→ Сохранение JWT в localStorage"),
]

colors_seq = [C_FRONT, C_BACK, C_BACK, C_EXT, C_FRONT, C_BACK, C_BACK, C_FRONT]
for i, (x1, y1, x2, y2, label) in enumerate(steps):
    c = colors_seq[i]
    # рисуем стрелку
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color=c, lw=1.4, mutation_scale=12), zorder=2)
    mx = (x1 + x2) / 2
    ax.text(mx, y1 + 0.12, label, ha="center", va="bottom",
            fontsize=7.5, color="#333333",
            bbox=dict(boxstyle="round,pad=0.2", fc="white", ec=c, lw=0.8, alpha=0.9),
            zorder=5)

plt.tight_layout()
plt.savefig(os.path.join(OUT, "diag_auth.png"), dpi=150, bbox_inches="tight")
plt.close()
print("diag_auth.png OK")


# ══════════════════════════════════════════════════════════════════════════════
# Рисунок 3 — Поток подачи заявки студента
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(11, 6.5))
ax.set_xlim(0, 11); ax.set_ylim(0, 6.5)
ax.axis("off")
ax.set_facecolor(C_BG); fig.patch.set_facecolor(C_BG)

ax.text(5.5, 6.2, "Поток обработки заявки студента",
        ha="center", fontsize=13, fontweight="bold", color="#222222")

participants2 = [
    (1.0, "Студент\n(браузер)", C_FRONT),
    (3.3, "Application\nController", C_BACK),
    (5.6, "Application\nService", C_BACK),
    (7.8, "Fuseki\n(онтология)", C_DB),
    (9.8, "Email\n(SMTP)", C_EXT),
]
for x, name, c in participants2:
    box(ax, x, 5.8, 1.5, 0.6, name, c, 8)
    ax.plot([x, x], [0.3, 5.5], color="#AAAAAA", lw=1, ls="--", zorder=1)

steps2 = [
    (1.0, 5.0, 3.3, 5.0, "POST /api/applications\n{degree, values}"),
    (3.3, 4.55, 5.6, 4.55, "submitStudent(req, type, email)"),
    (5.6, 4.1, 7.8, 4.1, "SPARQL INSERT DATA\n(тройки экземпляра)"),
    (7.8, 3.7, 5.6, 3.7, "← 200 OK (сохранено)"),
    (5.6, 3.3, 5.6, 3.3, "save StudentSubmission\n(PENDING)"),   # self
    (5.6, 2.9, 7.8, 2.9, "fetchStudentVars(uri)\n[SPARQL SELECT]"),
    (7.8, 2.5, 5.6, 2.5, "← {фио, группа, место, …}"),
    (5.6, 2.1, 9.8, 2.1, "sendDocuments(email, zip)\n(MimeMessage + ZIP)"),
    (5.6, 1.65, 9.8, 1.65, "scheduleReminder #1\n(+3 дня)"),
    (3.3, 1.2, 1.0, 1.2, "← 200 OK {uri, SUBMITTED}"),
]

# self-arrow для save StudentSubmission
ax.annotate("", xy=(5.6, 3.15), xytext=(5.6, 3.45),
            arrowprops=dict(arrowstyle="-|>", color=C_BACK, lw=1.3, mutation_scale=11),
            zorder=2)
ax.text(6.1, 3.3, "save Submission\n(PENDING)", fontsize=7.5, color="#333",
        ha="left", va="center",
        bbox=dict(boxstyle="round,pad=0.2", fc="white", ec=C_BACK, lw=0.8, alpha=0.9), zorder=5)

colors2 = [C_FRONT, C_BACK, C_DB, C_DB, None, C_DB, C_DB, C_EXT, C_EXT, C_BACK]
for i, (x1, y1, x2, y2, label) in enumerate(steps2):
    if y1 == y2 and x1 == x2:  # skip self (drawn above)
        continue
    c = colors2[i]
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color=c, lw=1.3, mutation_scale=11), zorder=2)
    mx = (x1 + x2) / 2
    ax.text(mx, y1 + 0.1, label, ha="center", va="bottom",
            fontsize=7.2, color="#333333",
            bbox=dict(boxstyle="round,pad=0.18", fc="white", ec=c, lw=0.7, alpha=0.9), zorder=5)

plt.tight_layout()
plt.savefig(os.path.join(OUT, "diag_submission.png"), dpi=150, bbox_inches="tight")
plt.close()
print("diag_submission.png OK")


# ══════════════════════════════════════════════════════════════════════════════
# Рисунок 4 — Цикл напоминаний
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(9, 6))
ax.set_xlim(0, 9); ax.set_ylim(0, 6)
ax.axis("off")
ax.set_facecolor(C_BG); fig.patch.set_facecolor(C_BG)

ax.text(4.5, 5.7, "Цикл напоминаний студенту",
        ha="center", fontsize=13, fontweight="bold", color="#222222")

# Узлы
nodes = [
    (4.5, 5.1, "Заявка подана\n(статус PENDING)", C_BACK),
    (4.5, 4.1, "Ждать 3 дня\n(TaskScheduler)", "#7F8C8D"),
    (4.5, 3.1, "Проверить статус\n(student_submissions)", C_BACK),
    (1.5, 2.0, "RECEIVED", "#27AE60"),
    (4.5, 2.0, "attempt > 5?", "#E74C3C"),
    (7.5, 2.0, "Отправить\nнапоминание", C_EXT),
    (4.5, 0.9, "Цикл завершён", "#7F8C8D"),
]
for x, y, text, c in nodes:
    box(ax, x, y, 2.2, 0.65, text, c, 8.5)

# Стрелки между узлами
edges = [
    (4.5, 4.78, 4.5, 4.43, ""),
    (4.5, 3.78, 4.5, 3.43, ""),
    (4.5, 2.78, 1.5, 2.33, "статус = RECEIVED"),
    (4.5, 2.78, 4.5, 2.33, "статус = PENDING"),
    (1.5, 1.68, 4.5, 1.23, ""),
    (4.5, 1.68, 7.5, 2.0-0.34, "Нет"),
    (7.5, 1.68, 4.5, 4.1-0.34, "attempt+1"),
    (4.5, 1.68, 4.5, 1.23, "Да"),
]

edge_colors = [C_BACK, C_BACK, "#27AE60", "#E74C3C",
               "#7F8C8D", "#E74C3C", C_EXT, "#E74C3C"]

for i, (x1, y1, x2, y2, label) in enumerate(edges):
    c = edge_colors[i]
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", color=c, lw=1.5, mutation_scale=13), zorder=2)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx + 0.1, my, label, fontsize=8, color=c,
                ha="left", va="center",
                bbox=dict(boxstyle="round,pad=0.15", fc="white", ec=c, lw=0.7, alpha=0.9), zorder=5)

plt.tight_layout()
plt.savefig(os.path.join(OUT, "diag_reminders.png"), dpi=150, bbox_inches="tight")
plt.close()
print("diag_reminders.png OK")


# ══════════════════════════════════════════════════════════════════════════════
# Рисунок 5 — Схема таблиц PostgreSQL
# ══════════════════════════════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(11, 4.5))
ax.set_xlim(0, 11); ax.set_ylim(0, 4.5)
ax.axis("off")
ax.set_facecolor(C_BG); fig.patch.set_facecolor(C_BG)

ax.text(5.5, 4.25, "Схема таблиц PostgreSQL",
        ha="center", fontsize=13, fontweight="bold", color="#222222")

def db_table(ax, x, y, title, cols, width=2.8, row_h=0.38):
    total_h = row_h + len(cols) * row_h
    # header
    ax.add_patch(FancyBboxPatch((x, y - row_h), width, row_h,
        boxstyle="square,pad=0", lw=1.3, edgecolor="#333", facecolor=C_DB))
    ax.text(x + width/2, y - row_h/2, title,
            ha="center", va="center", fontsize=9, fontweight="bold", color="white")
    # rows
    for i, (col, typ, pk) in enumerate(cols):
        row_y = y - row_h - (i+1)*row_h
        fc = "#FFF9F0" if not pk else "#FDEBD0"
        ax.add_patch(FancyBboxPatch((x, row_y), width, row_h,
            boxstyle="square,pad=0", lw=0.8, edgecolor="#CCCCCC", facecolor=fc))
        prefix = "[PK] " if pk else "     "
        ax.text(x + 0.15, row_y + row_h/2, f"{prefix}{col}",
                ha="left", va="center", fontsize=8, color="#222")
        ax.text(x + width - 0.1, row_y + row_h/2, typ,
                ha="right", va="center", fontsize=7.5, color="#666", style="italic")

# verification_codes
db_table(ax, 0.3, 3.9, "verification_codes", [
    ("email",      "VARCHAR(255)", True),
    ("code",       "VARCHAR(10)",  False),
    ("expires_at", "TIMESTAMP",    False),
], width=3.0)

# form_schemas
db_table(ax, 4.0, 3.9, "form_schemas", [
    ("type",        "VARCHAR(100)", True),
    ("schema_json", "TEXT",         False),
], width=3.0)

# student_submissions
db_table(ax, 7.7, 3.9, "student_submissions", [
    ("student_uri", "VARCHAR(512)", True),
    ("email",       "VARCHAR(255)", False),
    ("status",      "ENUM(PENDING,\nRECEIVED)", False),
    ("created_at",  "TIMESTAMP",    False),
    ("received_at", "TIMESTAMP",    False),
], width=3.0)

# подписи
for x, name in [(1.8, "verification_codes"), (5.5, "form_schemas"), (9.2, "student_submissions")]:
    pass  # уже в заголовках таблиц

plt.tight_layout()
plt.savefig(os.path.join(OUT, "diag_db.png"), dpi=150, bbox_inches="tight")
plt.close()
print("diag_db.png OK")


print("\nВсе диаграммы сгенерированы.")
