#!/usr/bin/env python3
import base64, pathlib, sys
root = pathlib.Path("app/src/main/assets/www")

# Prefer single complete file if present (future)
full = root / "app.full.js"
if full.exists() and full.stat().st_size > 50000:
    text = full.read_text(encoding="utf-8")
    (root / "app.js").write_text(text, encoding="utf-8")
    print(f"used app.full.js ({len(text)} bytes)")
    sys.exit(0)

# Prefer big_* parts (15 chunks) if present
big = sorted((root / "parts").glob("big_*.b64"))
if len(big) >= 10:
    b64 = "".join(p.read_text(encoding="utf-8").strip() for p in big)
    data = base64.b64decode(b64)
    (root / "app.js").write_bytes(data)
    print(f"assembled from {len(big)} big parts ({len(data)} bytes)")
    sys.exit(0)

parts = sorted((root / "parts").glob("part_*.b64"))
if len(parts) < 100:
    sys.exit(f"expected parts, got {len(parts)}")
b64 = "".join(p.read_text(encoding="utf-8").strip() for p in parts)
try:
    data = base64.b64decode(b64, validate=True)
except Exception:
    data = base64.b64decode(b64)
text = data.decode("utf-8")
need = ["renderLogin"]
missing = [k for k in need if k not in text]
if missing:
    sys.exit("assembled app.js missing: " + ", ".join(missing))
for k in ["jalaliDaysInMonth", "assignments", "teachersFor", "boshra_sess", "renderSetup", "myAssignments"]:
    print("feature", k, "OK" if k in text else "MISSING")
(root / "app.js").write_bytes(data)
print(f"assembled app.js ({len(data)} bytes) from {len(parts)} parts")
