---
id: ADR-0003
type: decision
title: ADR-0003 — Learn with heuristics + a signature library
status: active
tags: [adr]
links: [ALG-learning-loop, ALG-classify-knn]
updated: 2026-09-29
---

# ADR-0003 — Heuristics + signature library, not a trained model (yet)

**Context.** The owner wants algorithms that learn the essence of each part. We have 4 verified assets.

**Decision.** Deterministic geometry + multilingual vocabulary + kNN over signatures learned from
verified profiles; humans verify drafts; leave-one-out measures progress.

**Consequences.** Works from the first model and is explainable (evidence per candidate). Revisit when
dozens of verified assets exist ([T-0005](../roadmap/T-0005-ml-classifier.md)).
