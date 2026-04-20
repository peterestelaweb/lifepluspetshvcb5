# Design Notes

## Decision

Use OpenSpec as the central planning layer, but keep the previously created markdown summaries as supporting working notes until the next round of work is migrated or archived.

## Rationale

- The existing project is not a software repo with code modules to spec against.
- The most valuable immediate use of OpenSpec here is governance of campaign scope, catalog truth, and landing requirements.
- The artifact set should stay minimal and high-signal so future work can continue cleanly.

## Follow-Up

The next substantial artifact should be a copy-focused change or delta for the landing page rather than more broad strategic prose.

## Multi-Agent Division (Recommended)

Use a hub-and-spoke execution model with one orchestrator and five specialized workers.

### Orchestrator Agent

Role:

- keeps scope, deadlines, and consistency across all outputs
- enforces phase-1 product priority
- approves final payload for landing page integration

Skill focus:

- `Content Creator`
- `Social Media Strategist`

Output:

- single campaign brief
- final cross-channel messaging map

### Agent 1 - Campaign Strategy

Role:

- define ICPs, message pillars, offer architecture, and launch sequence

Skill focus:

- `Content Creator`

Output:

- strategic narrative
- positioning matrix by audience
- 4-week publishing cadence

### Agent 2 - Instagram and Dog Communities

Role:

- produce social-first assets for dog owners and social groups

Skill focus:

- `Instagram Curator`
- `Social Media Strategist`

Output:

- captions
- carousel scripts
- reels scripts
- community activation plan for dog groups

### Agent 3 - B2B Vet Channel

Role:

- build veterinary outreach and professional trust assets

Skill focus:

- `LinkedIn Content Creator`
- `Legal Compliance Checker` (for final claim pass)

Output:

- LinkedIn post pack
- clinic one-pager outline
- outreach email sequence
- first-call script for partnerships

### Agent 4 - SEO and Content Hub

Role:

- build the Spanish search capture strategy and blog roadmap

Skill focus:

- `SEO Specialist`

Output:

- keyword clusters
- URL architecture
- metadata templates
- article outlines aligned to phase-1 products

### Agent 5 - Landing Synthesis

Role:

- combine all approved outputs into one conversion-oriented landing page

Skill focus:

- `frontend-skill`
- `Content Creator`

Output:

- landing section hierarchy
- on-page copy draft
- CTA map for B2C and B2B
- form and routing logic (consumer vs professional lead)

## Integration Contract

Every worker must deliver:

- one-page summary
- assumptions and open risks
- reusable snippets for landing copy
- compliance-sensitive wording notes

The orchestrator merges only approved items and rejects channel output that conflicts with:

- phase-1 product scope
- support-language compliance
- established visual direction from Ahiflower assets
