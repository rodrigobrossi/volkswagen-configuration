---
id: IDX-map
type: index
title: Map of content
status: active
tags: [brain]
links: [IDX-brain]
updated: 2026-09-24
---

# Map of content

**Why** — [product vision](00-vision/product.md) · [principles](00-vision/principles.md) · [glossary](00-vision/glossary.md)

**What a vehicle is** — [ontology](ontology/README.md) · [vehicle & build frames](ontology/vehicle-frame.md) · [vocabulary](ontology/vocabulary.md)

**Contracts** — [model profile](contracts/model-profile.md) ([JSON Schema](contracts/model-profile.schema.json)) ·
[extraction strategy](contracts/extraction-strategy.md) · [vehicle family](contracts/vehicle-family.md) ·
[option group](contracts/option-group.md) · [configuration](contracts/configuration.md) ·
[built vehicle](contracts/built-vehicle.md) · [part signature](contracts/part-signature.md)

**Build pipeline** — [pipeline](algorithms/pipeline.md) → [normalize](algorithms/normalize.md) →
extract ([node](algorithms/extract-node.md) · [split merged X](algorithms/split-merged-x.md) ·
[region clip](algorithms/region-clip.md) · [trim pass](algorithms/trim-pass.md)) →
[articulate](algorithms/articulate-hinge.md) + [companions](algorithms/capture-companions.md) →
[measure wheels](algorithms/measure-wheels.md)

**Render systems & provisions** — [paint](algorithms/paint-detection.md) · [model resolution](algorithms/model-resolution.md) ·
[part discovery](algorithms/part-discovery.md) · [engine bay](algorithms/engine-bay.md) ·
[donor interior](algorithms/donor-interior.md) · [cabin floor](algorithms/cabin-floor.md) · [platform](algorithms/platform.md)

**Learning** — [signature features](algorithms/signature-features.md) · [classify (kNN)](algorithms/classify-knn.md) ·
[learning loop](algorithms/learning-loop.md) · library: [learning/signature-library.json](learning/signature-library.json)

**Agents** — [orchestrator](agents/orchestrator.md) · [ingestion](agents/ingestion-agent.md) ·
[verifier](agents/verifier-agent.md) · [catalog curator](agents/catalog-curator.md) · [brain keeper](agents/brain-keeper.md)

**Vehicles** — [VW Type 1 family](vehicles/vw-type1/family.md) · [catalog](vehicles/vw-type1/catalog.md) ·
[platform](vehicles/vw-type1/platform.md) · models: [Typ 11 1948](vehicles/vw-type1/models/typ11-1948.md) ·
[Beetle 1968](vehicles/vw-type1/models/beetle-1968.md) · [1303 1980](vehicles/vw-type1/models/beetle-1303-1980.md) ·
[Fusca 1973](vehicles/vw-type1/models/fusca-1973.md)

**Decisions** — [ADR index](decisions/README.md) · **Learnings** — [lesson index](learnings/README.md) ·
**Specs** — [spec index](specs/README.md) · **Roadmap** — [open work](roadmap/README.md)
