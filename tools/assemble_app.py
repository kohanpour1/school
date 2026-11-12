#!/usr/bin/env python3
"""Join app/src/main/assets/www/parts/part_*.b64 into a single app.js."""
import base64
import pathlib
import sys

root = pathlib.Path("app/src/main/assets/www")
parts_dir = root / "parts"
parts = sorted(parts_dir.glob("part_*.b64"))
if len(parts) < 120:
    sys.exit(f"expected 120 parts, got {len(parts)} in {parts_dir}")
b64 = "".join(p.read_text(encoding="utf-8").strip() for p in parts)
try:
    data = base64.b64decode(b64, validate=True)
except Exception as e:
    sys.exit(f"base64 decode failed: {e}")
text = data.decode("utf-8")
need = ["80254748", "renderLogin", "jalaliDateOptions", "اعلان غیبت", "visualViewport"]
missing = [k for k in need if k not in text]
if missing:
    sys.exit("assembled app.js missing: " + ", ".join(missing))
out = root / "app.js"
out.write_bytes(data)
print(f"assembled {out} ({len(data)} bytes) from {len(parts)} parts")
