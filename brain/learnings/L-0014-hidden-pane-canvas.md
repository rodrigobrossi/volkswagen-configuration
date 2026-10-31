---
id: L-0014
type: learning
title: Hidden browser pane ⇒ canvas never measures
status: active
tags: [learning, verification]
links: [AGT-verifier]
updated: 2026-10-06
---

# Hidden browser pane ⇒ canvas never measures

When the preview pane is hidden, the R3F canvas stays 300×150 and `onCreated` never fires
(`window.__scene` undefined). Show the pane / take a screenshot to trigger layout before probing.
