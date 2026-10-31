---
id: VIS-product
type: vision
title: Product vision — a configurator that understands vehicles
status: active
tags: [vision]
links: [PRN-principles, ONT-overview, AGT-ingestion]
updated: 2026-09-24
---

# Product vision

A web configurator where a user builds a vehicle in real-time 3D — era, paint, wheels, suspension,
interior, engine, openable doors and lids, per-part editing — starting with the Brazilian **Fusca**
(VW Type 1) and **open to any other vehicle line** (Kombi, Brasília, Opala…).

The hard part is not rendering: every 3D asset is authored differently (units, naming language,
panels fused into the shell, doors merged into one mesh, wheels bundled per axle). The product's core
capability is to **understand** an asset — map each piece of geometry onto a canonical vocabulary of
vehicle parts — and then configure it uniformly.

## What "understanding" means here
- Each asset gets a [model profile](../contracts/model-profile.md): its essence as data.
- Profiles speak the [ontology](../ontology/README.md); systems act on ontology slots and
  capabilities, never on file names.
- New assets are onboarded by the [ingestion agent](../agents/ingestion-agent.md), which proposes a
  profile from a [learned library](../algorithms/learning-loop.md) of verified part signatures; a
  human verifies; every verification makes the next ingestion better.

## Non-goals (for now)
Photorealism, a historically verified parts catalogue, a backend, mobile-first layout.
