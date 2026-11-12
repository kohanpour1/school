#!/usr/bin/env python3
import base64, pathlib, sys
root = pathlib.Path("app/src/main/assets/www")
parts = sorted((root/"parts").glob("part_*.b64"))
if len(parts) < 120:
    sys.exit(f"expected 120 parts, got {len(parts)}")
b64 = "".join(p.read_text(encoding="utf-8").strip() for p in parts)
try:
    data = base64.b64decode(b64, validate=True)
except Exception as e:
    sys.exit(f"base64 decode failed: {e}")
text = data.decode("utf-8")
need = [
    "80254748",
    "renderLogin",
    "jalaliDaysInMonth",
    "assignments",
    "teachersFor",
    'localStorage.getItem("boshra_sess")',
    "\u0627\u0639\u0644\u0627\u0646 \u063a\u06cc\u0628\u062a",
]
missing = [k for k in need if k not in text]
if missing:
    sys.exit("assembled app.js missing: " + ", ".join(missing))
(root/"app.js").write_bytes(data)
print(f"assembled app.js ({len(data)} bytes) from {len(parts)} parts")
