import json
from pathlib import Path

# ========= 文件路径 =========
json_path = Path("E:\GoogleDownload\case-thomas-taylor (3).json")      # 你的 JSON 文件
output_html = Path("index.html")   # 输出 HTML

# ========= 读取 JSON =========
with open(json_path, encoding="utf-8") as f:
    case = json.load(f)

    # print(case.keys())
    # radiology_studies = case.get("config", {}).get("radiology", [])
    #
    # print("Radiology 数量 =", len(radiology_studies))


# ========= 基本信息 =========
name = case.get("name", "Unnamed Case")
description = case.get("description", "")
system_prompt = case.get("system_prompt", "")
exported_at = case.get("exportedAt", "")
version = case.get("version", "")

# ========= 实验室检查（Labs）=========
labs = (
    case
    .get("config", {})
    .get("investigations", {})
    .get("labs", [])
)

lab_rows = ""
for lab in labs:
    abnormal = "⚠️" if lab.get("is_abnormal") else ""
    lab_rows += f"""
    <tr>
      <td>{lab.get("test_name", "")}</td>
      <td>{lab.get("current_value", "")}</td>
      <td>{lab.get("unit", "")}</td>
      <td>{lab.get("min_value", "")} – {lab.get("max_value", "")}</td>
      <td>{abnormal}</td>
    </tr>
    """

lab_section = f"""
<h2>Laboratory Results</h2>
<table border="1" cellpadding="6" cellspacing="0">
  <tr>
    <th>Test</th>
    <th>Value</th>
    <th>Unit</th>
    <th>Normal Range</th>
    <th>Status</th>
  </tr>
  {lab_rows}
</table>
""" if labs else ""

# ========= 影像学检查（Imaging）=========
# ========= Radiology（影像学检查）=========
radiology_blocks = ""
radiology_studies = case.get("config", {}).get("radiology", [])
for study in radiology_studies:
    study_name = study.get("studyName", "Radiology Study")
    image_url = study.get("imageUrl", "")
    findings = study.get("findings", "")
    interpretation = study.get("interpretation", "")

    radiology_blocks += f"""
    <div style="margin-bottom:40px;">
      <h3>{study_name}</h3>

      {f'<img src="{image_url}" style="max-width:100%; max-height:500px; margin:12px 0;">' if image_url else ''}

      <p><strong>Findings:</strong><br>{findings}</p>
      <p><strong>Interpretation:</strong><br>{interpretation}</p>
    </div>
    """

radiology_section = f"""
<h2>Radiology</h2>
{radiology_blocks}
""" if radiology_blocks else ""

# ========= 拼接 HTML =========
html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{name}</title>
  <style>
    body {{
      font-family: Arial, sans-serif;
      max-width: 900px;
      margin: auto;
      line-height: 1.6;
    }}
    h1, h2 {{
      border-bottom: 2px solid #ddd;
      padding-bottom: 4px;
    }}
    table {{
      width: 100%;
      margin-top: 12px;
      border-collapse: collapse;
    }}
    th, td {{
      padding: 6px;
      text-align: left;
    }}
  </style>
</head>
<body>

<h1>{name}</h1>
<p><strong>Description:</strong> {description}</p>

<h2>Case Description</h2>
<p>{system_prompt}</p>

{lab_section}

{radiology_section}

<p style="margin-top:40px;color:#666;font-size:0.9em;">
Exported at: {exported_at} | Version: {version}
</p>

</body>
</html>
"""

# ========= 写入 HTML =========
with open(output_html, "w", encoding="utf-8") as f:
    f.write(html)

print("✅ HTML 生成成功：", output_html.resolve())