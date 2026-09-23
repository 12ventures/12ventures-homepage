# MLKCH compliance visibility — executive summary

**Date:** 22 September 2026
**Scope of this pass:** the 2015 Joint Commission workbooks in this folder, plus public sources on how surveys work and on systems MLKCH is known to use. This is not a live compliance score for the hospital. The workbooks do not contain one.

**How to read confidence tags**

| Tag | Meaning |
|---|---|
| Confirmed | Stated in the MLKCH workbook packet, or in a primary public source cited in [07-Sources.md](07-Sources.md) |
| Inference | A documented fact applied to MLKCH's known setup. The leap is named. |
| Pattern | Common at similar hospitals. Not confirmed for MLKCH. |
| Open | Not established. Listed in [07-Sources.md](07-Sources.md) as a question. |

---

## What the packet actually is

The folder holds 16 chapter workbooks plus an index. A full parse produced **209 standards and 1,343 elements of performance (EPs)**. The index also names two chapters that are not in the folder: **Medical Staff (MS)** and **Provision of Care, Treatment, and Services (PC)**. Confirmed, file `2015 TJC Check List.xlsx`.

Each EP row is a requirement, not evidence that MLKCH meets it. The columns `MLKCH Validation` and `Person Responsible` are empty across the packet. One cell in Infection Control contains the digit `1` and no person's name. There is no current compliance score hiding in these files.

The rows do carry the structure a scorecard needs: the requirement text, a 2015 scoring category (`A` or `C`), a documentation flag (`D`), a measure-of-success flag (`M`), and crosswalk marks to CMS Conditions of Participation and California Title 22. Those marks are flags in the sheet. This pass did not re-verify every CMS citation against the Code of Federal Regulations, and at least one Medication Management row cites sections that do not look like pharmacy rules. Treat the crosswalk as a lead, not as a legal memorandum.

## What an audit actually is

A Joint Commission hospital survey is unannounced. The next full survey is generally expected 30 to 36 months after the last one. Surveyors follow individual patients through the building (tracer methodology), review a fixed document list on arrival, and cite failures as Requirements for Improvement. Corrective evidence is due within 60 days of the final report. A Life Safety Code surveyor is part of every hospital survey and spends hours walking the building plus a long document review. Sources: Joint Commission accreditation process page and the 2025 Hospital Survey Activity Guide. Confirmed as the current published process. It is not a description of MLKCH's last survey.

The on-site event itself is days, not weeks. Joint Commission sets the length from the hospital's application. A published example agenda is three surveyors over five days. That example is not MLKCH's agenda. Open for MLKCH's actual last survey length.

Preparation that runs for weeks is a real work pattern, and it is mostly not the days the surveyors are in the building. It is the standing document chase (12 months of minutes, drills, logs, and policies must be producible the morning they arrive) plus up to 60 days of corrective-action writing afterward. The packet's own blank owner column is a small picture of that problem: 1,343 requirements and no named owner in the file.

MLKCH was surveyed recently. If that event was a full survey, the next unannounced window is not immediate. The exact date is still Open, and it changes how a pilot should be timed.

## The category map

The category breakdown is [08-Hospital-Category-Map.md](08-Hospital-Category-Map.md): eight areas, the readiness topics under each, and the Joint Commission standards that define them. [03-Compliance-Scorecard.md](03-Compliance-Scorecard.md) is the same map with the EP counts and the scoring rubric. The `x / 5` line is blank because that number is a judgment of current operations, and these files are the standard, not a review of MLKCH's operations.

Which systems those areas actually collapse onto, and what SOC 2 and a business associate agreement are for, is [09-What-We-Need-Access-To.md](09-What-We-Need-Access-To.md).

## What can be scored now, and what cannot

A "3 / 5 Partially ready" compliance score cannot be shown yet. The workbooks define the categories. They are not evidence of how MLKCH is performing inside them.

Two different numbers should stay separate:

1. **Audit exposure (computable now).** How much of the chapter is process-sampled, documentation-required, tied to Medicare rules, or flagged for a numeric measure of success if it is cited. This says where a survey hurts, not whether MLKCH is failing.
2. **Compliance score (computable only after evidence is ingested).** A 0–5 rollup once each EP has an evidence state. Rubric is in [03-Compliance-Scorecard.md](03-Compliance-Scorecard.md). Today every chapter is **Unscored**.

Highest exposure in this packet, using the formula in the scorecard document:

