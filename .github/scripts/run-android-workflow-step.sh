#!/usr/bin/env bash
set -euo pipefail

STEP_NAME="${1:?Pass an exact step name from .github/workflows/android.yml}"

python3 - "$STEP_NAME" <<'PY'
from pathlib import Path
import sys

step_name = sys.argv[1]
source = Path(".github/workflows/android.yml").read_text(encoding="utf-8").splitlines()
needle = f"      - name: {step_name}"
matches = [i for i, line in enumerate(source) if line == needle]
if len(matches) != 1:
    raise SystemExit(f"Expected one release-workflow step named {step_name!r}; found {len(matches)}")

start = matches[0]
end = next((i for i in range(start + 1, len(source)) if source[i].startswith("      - name: ")), len(source))
run_markers = [i for i in range(start + 1, end) if source[i] == "        run: |"]
if len(run_markers) != 1:
    raise SystemExit(f"Step {step_name!r} must contain exactly one literal 'run: |' block")

script_lines = []
for number, line in enumerate(source[run_markers[0] + 1:end], start=run_markers[0] + 2):
    if not line.strip():
        script_lines.append("")
        continue
    if not line.startswith("          "):
        raise SystemExit(f"Unexpected YAML indentation in step {step_name!r} at source line {number}")
    script_lines.append(line[10:])

script = "\n".join(script_lines).rstrip() + "\n"
if not script.strip():
    raise SystemExit(f"Extracted an empty shell script for step {step_name!r}")

Path("/tmp/imagemate-android-workflow-step.sh").write_text(script, encoding="utf-8")
PY

bash /tmp/imagemate-android-workflow-step.sh
