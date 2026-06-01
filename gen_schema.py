"""Genera el archivo draw.io con el ERD de Casa del Rey."""

TABLES = [
    {
        "id": "users", "label": "users", "x": 40, "y": 40, "w": 260,
        "color": "#dae8fc", "stroke": "#6c8ebf",
        "cols": [
            ("PK id serial", "pk"),
            ("name varchar(100) NOT NULL", ""),
            ("email varchar(100) UNIQUE", ""),
            ("password varchar(255)", ""),
            ("role (admin|leader|volunteer|member)", ""),
            ("address varchar(255)", ""),
            ("phone varchar(30)", "new"),
            ("FK cell_id → cells", "new"),
            ("cell_code varchar(10) [deprecar]", "dep"),
            ("cell_type varchar(20) [deprecar]", "dep"),
            ("email_verified bool", ""),
            ("verification_token / reset_token", ""),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "cells", "label": "cells ✨ NUEVA", "x": 380, "y": 40, "w": 260,
        "color": "#d5e8d4", "stroke": "#82b366",
        "cols": [
            ("PK id serial", "pk"),
            ("code varchar(10) UNIQUE NOT NULL", ""),
            ("name varchar(100) NOT NULL", ""),
            ("type (hombres|mujeres|jovenes|prejus|ninos)", ""),
            ("FK leader_id → users NOT NULL", ""),
            ("FK pastor_id → users (nullable)", ""),
            ("is_active bool DEFAULT true", ""),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "cell_reports", "label": "cell_reports", "x": 720, "y": 40, "w": 280,
        "color": "#d5e8d4", "stroke": "#82b366",
        "cols": [
            ("PK id serial", "pk"),
            ("FK cell_id → cells", "new"),
            ("cell_code varchar(20) [deprecar]", "dep"),
            ("cell_name varchar(100) NOT NULL", ""),
            ("cell_type varchar(20) [deprecar]", "dep"),
            ("meeting_date varchar(20) NOT NULL", ""),
            ("FK leader_id → users", ""),
            ("leader_name varchar(100) [deprecar]", "dep"),
            ("FK pastor_id → users", "new"),
            ("pastor_name varchar(100) [deprecar]", "dep"),
            ("host_name / host_phone / address", ""),
            ("topic varchar(255) / notes text", ""),
            ("total_attendees / converts / reconciled", ""),
            ("new_members / offering decimal(10,2)", ""),
            ("photo_url / status / approved_by_id", ""),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "member_boletas", "label": "member_boletas", "x": 1060, "y": 40, "w": 270,
        "color": "#d5e8d4", "stroke": "#82b366",
        "cols": [
            ("PK id serial", "pk"),
            ("date varchar(20) NOT NULL", ""),
            ("category (convertido|reconciliado|nuevo)", ""),
            ("inviter_name / inviter_phone", ""),
            ("FK inviter_user_id → users", "new"),
            ("guest_name / guest_phone / address", ""),
            ("FK leader_id → users", ""),
            ("FK cell_report_id → cell_reports", ""),
            ("notes text", ""),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "events", "label": "events", "x": 40, "y": 600, "w": 260,
        "color": "#ffe6cc", "stroke": "#d6b656",
        "cols": [
            ("PK id serial", "pk"),
            ("title / location / description", ""),
            ("date varchar(20)", ""),
            ("time varchar(10)", "new"),
            ("is_active bool DEFAULT true", ""),
            ("requires_payment bool", "new"),
            ("price_gtq decimal(10,2)", "new"),
            ("payment_deadline varchar(20)", "new"),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "event_registrations", "label": "event_registrations", "x": 380, "y": 600, "w": 270,
        "color": "#ffe6cc", "stroke": "#d6b656",
        "cols": [
            ("PK id serial", "pk"),
            ("FK event_id → events NOT NULL", ""),
            ("FK user_id → users (nullable)", ""),
            ("name / email / phone", ""),
            ("attendee_count int DEFAULT 1 / notes", ""),
            ("payment_status varchar(20)", "new"),
            ("FK receipt_id → payment_receipts", "new"),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "payment_receipts", "label": "payment_receipts ✨ NUEVA", "x": 720, "y": 700, "w": 280,
        "color": "#ffe6cc", "stroke": "#d6b656",
        "cols": [
            ("PK id serial", "pk"),
            ("payer_name / payer_email / payer_phone", ""),
            ("amount decimal(10,2) / currency", ""),
            ("bank_name / reference_number", ""),
            ("receipt_image_url varchar(500)", ""),
            ("purpose (evento|donacion|inscripcion)", ""),
            ("FK event_id → events (nullable)", ""),
            ("FK donation_id → donations (nullable)", ""),
            ("status (pendiente|verificado|rechazado)", ""),
            ("FK verified_by_id → users (nullable)", ""),
            ("verified_at / rejection_reason", ""),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "donations", "label": "donations", "x": 1060, "y": 600, "w": 270,
        "color": "#ffe6cc", "stroke": "#d6b656",
        "cols": [
            ("PK id serial", "pk"),
            ("name / email", ""),
            ("FK user_id → users (nullable)", "new"),
            ("amount decimal(10,2) / currency", ""),
            ("payment_method / payment_reference", ""),
            ("receipt_url varchar(500)", ""),
            ("FK receipt_id → payment_receipts", "new"),
            ("is_successful bool / donation_purpose", ""),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "volunteers", "label": "volunteers", "x": 40, "y": 1150, "w": 260,
        "color": "#e1d5e7", "stroke": "#9673a6",
        "cols": [
            ("PK id serial", "pk"),
            ("name / email / phone", ""),
            ("department varchar(50)", ""),
            ("message text", ""),
            ("FK assigned_leader_id → users", ""),
            ("FK user_id → users (nullable)", "new"),
            ("status (pendiente|asignado|usuario_creado)", ""),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "petitions", "label": "petitions", "x": 380, "y": 1150, "w": 260,
        "color": "#e1d5e7", "stroke": "#9673a6",
        "cols": [
            ("PK id serial", "pk"),
            ("name / email / phone", ""),
            ("category / subject / message text", ""),
            ("is_answered bool / answered_at", ""),
            ("FK user_id → users (nullable)", "new"),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "posts", "label": "posts", "x": 720, "y": 1250, "w": 260,
        "color": "#e1d5e7", "stroke": "#9673a6",
        "cols": [
            ("PK id serial", "pk"),
            ("title / slug UNIQUE / excerpt", ""),
            ("content text / cover_image", ""),
            ("redirect_url varchar(500)", ""),
            ("social_platform varchar(20)", "new"),
            ("FK author_id → users NOT NULL", ""),
            ("status (draft|published) / view_count", ""),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "announcements", "label": "announcements", "x": 40, "y": 1530, "w": 260,
        "color": "#e1d5e7", "stroke": "#9673a6",
        "cols": [
            ("PK id serial", "pk"),
            ("title / content text", ""),
            ("role_target (all|member|leader|admin)", ""),
            ("is_active bool / published_at", ""),
            ("expires_at timestamptz", "new"),
            ("FK created_by_id → users", ""),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "gallery_photos", "label": "gallery_photos", "x": 380, "y": 1530, "w": 260,
        "color": "#e1d5e7", "stroke": "#9673a6",
        "cols": [
            ("PK id serial", "pk"),
            ("title / description text", ""),
            ("url / thumbnail_url varchar(500)", ""),
            ("FK event_id → events (nullable)", ""),
            ("FK uploaded_by_id → users", ""),
            ("is_active bool / sort_order int", ""),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "social_posts", "label": "social_posts", "x": 720, "y": 1630, "w": 260,
        "color": "#e1d5e7", "stroke": "#9673a6",
        "cols": [
            ("PK id serial", "pk"),
            ("platform (facebook|instagram)", ""),
            ("post_url / caption / image_url", ""),
            ("is_active bool / sort_order int", ""),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "user_goals", "label": "user_goals", "x": 1060, "y": 1150, "w": 260,
        "color": "#f5f5f5", "stroke": "#999999",
        "cols": [
            ("PK id serial", "pk"),
            ("FK user_id → users NOT NULL", ""),
            ("title / description text", ""),
            ("target_date varchar(20)", ""),
            ("completed bool", ""),
            ("completed_at timestamptz", "new"),
            ("created_at / updated_at / deleted_at", "ts"),
        ]
    },
    {
        "id": "activity_logs", "label": "activity_logs  ⚠ purge >6m", "x": 1060, "y": 1480, "w": 270,
        "color": "#f5f5f5", "stroke": "#999999",
        "cols": [
            ("PK id serial", "pk"),
            ("FK user_id → users", ""),
            ("user_name varchar(100)", ""),
            ("action / resource / resource_id", ""),
            ("details text / ip_address", ""),
            ("created_at (sin soft delete)", "ts"),
        ]
    },
]

ROW_H = 28
FILL = {"": "none", "pk": "#f5f5f5", "ts": "#f5f5f5", "new": "#fff2cc", "dep": "#f8cecc"}

EDGES = [
    # (source_table, source_col_idx, target_table, target_col_idx, dashed)
    ("users",               7,  "cells",              0, False),   # users.cell_id → cells
    ("cells",               4,  "users",              0, False),   # cells.leader_id → users
    ("cells",               5,  "users",              0, True),    # cells.pastor_id → users
    ("cell_reports",        1,  "cells",              0, False),   # cr.cell_id → cells
    ("cell_reports",        6,  "users",              0, True),    # cr.leader_id → users
    ("cell_reports",        8,  "users",              0, True),    # cr.pastor_id → users
    ("member_boletas",      4,  "users",              0, True),    # mb.inviter_user_id → users
    ("member_boletas",      6,  "users",              0, True),    # mb.leader_id → users
    ("member_boletas",      7,  "cell_reports",       0, False),   # mb.cell_report_id → cr
    ("event_registrations", 1,  "events",             0, False),   # er.event_id → events
    ("event_registrations", 2,  "users",              0, True),    # er.user_id → users
    ("event_registrations", 6,  "payment_receipts",   0, False),   # er.receipt_id → pr
    ("payment_receipts",    6,  "events",             0, True),    # pr.event_id → events
    ("payment_receipts",    7,  "donations",          0, True),    # pr.donation_id → donations
    ("payment_receipts",    9,  "users",              0, True),    # pr.verified_by_id → users
    ("donations",           2,  "users",              0, True),    # don.user_id → users
    ("donations",           6,  "payment_receipts",   0, True),    # don.receipt_id → pr
    ("volunteers",          4,  "users",              0, True),    # vol.leader_id → users
    ("volunteers",          5,  "users",              0, True),    # vol.user_id → users
    ("petitions",           4,  "users",              0, True),    # pet.user_id → users
    ("posts",               5,  "users",              0, True),    # post.author_id → users
    ("announcements",       5,  "users",              0, True),    # ann.created_by_id → users
    ("gallery_photos",      3,  "events",             0, True),    # gal.event_id → events
    ("gallery_photos",      4,  "users",              0, True),    # gal.uploaded_by_id → users
    ("user_goals",          1,  "users",              0, False),   # ug.user_id → users
    ("activity_logs",       1,  "users",              0, True),    # al.user_id → users
]

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

def row_style(kind):
    fill = FILL.get(kind, "none")
    bottom = "0" if kind == "ts" else "1"
    return (
        f"shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;"
        f"fillColor={fill};collapsible=0;dropTarget=0;"
        f"points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
        f"fontSize=11;top=0;left=0;right=0;bottom={bottom};"
    )

cells_xml = []
cell_id_map = {}  # table_id -> {col_idx -> mxCell id}

for t in TABLES:
    tid = t["id"]
    h = 30 + len(t["cols"]) * ROW_H + 28  # header + rows + footer-ish
    cell_id_map[tid] = {}

    table_style = (
        f"shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;"
        f"align=center;resizeLast=1;fontSize=13;fontStyle=1;"
        f"fillColor={t['color']};strokeColor={t['stroke']};"
    )
    cells_xml.append(
        f'<mxCell id="t_{tid}" value="{esc(t["label"])}" style="{table_style}" '
        f'vertex="1" parent="1">'
        f'<mxGeometry x="{t["x"]}" y="{t["y"]}" width="{t["w"]}" height="{h}" as="geometry"/>'
        f'</mxCell>'
    )

    y = 30
    for i, (col_label, kind) in enumerate(t["cols"]):
        row_id = f"r_{tid}_{i}"
        cell_id_map[tid][i] = row_id
        cells_xml.append(
            f'<mxCell id="{row_id}" value="{esc(col_label)}" style="{row_style(kind)}" '
            f'vertex="1" parent="t_{tid}">'
            f'<mxGeometry y="{y}" width="{t["w"]}" height="{ROW_H}" as="geometry"/>'
            f'</mxCell>'
        )
        y += ROW_H

edge_counter = 0
for src_t, src_i, tgt_t, tgt_i, dashed in EDGES:
    src_id = cell_id_map[src_t][src_i]
    tgt_id = cell_id_map[tgt_t][tgt_i]
    dash_str = "dashed=1;" if dashed else ""
    cells_xml.append(
        f'<mxCell id="e{edge_counter}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;'
        f'endArrow=ERone;startArrow=ERmany;{dash_str}strokeColor=#666666;" '
        f'edge="1" source="{src_id}" target="{tgt_id}" parent="1">'
        f'<mxGeometry relative="1" as="geometry"/>'
        f'</mxCell>'
    )
    edge_counter += 1

# Legend
legend = """
<mxCell id="leg_bg" value="" style="rounded=1;whiteSpace=wrap;fillColor=#f9f9f9;strokeColor=#aaaaaa;" vertex="1" parent="1">
  <mxGeometry x="1380" y="40" width="260" height="220" as="geometry"/>
</mxCell>
<mxCell id="leg_title" value="&lt;b&gt;LEYENDA&lt;/b&gt;" style="text;html=1;strokeColor=none;fillColor=none;align=center;fontSize=13;" vertex="1" parent="1">
  <mxGeometry x="1380" y="48" width="260" height="24" as="geometry"/>
</mxCell>
<mxCell id="leg1" value="Campo NUEVO (Fase 1)" style="text;html=1;strokeColor=none;fillColor=#fff2cc;align=left;spacingLeft=8;fontSize=11;" vertex="1" parent="1">
  <mxGeometry x="1380" y="78" width="260" height="24" as="geometry"/>
</mxCell>
<mxCell id="leg2" value="Campo a DEPRECAR (Fase 3)" style="text;html=1;strokeColor=none;fillColor=#f8cecc;align=left;spacingLeft=8;fontSize=11;" vertex="1" parent="1">
  <mxGeometry x="1380" y="106" width="260" height="24" as="geometry"/>
</mxCell>
<mxCell id="leg3" value="✨ NUEVA = tabla nueva esta iteracion" style="text;html=1;strokeColor=none;fillColor=#d5e8d4;align=left;spacingLeft=8;fontSize=11;" vertex="1" parent="1">
  <mxGeometry x="1380" y="134" width="260" height="24" as="geometry"/>
</mxCell>
<mxCell id="leg4" value="Azul = Auth/Usuarios" style="text;html=1;strokeColor=none;fillColor=#dae8fc;align=left;spacingLeft=8;fontSize=11;" vertex="1" parent="1">
  <mxGeometry x="1380" y="162" width="260" height="20" as="geometry"/>
</mxCell>
<mxCell id="leg5" value="Naranja = Eventos y Pagos" style="text;html=1;strokeColor=none;fillColor=#ffe6cc;align=left;spacingLeft=8;fontSize=11;" vertex="1" parent="1">
  <mxGeometry x="1380" y="182" width="260" height="20" as="geometry"/>
</mxCell>
<mxCell id="leg6" value="Morado = Contenido y Personas" style="text;html=1;strokeColor=none;fillColor=#e1d5e7;align=left;spacingLeft=8;fontSize=11;" vertex="1" parent="1">
  <mxGeometry x="1380" y="202" width="260" height="20" as="geometry"/>
</mxCell>
<mxCell id="leg7" value="Gris = Sistema (logs, metas)" style="text;html=1;strokeColor=none;fillColor=#f5f5f5;strokeColor=#999;align=left;spacingLeft=8;fontSize=11;" vertex="1" parent="1">
  <mxGeometry x="1380" y="222" width="260" height="20" as="geometry"/>
</mxCell>
"""

all_cells = "\n".join(cells_xml) + legend

xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" version="21.0.0">
  <diagram name="Casa del Rey — ERD">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="3300" pageHeight="2200" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        {all_cells}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
"""

with open(r"C:\Users\keyme\proyectos\casadelreyhue\schema_casadelrey.drawio", "w", encoding="utf-8") as f:
    f.write(xml)

print(f"Generado: {len(TABLES)} tablas, {edge_counter} relaciones")
print("Archivo: schema_casadelrey.drawio")
