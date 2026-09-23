# Research plan (working notes)

The briefing set is the numbered documents `01` through `09`. This file is the scoping plan that produced them. Where the two disagree, including column definitions, use the numbered documents. They are the later version.

**Date:** 22 September 2026
**Scope:** the 2015 Joint Commission workbooks in this folder, plus public sources on surveys and on systems MLKCH is known to use. The product is a knowledge-graph view of hospital compliance readiness, first for MLKCH and shaped so it can apply to other hospitals later.

---

## 1. What I did before writing this plan (so the plan is grounded, not generic)

1. **Inventoried the actual files in this folder** (not just titles). There are two things here, not one:
   - `Gemini Export ... .docx` — a prior AI-generated *meta-analysis* of the spreadsheets (what they are, who uses them, sample RAG questions). Useful as a secondary source, not primary.
   - `[0] MLKCH - The Joint Commission 2015 Requirements/` subfolder — **17 Excel workbooks**, one per TJC chapter (MM, EC, EM, HR, IC, IM, LD, LS, NPSG, NR, PI, RC, RI, TS, WT, APR) plus a `2015 TJC Check List.xlsx` index sheet.
2. **Opened the index sheet.** It lists **18 TJC chapters** total and marks which ones exist in this drop with an "x". Two chapters are explicitly **not** in this folder: **MS (Medical Staff)** and **PC (Provision of Care, Treatment, and Services)**. These are large, audit-critical chapters (credentialing/privileging; actual clinical care processes) — this is a real gap I'll need to fill or flag (see §7 open questions).
3. **Opened the actual workbook structure** (not just sheet names) for MM, LD, EC, and the checklist. Confirmed the real schema, which will drive the whole ontology:
   - Each chapter workbook is one sheet, laid out **vertically**: a `STANDARD` row (standard code + full narrative/rationale text) followed by a repeating header row (`Compliant Y/N | CMS | MOS | CR | DOC | SC | ESP | Elements of Performance | Title 22 | MLKCH Validation | Person Responsible`) and then one row per **Element of Performance (EP)** under that standard.
   - `CMS` and `Title 22` columns are **crosswalk citations** — e.g. `§482.25(b)(8)` for CMS Conditions of Participation, plus California Title 22 references. This confirms TJC accreditation here is doing triple duty: TJC standard, CMS deemed-status requirement, and CA state licensing requirement, all on one row.
   - `DOC` = whether **documentation is required** for that EP (TJC's public "A/C/D" scoring category system). `CR` flags **critical/direct-impact requirements**. `MOS` = **Measure of Success** — the metric a hospital must define when it has to submit a corrective action after a citation. `ESP`/`SC` are additional TJC scoring-category fields I'll confirm precisely against the current TJC "Accreditation Participation Requirements" / scoring guide rather than guess.
   - **Important finding:** the `MLKCH Validation` and `Person Responsible` columns — the columns that would show *MLKCH's actual current compliance status and ownership* — are **empty in every workbook I sampled** (checked MM: 156 EP rows, LD: 223 EP rows, EC: 168 EP rows, all blank). This means: **this packet is the blank regulatory taxonomy/template, not MLKCH's actual compliance data.** That materially changes the plan — I can mine these files for the *category structure and scoring rules*, but I cannot mine them for *MLKCH's real compliance state*. That has to come from systems/people, which is the whole point of the project.
4. **Pulled public facts on MLKCH** to ground sizing and systems (cited inline, not assumed):
   - 131 licensed beds (93 med/surg, 20 ICU, 18 OB), 21-bed ED, 4 ORs, safety-net nonprofit, opened 2015, public/private partnership with LA County (leases the building from the County) — [mlkch.org opening announcement](https://www.mlkch.org/open-accreditation); FY18 Community Benefit Report.
   - ED sees ~100–124k visits/year — high volume for a 131-bed hospital — per MLKCH Community Benefit Report FY18 and GuideStar filing.
   - **EHR confirmed: Cerner** (now Oracle Health), implemented as a full "big-bang" go-live in 2015, **hosted at Cerner's Kansas City data center** (not on-prem for the core EHR), with ~58 connected medical devices, HIMSS Stage 6 achieved shortly after go-live — per [healthsystemcio.com interview with then-CIO Sajid Ahmed](https://healthsystemcio.com/2016/12/06/sajid-ahmed-chief-information-innovation-officer-mlk-community-hospital-chapter-2/) and [HealthLeaders Media](https://www.healthleadersmedia.com/innovation/mlk-jr-community-hospital-sets-blueprint-hospital-reboots). The core clinical system is vendor-hosted, which is favorable for an API integration compared with an on-prem legacy system.
   - Underlying network/server infrastructure was designed by PLANNET/Top Tier Consulting around a Microsoft Windows Server/VMware stack. That is consistent with a generally Microsoft enterprise environment. It does not establish which application holds policies or quality data today.

The spreadsheets are close to what is needed to define compliance categories, but they are a **taxonomy of requirements**, not a live data source — and two chapters are missing outright.

---

## 2. How I'm framing the problem (so scope doesn't balloon or drift)

Two genuinely different work products are being asked for, and I'll keep them structurally separate so neither one gets diluted:

- **Product A — Compliance Readiness Taxonomy & Scoring Model.** A hospital-compliance category model: domains, a score, a status word, and the evidence underneath. Built primarily *from the TJC/CMS/Title 22 documents themselves* plus external research to fill the two missing chapters and to correctly define the scoring semantics (DOC/CR/MOS/SC etc.), so it is defensible against the standard, not invented.
- **Product B — System & Data Landscape Map.** For each category/sub-category in Product A, what real-world hospital system(s) would hold the evidence, whether MLKCH-specific or "type of system most hospitals like this run," with API/realtime/on-prem findings and buy-vs-build options. This is the "what would we need access to" half.

A third, smaller thread ties them together:

- **Product C — Knowledge Graph & Personalization Design.** The ontology (entities/relationships) that Products A and B feed into, plus how the same graph supports role-aware answers (CEO vs. CTO vs. CNO) and role-based data restriction. This is architecture, not a research task — it gets designed *from* the outputs of A and B, so it's sequenced last.

---

## 3. Research plan for Product A — Compliance Taxonomy & Scoring Model

**Step A1 — Extract the full EP inventory from every workbook programmatically.** Not by skimming — by parsing all 17 workbooks row-by-row (I already validated the parser approach on MM/LD/EC) to produce one structured table: `Chapter | Standard code | Standard narrative | EP # | EP text | DOC | CR | MOS/SC/ESP fields | CMS citation | Title 22 citation`. This becomes the raw substrate for every category and sub-category — several hundred to ~1,500+ EPs across chapters (LD alone had 223 EP rows, MM had 156, EC 168 — scaling that across all 17 files, this is a large but fully tractable dataset).

**Step A2 — Determine the correct top-level category structure.** Rather than inventing categories, I'll derive them from how TJC itself organizes chapters (already a de facto taxonomy: Leadership, Environment of Care, Life Safety, Medication Management, Infection Control, Emergency Management, HR, Information Management, Nursing, Rights & Responsibilities, Record of Care, Performance Improvement, National Patient Safety Goals, Transplant Safety, Waived Testing, Accreditation Participation Requirements) and then group them into an executive-facing readiness scorecard. I will explicitly verify this against TJC's current public chapter list (jointcommission.org standards FAQ / accreditation manual index) rather than relying only on the 2015 packet, and note anywhere 2015→current naming has changed.

**Step A3 — Fill the two missing chapters (MS, PC).** The two workbooks are not in this drop. Reconstruct the equivalent category-level taxonomy from TJC's public 2015 Comprehensive Accreditation Manual for Hospitals (CAMH) chapter summaries / FAQ pages and CMS Conditions of Participation §482 subparts (Medical Staff = §482.22, Provision of Care overlaps several CMS subparts) — clearly labeled as "reconstructed from public regulatory text, not the MLKCH packet" so it is never confused with a primary MLKCH source. Do not invent EP counts.

**Step A4 — Nail down the scoring semantics precisely, not approximately.** `DOC` (A/C/D categories), `CR` (direct/immediate threat vs. standard), `MOS` (Measure of Success used in Evidence of Standards Compliance submissions), and `SC`/`ESP` need to be defined from TJC's own published scoring guidance (survey scoring, ESC process, SAFER matrix), not inferred from column headers alone. I will cite TJC's own accreditation/scoring documentation for each term.

**Step A5 — Research the actual current audit/survey process, quantified, with sources.** Planned sub-questions, each answered with citations from jointcommission.org, CMS.gov, and credible secondary sources (compliance consultancies, hospital association guidance), each tagged with a confidence level:
   - Survey frequency and notice (unannounced, 18–39 month window; what "always survey-ready" actually requires operationally).
   - Survey duration/team size for a hospital of MLKCH's size and services.
   - **Tracer methodology** — how surveyors follow individual patients through their care in real time and check compliance against exactly the EP-level requirements in these spreadsheets — this is the mechanistic link between "spreadsheet row" and "what happens on the survey floor."
   - **SAFER matrix** scoring (risk level × scope) surveyors now use to categorize findings.
   - Post-survey **Evidence of Standards Compliance (ESC) + Measure of Success** submission process and timelines (including the 23-day rule for Immediate Threat to Life findings) — this is likely the single biggest manual/administrative burden, and I want real published timelines, not a guess.
   - Where the "weeks of manual work" actually comes from operationally: pre-survey mock-tracer prep, document/binder assembly per department, staff interview prep, corrective action plan writing — I'll look for compliance-consultant and hospital-association write-ups that describe this prep burden concretely, and flag anything not from a primary source as a lower-confidence, "commonly reported" pattern rather than fact.

**Step A6 — Design the scoring model itself**: category, sub-category, a quantified score, a status label such as Partially ready or Material gap, a priority tag, and evidence citations, calibrated to the workbook's own marks (category C, documentation required, CMS crosswalk, measure of success) rather than to the surveyor's SAFER matrix. SAFER is applied after a finding. This score is the view before surveyors arrive.

**Step A7 — Version-proof the taxonomy.** Later hospitals may be on a newer manual. Structure category IDs around stable *domain intent* (e.g., "high-alert medication safety," "credentialing/privileging currency," "life-safety egress/fire watch") rather than hard-coding 2015 EP numbers as the permanent key, with the 2015 EP codes stored as one mapped attribute among possibly several manual versions. I'll call this out explicitly as a design decision in the final doc.

---

## 4. Research plan for Product B — System & Data Landscape Map

For **every category/sub-category** produced in Product A, I will work through this fixed template, and I will not skip the "unknown" case silently — if MLKCH-specific info can't be found, I'll say so and give named-brand examples of what hospitals like this typically run, as follows:

1. **What evidence/data would prove compliance for this category?** (derived directly from the EP text — e.g., "documented competency assessment dated within X," "temperature log for medication refrigerator," "credentialing file with primary-source verification").
2. **What system(s) most plausibly hold that evidence at MLKCH specifically?** — grounded first in confirmed facts (Cerner/Oracle Health EHR for anything clinical/medication/nursing-documentation-related), then in public secondary evidence (job postings, LinkedIn profiles of MLKCH/MLK-LA IT and quality staff, conference case studies, vendor press releases, county board documents like the one already found) before falling back to industry-typical examples.
3. **If MLKCH-specific system is not confirmable, give 1–3 named-brand examples** of what a hospital of this size/profile commonly uses for that function (e.g., credentialing/privileging platforms, nurse scheduling/staffing systems, incident-reporting/RL6-type systems, environment-of-care/facilities work-order systems, GRC/policy-management platforms, LMS/competency-tracking systems, life-safety/fire-inspection tracking tools) — and explicitly label these as "typical-pattern examples, not confirmed for MLKCH."
4. **API availability** — does the vendor publish an API (e.g., Oracle Health/Cerner's Ignite APIs, FHIR R4 endpoints), what's the access model (sandbox vs. production, per-client agreement, data-use agreement requirements), and what's realistically exposed vs. gated.
5. **Realtime-ness** — is data available near-real-time via API/HL7 interface feed, batch/nightly extract, or manual/spreadsheet-only (I'll flag categories I expect to be spreadsheet-heavy based on the nature of the requirement — e.g., committee meeting minutes, policy attestations, competency sign-off logs — as a hypothesis to validate, not a fact. The working relationship indicates that a lot of operational tracking is still in spreadsheets. That is not a system inventory).
6. **On-prem vs. cloud/vendor-hosted**, since this determines integration path and security conversation — noting that the core EHR is vendor-hosted (favorable), while smaller point solutions (scheduling, LMS, GRC, facilities) are more likely to be either regional/on-prem legacy tools or separate SaaS silos.
7. **Gap assessment** — is this system/data source actually conducive to being pulled into a live knowledge graph as-is?
8. **If not conducive: options**, judged on what it would take to build, not on internal purchasing process — for example a vendor module that already exposes FHIR, or a small connector that reads an export and writes structured evidence records. Scope these as a lightweight connector, not a full system rebuild.

I will research this **chapter by chapter** (mirroring Product A's structure) so the system map and the compliance taxonomy stay in lockstep — e.g., the Medication Management chapter's systems research (Cerner PharmNet/pharmacy module, automated dispensing cabinets like Pyxis/Omnicell, smart pump data) sits directly under the MM category, not in a separate disconnected list.

---

## 5. Research plan for Product C — Knowledge Graph & Personalization Design

Sequenced last because it depends on A and B's actual entity/relationship shape rather than a generic KG template. Planned content once A and B exist:

- **Ontology draft**: node types (Standard, EP, Requirement-Intent, Evidence Record, Data Source/System, Policy Document, Person/Role, Department, Patient-Care-Encounter [where relevant to tracer-style evidence], Corrective Action/MOS, Audit Event) and edge types connecting them (satisfies, evidenced-by, owned-by, sourced-from, cross-references).
- **Role-aware access and answer-shaping design**: map the hospital roles that would use the graph (CEO, CTO, CNO) to query scopes and answer framing — e.g., CEO gets aggregate risk/readiness rollups and trend framing, CTO gets system/integration/data-lineage framing, CNO gets nursing-chapter and patient-safety-tracer framing — plus a basic RBAC model for what data each role can see, referencing common healthcare data-access-control norms (minimum necessary/HIPAA-aligned access, not a specific product) as the guiding principle rather than inventing an access model from scratch.
- Mark this section as **design**, not a research-backed fact about the hospital. It is product architecture.

---

## 6. Sourcing, rigor, and confidence-rating rules I will apply throughout

Every claim in the briefing carries a source and one of these confidence tags:

- **Confirmed** — directly evidenced by a primary source: the MLKCH packet itself (cited as `File — Chapter — Standard/EP code`), TJC/CMS regulatory text, or a specific public MLKCH disclosure/press item (cited with URL).
- **High-confidence inference** — vendor documentation or a named case study establishes the general fact, applied to MLKCH's known configuration (e.g., "Cerner publishes FHIR APIs" + "MLKCH runs full Cerner" → API is very likely available, cited to Cerner/Oracle Health developer docs).
- **Industry-typical pattern (unconfirmed for MLKCH)** — common practice at comparable hospitals, flagged as a pattern to validate with the hospital, not a fact about MLKCH.
- **Assumption/open question** — anything I cannot source at all, written as a direct question rather than filled in silently.

No claim will be left untagged, and nothing will be presented as fact from memory alone without an attempt to verify it against a current (2026) source first.

---

## 7. Decisions recorded on 22 September 2026

| # | Question | Decision | Effect |
|---|---|---|---|
| 1 | Missing MS and PC workbooks | Reconstruct from public TJC and CMS sources. Do not invent EP counts | Those chapters are labeled reconstructed, never as an MLKCH workbook |
| 2 | Systems beyond Cerner | MLKCH staff sign into SnapSkill with MLK credentials. MLKCH also uses a system called Dossier. A full system inventory is not available | SnapSkill is a confirmed live connection. Dossier is a named system whose contract is not in this source set. See §7a |
| 3 | Microsoft GRC tooling (Purview, SharePoint, Power BI) | Not established | Left open wherever a category's likely tool is only "Microsoft" |
| 4 | Survey cycle | Recently surveyed | If that event was a full survey, the next unannounced window is not immediate. The date is still open |
| 5 | Existing access | Limited. SnapSkill single sign-on only. No inbound access to hospital systems beyond that | An identity relationship, not a data-access relationship |
| 6 | Scope | Strictly the 2015 packet | No 2026 standards comparison in this pass |

### 7a. Dossier

**[Dossier (dossier.com)](https://dossier.com/our-platform/)** is a healthcare competency platform for nursing, pharmacy, lab, and imaging. Its marketing targets Joint Commission, DNV, CMS, and Magnet readiness, and it describes integration with HR, EHR, and learning systems ([inpatient departments](https://dossier.com/who-we-serve/inpatient-departments/)). Inference: this is the Dossier MLKCH uses. Not confirmed by a contract. Worth one confirmation from the CTO.

1. It is a likely evidence source for competency requirements in HR, nursing, and department-specific skills (medication, infection, environment of care).
2. SnapSkill (training delivery) and Dossier (competency validation) sit in the same domain, and MLKCH already federates identity into SnapSkill. Workforce competence is the lowest-friction pilot.
3. The relationship is single sign-on, not an API into hospital systems. That is the gap a compliance product would close.

Detail is in [04-Systems-Data-and-APIs.md](04-Systems-Data-and-APIs.md).

---

## 8. Documents produced from this plan

1. [01-Executive-Summary.md](01-Executive-Summary.md)
2. [02-How-Hospital-Audits-Work.md](02-How-Hospital-Audits-Work.md)
3. [03-Compliance-Scorecard.md](03-Compliance-Scorecard.md)
4. [04-Systems-Data-and-APIs.md](04-Systems-Data-and-APIs.md)
5. [05-Data-Sensitivity-and-Security.md](05-Data-Sensitivity-and-Security.md)
6. [06-Knowledge-Graph-and-Roles.md](06-Knowledge-Graph-and-Roles.md)
7. [07-Sources.md](07-Sources.md)
8. [08-Hospital-Category-Map.md](08-Hospital-Category-Map.md)
9. [09-What-We-Need-Access-To.md](09-What-We-Need-Access-To.md)
