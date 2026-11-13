#!/usr/bin/env python3
from pathlib import Path
import base64
root = Path(__file__).resolve().parents[1]
www = root / "app" / "src" / "main" / "assets" / "www"
www.mkdir(parents=True, exist_ok=True)
parts = [root / "tools" / f"app_v157_b64.part{i}" for i in range(4)]
if all(p.exists() for p in parts):
    raw = base64.b64decode("".join(p.read_text().strip() for p in parts))
    (www / "app.js").write_bytes(raw)
    print("assembled", len(raw))
elif (www / "app.js").exists():
    print("app.js present", (www/"app.js").stat().st_size)
else:
    raise SystemExit("missing app")
