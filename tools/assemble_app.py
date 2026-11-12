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
    # try without strict validate if mixed lengths
    try:
        data = base64.b64decode(b64)
    except Exception as e2:
        sys.exit(f"base64 decode failed: {e2}")
text = data.decode("utf-8", errors="replace")
need = ["80254748", "renderLogin"]
missing = [k for k in need if k not in text]
if missing:
    sys.exit("assembled app.js missing: " + ", ".join(missing))
for k in ["jalaliDaysInMonth", "assignments", "teachersFor", "boshra_sess"]:
    print("feature", k, "OK" if k in text else "MISSING")
(root/"app.js").write_bytes(data.encode("utf-8") if isinstance(data, str) else data)
print(f"assembled app.js ({len(data)} bytes) from {len(parts)} parts")
