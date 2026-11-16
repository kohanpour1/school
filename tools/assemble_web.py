#!/usr/bin/env python3
import base64, pathlib
root = pathlib.Path(".")
for name in ["app.part1.js", "app.part2.js"]:
    parts = sorted(root.glob(f"chunks/{name}.*.b64"), key=lambda p: int(p.name.split(".")[-2]))
    data = "".join(p.read_text().strip() for p in parts)
    (root / name).write_bytes(base64.b64decode(data))
    print("assembled", name, (root / name).stat().st_size)
