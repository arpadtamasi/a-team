---
id: T-019
title: >-
  A streamelt take-WAV végén ~3 s csend-pad van — a dev-elemzők vegyék
  figyelembe
status: backlog
origin: imported
types:
  - bug
profiles:
  - bug
priority: medium
risk: high
package: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: Fri Jul 17
updated_at: '2026-07-21'
---
# T-019 — A streamelt take-WAV végén ~3 s csend-pad van — a dev-elemzők vegyék figyelembe

## Outcome

A dev-elemző eszközök helyesen kezelik a streamelt take-WAV végi csend-padet — a felvétel közbeni WAV-streamelés (2026-07-17, `fix/take-score-latency`) a fejlécet a klikk-sáv előre ismert hosszából írja (`TakeRecorder.plannedPcmBytesFor`: klikk + 0,4 s stop-késés + 3 s ráhagyás), és a `finish` a bejelentett méretig csend-paddel tölt, így a streamelt WAV mindig ~2–3 s digitális nullával ér véget, míg a fallback-úton feltöltött pontos hosszú.

## Scope

2026-07-17 `fix/take-score-latency` adversarial review (#5 találat); rp döntése: TODO, nem branch-scope.

## Non-goals

No additional non-goals were stated in the legacy contract.

## Acceptance

A régi `Done when` alapján, finomításkor véglegesítendő jelölt feltételek:

## Verification

- Verify the observable outcome against the source evidence and the affected product seam.

## Constraints

Migrated from O-19; lane: scoring; legacy status: backlog.

## Open decisions

None.

## Actual behaviour

A dev-eszközök (`tools/oneanda/analyze.py` `dur=`, az `oneanda-viz` burkoló-percentilisei, jövőbeli „mic-halott" heurisztika) a fájlból számolnak — a nulla-farok a rövid take-eknél (pl. starter session) torzíthatja a zajpadló-percentilist, és a `dur` szisztematikusan hosszabb a ténylegesnél. A pontozást NEM érinti (az a doc onsetjeiből megy).

## Expected behaviour

A dev-elemző eszközök helyesen kezelik a streamelt take-WAV végi csend-padet — a felvétel közbeni WAV-streamelés (2026-07-17, `fix/take-score-latency`) a fejlécet a klikk-sáv előre ismert hosszából írja (`TakeRecorder.plannedPcmBytesFor`: klikk + 0,4 s stop-késés + 3 s ráhagyás), és a `finish` a bejelentett méretig csend-paddel tölt, így a streamelt WAV mindig ~2–3 s digitális nullával ér véget, míg a fallback-úton feltöltött pontos hosszú.

## Reproduction steps

Use the concrete evidence and reproduction described in the migrated legacy contract.

## Environment

one&a · scoring lane

## Frequency

Preserve the observed frequency from the source evidence; measure again before implementation.

## Impact

A dev-eszközök (`tools/oneanda/analyze.py` `dur=`, az `oneanda-viz` burkoló-percentilisei, jövőbeli „mic-halott" heurisztika) a fájlból számolnak — a nulla-farok a rövid take-eknél (pl. starter session) torzíthatja a zajpadló-percentilist, és a `dur` szisztematikusan hosszabb a ténylegesnél. A pontozást NEM érinti (az a doc onsetjeiből megy).

## Regression-test expectation

Add a deterministic regression at the closest public seam.



## Execution notes

Migration preview only. Source: scrum/tickets/O-19-streamelt-wav-csend-pad.md. No product implementation or human ready approval is implied.