| Chapter | EPs | Exposure (0–100) | Sensitivity of the evidence | Practical first system |
|---|---:|---:|---|---|
| Record of care (RC) | 53 | 60 | Patient chart (PHI) | Oracle Health / Cerner |
| Life safety (LS) | 195 | 51 | Building logs, usually no PHI | Unknown CMMS or binders |
| Human resources (HR) | 44 | 51 | Workforce records, usually not PHI | SnapSkill + Dossier |
| Environment of care (EC) | 148 | 46 | Building and equipment logs | Unknown CMMS or binders |
| Rights (RI) | 116 | 39 | Policies plus patient-level proof | Policy store + Oracle Health |
| Medication management (MM) | 136 | 34 | Orders, dispensing, administration (PHI) | Oracle Health + dispensing cabinets |
| Waived testing (WT) | 26 | 34 | Staff competency plus QC logs; QC can be patient-linked | Point-of-care devices + Dossier |
| National Patient Safety Goals (NPSG) | 85 | 28 | Chart and observation (PHI) | Oracle Health |

HR is the unusual cell: exposure is high, and the data is mostly employee data rather than patient data. MLKCH staff already sign into SnapSkill, a learning system, with hospital credentials. MLKCH also uses a system called Dossier, which matches the healthcare competency platform at dossier.com (Inference; the contract is not in this source set). That is the safest first slice of a live score.

Life safety is equally exposed and also mostly non-PHI, but the system of record is not known. This kind of evidence is often still binders and spreadsheets. Pattern.

## What would have to be connected

Confirmed systems:

- **Oracle Health (Cerner) Millennium**, full instance, implemented in 2015. In 2016 it was hosted at Cerner's Kansas City data center, not in a hospital server room. About 58 medical devices were connected at go-live. Current cloud region in 2026 was not reconfirmed.
- **SnapSkill**, a learning system MLKCH staff already use. Single sign-on with MLK credentials. There is no inbound path from that product into the hospital's other systems.
- **Microsoft infrastructure** for enterprise servers (Windows, VMware, EMC backup) was the published build for the 2015 opening. That does not tell us which application holds policies or quality data.

Everything else in the system map (dispensing cabinets, facilities work orders, credentialing, incident reporting, policy library) is a named example of the category, or an open question. See [04-Systems-Data-and-APIs.md](04-Systems-Data-and-APIs.md).

Oracle Health publishes FHIR R4 APIs (Ignite / Millennium). They are query APIs under a tenant agreement. They are not a standing live feed of every compliance fact, and they do not contain fire-drill logs, competency checkoffs, or board minutes. A knowledge graph that only connects to the EHR will miss the chapters that are mostly documents.

## Security, in one page

"Clearance" here is not a government security clearance. Nothing in the public record suggests classified or federal-contractor systems. The gates that matter are:

- **Workforce / operations data** (training completions, license dates, fire-drill logs, generator tests): not HIPAA protected health information when the hospital holds them as employer or facilities records. Still confidential. The existing SnapSkill single sign-on already sits here. A business associate agreement is not what makes this safe; keeping patient stories out of the training record is.
- **PHI** (charts, medication administration, infection lists, grievance files that name a patient): HIPAA applies. A business associate agreement, minimum-necessary design, and access logs are the gate. SOC 2 is a security attestation customers ask for; it does not replace the agreement.
- **Peer review and NPDB**: tighter than ordinary PHI. California peer-review privilege and federal NPDB redisclosure rules are reasons not to pour credentialing files into a general chatbot, even for the CEO.

Full classification: [05-Data-Sensitivity-and-Security.md](05-Data-Sensitivity-and-Security.md).

## What to take to the CTO

1. The hospital cannot see its own compliance posture in this packet. The taxonomy is there. The evidence and the owners are not.
2. A live score is feasible first on **workforce competence** (HR, and the competency slices of nursing, waived testing, and medication administration) because SnapSkill is already trusted and the data class is the safer one.
3. The second non-PHI slice is **life safety and environment of care**, which is where surveys spend a dedicated surveyor and where hospitals still assemble binders by hand. The system to plug into is not yet identified.
4. The clinical score (record of care, medications, safety goals) should wait until a BAA and an Oracle Health tenant app exist. The data is already digital. The permission is the work.
5. Two large survey sessions have no workbook in this drop: medical staff credentialing (a scheduled 60-minute survey activity) and provision of care (what tracers are actually about). Any scorecard that omits them will look complete and will not match the survey.

## Document set

| Doc | Contents |
|---|---|
| [02-How-Hospital-Audits-Work.md](02-How-Hospital-Audits-Work.md) | Survey mechanics, what is manual, what is days vs. weeks |
| [03-Compliance-Scorecard.md](03-Compliance-Scorecard.md) | Categories, subcategories, exposure index, future 0–5 rubric |
| [04-Systems-Data-and-APIs.md](04-Systems-Data-and-APIs.md) | Systems, APIs, freshness, on-prem vs hosted, options |
| [05-Data-Sensitivity-and-Security.md](05-Data-Sensitivity-and-Security.md) | PHI vs workforce, BAA, SOC 2, peer review |
| [06-Knowledge-Graph-and-Roles.md](06-Knowledge-Graph-and-Roles.md) | Graph shape, CEO / CTO / CNO views, restrictions |
| [07-Sources.md](07-Sources.md) | Sources and the open-question ledger |
