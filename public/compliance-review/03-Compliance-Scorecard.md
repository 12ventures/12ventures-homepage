# Scorecard Methodology

This is the category model for hospital compliance readiness: a small set of domains, a score, a status word, and the evidence underneath. Two numbers are defined on purpose, because only one of them can be calculated from these workbooks.

Machine-readable extract of the workbooks: `_tjc_inventory.json` (209 standards, 1,343 EPs). Standard titles below are the first line of each standard in those workbooks.

---

## 1. Compliance score vs audit exposure

### Compliance score — not available yet

A domain would show `3 / 5 · Partially ready` only after evidence is attached to EPs. In this packet the evidence column is empty. Publishing a compliance score now would be a fiction.

When evidence exists, score each EP from 0 to 5:

| EP state | Points | What "evidence" means |
|---|---:|---|
| No owner and no artifact | 0 | The row is still like today's spreadsheet |
| Owner named, artifact missing or expired | 1 | Accountability without proof |
| Policy or plan exists and is the current approved version | 2 | Enough for many category `A` document EPs |
| A sample, log, or transcript exists and is inside the required window (often 12 months) | 3 | The survey-morning test |
| That evidence is pulled from a named system, with a timestamp and a link, and it was refreshed inside the window | 4 | A surveyor can be shown the source |
| For `MOS` / process EPs: a numeric rate is trending inside the hospital's own threshold, not a one-time audit | 5 | The sustainment story the ESC asks for |

Domain score = weighted mean of EP points, displayed as `x / 5` rounded to a tenth, plus a word:

| Mean | Word | Priority hint |
|---|---|---|
| under 1.5 | Material gap | P0 if the chapter is also high exposure or CMS-heavy |
| 1.5 to under 3.0 | Partially ready | P1 |
| 3.0 to under 4.2 | Largely ready | P2 |
| 4.2 to 5 | Ready | Watch, don't ignore |

Weights inside the mean:

- Category `C` EPs count **1.5** (they are how tracers generate findings).
- Category `A` EPs count **1.0**.
- An EP with `DOC = D` gets an extra **0.25** (missing paper is difficult to talk away later).
- An EP with a non-empty CMS cell gets an extra **0.25** (deemed-status exposure). Turn this weight off for any cell later found to be a bad crosswalk.

The status words describe readiness. The points are not Joint Commission's SAFER matrix. SAFER is applied by surveyors after they see a failure. This score is the hospital's view before they arrive.

### Audit exposure — calculated from the 2015 packet

Exposure answers "where does a survey have the most to bite?" It does not answer "are they failing?"

```
exposure = 0.45 * (% of EPs that are category C)
         + 0.25 * (% of EPs marked documentation required)
         + 0.20 * (% of EPs with a CMS cell)
         + 0.10 * (% of EPs marked MOS)
```

The weights are a project choice so process sampling dominates, then document risk, then Medicare linkage, then the old measure-of-success flag. They are not a Joint Commission formula. Confidence: the percentages are Confirmed from the parse; the weights are a design choice.

| Chapter | Standards | EPs | % C | % doc | % CMS | % MOS | Exposure |
|---|---:|---:|---:|---:|---:|---:|---:|
| RC Record of care | 10 | 53 | 76 | 13 | 79 | 66 | **60** |
| LS Life safety | 18 | 195 | 70 | 3 | 92 | 3 | **51** |
| HR Human resources | 8 | 44 | 55 | 52 | 39 | 55 | **51** |
| EC Environment of care | 20 | 148 | 33 | 45 | 91 | 20 | **46** |
| RI Rights | 19 | 116 | 41 | 16 | 60 | 40 | **39** |
| MM Medication management | 20 | 136 | 39 | 15 | 43 | 40 | **34** |
| WT Waived testing | 5 | 26 | 42 | 42 | 0 | 42 | **34** |
| NPSG + Universal Protocol | 16 | 85 | 46 | 12 | 0 | 40 | **28** |
| IC Infection prevention | 11 | 64 | 22 | 25 | 36 | 17 | **25** |
| IM Information management | 8 | 33 | 15 | 24 | 42 | 9 | **22** |
| TS Transplant safety | 5 | 37 | 14 | 22 | 27 | 14 | **18** |
| LD Leadership | 33 | 190 | 3 | 12 | 55 | 2 | **15** |
| PI Performance improvement | 5 | 41 | 5 | 2 | 56 | 2 | **14** |
| EM Emergency management | 12 | 112 | 7 | 13 | 26 | 0 | **12** |
| APR Accreditation participation | 14 | 33 | 0 | 24 | 0 | 0 | **6** |
| NR Nursing | 5 | 30 | 0 | 23 | 0 | 0 | **6** |

Life safety's CMS rate is 92% with almost no `D` flags: the finding is in the building, not in a policy binder. Nursing's exposure is low because the 2015 NR chapter is about the nurse executive's structure and authority, not about bedside tasks. Bedside nursing practice is largely in Provision of Care and in the National Patient Safety Goals, and Provision of Care is missing from the folder.

California Title 22 flags (any non-empty cell, often just `Yes`) are densest in HR (41% of EPs), NR (30%), RI (23%), MM (21%), and IM (21%). Those chapters are where a state licensing visit and a Joint Commission visit are most likely to ask for the same staff or consent evidence. The flag was not put into the exposure formula because many cells are `Yes` rather than a citation that can be checked.

---

## 2. How the cards group

Eight domains. Subcategories are the standards already in the workbooks, clustered by what evidence they share. IDs are stable intent names (`people.competence`), with the 2015 codes stored as attributes so a later manual can map without a rewrite.

Domains that are mostly workforce or building data are marked so they can be piloted before any PHI agreement. The full rules are in [05-Data-Sensitivity-and-Security.md](05-Data-Sensitivity-and-Security.md).

| # | Domain | 2015 chapters | Exposure character | Data class for a first feed |
|---|---|---|---|---|
| 01 | People and competence | HR, NR, plus MS (missing) | HR is high; NR structure is low; MS is a live survey session with no file here | Workforce. Medical staff files are a separate, tighter class |
| 02 | Medication system | MM | High process sampling and measures | PHI once the evidence leaves the policy and the competency list |
| 03 | Patient safety practices | NPSG, Universal Protocol | High process sampling, little CMS text in this sheet | PHI |
| 04 | Infection, testing, tissue | IC, WT, TS | Middle | Split: program plans are documents; surveillance and QC are PHI |
| 05 | Record and rights | RC, RI | RC is the highest exposure in the packet | PHI |
| 06 | Care delivery | PC (missing) | This is what tracers are for | PHI |
| 07 | Leadership and improvement | LD, PI, APR | Low process sampling, high "show me the minutes and the budget" | Mostly administrative. Minutes sometimes contain cases |
| 08 | Place, utilities, emergencies, information | EC, LS, EM, IM | LS and EC are the physical survey. EM is plans. IM is privacy and continuity | Building logs are the cleanest non-PHI set. IM policies are documents; IM compliance proof can be PHI |

---

## 3. Domain 01 — People and competence

**Card, today:** exposure high on HR; compliance **Unscored**. Safest pilot.

### HR — Human resources (8 standards, 44 EPs)

| Subcategory | Standards | EPs | What a surveyor is actually shown |
|---|---|---:|---|
| Staffing coverage | HR.01.01.01 | 2 | The hospital can show it has enough staff for the services it offers |
| Qualifications defined | HR.01.02.01 | 3 | Job requirements exist in writing |
| Qualifications verified | HR.01.02.05 | 13 | License, registration, education, and background checks were done. This is the file-pull |
| How staff may function | HR.01.02.07 | 3 | Who can do what, in writing |
| Orientation | HR.01.04.01 | 7 | Completion, not just a slide deck |
| Ongoing education | HR.01.05.03 | 7 | Training that continues after hire |
| Competence | HR.01.06.01 | 6 | People have been assessed on the work they actually do |
| Performance evaluation | HR.01.07.01 | 3 | Evaluations happen on the hospital's cycle |

24 of 44 EPs are category `C`. 24 are marked `M`. 23 are marked `D`. This chapter is both a document chapter and a sampling chapter. Surveyors spend a dedicated competence-assessment block on it (30–60 minutes in the 2025 guide) after they have already walked tracers and learned which roles they want to test.

**Evidence that is workforce data, not PHI:** license status and expiration, orientation completion, in-service completion, competency checklist result, performance-review date, job description version. **Becomes PHI or peer-review material if** the competency narrative describes a named patient, or the file is a physician case review. Keep those fields out of the first feed.

**Systems:** SnapSkill is confirmed for learning activity (MLKCH staff sign in with hospital credentials). Dossier is the competency system MLKCH uses; the vendor contract is not in this source set. See the system document before treating that vendor as signed. The HR system of record for hire date and job code is Open.

### NR — Nursing (5 standards, 30 EPs)

All 30 EPs are category `A`. This chapter is the nurse executive's authority, qualifications, and the staffing plan as a leadership artifact. It is not a bedside competency chapter.

| Subcategory | Standards | EPs |
|---|---|---:|
| Nurse executive role | NR.01.01.01 | 5 |
| Nurse executive qualifications | NR.01.02.01 | 7 |
| Direction of nursing services | NR.02.01.01 | 6 |
| Guidelines for nursing care | NR.02.02.01 | 5 |
| Policies and the nurse staffing plan | NR.02.03.01 | 7 |

Nine EPs carry a Title 22 flag. California nurse staffing ratios live in state law, not in this short chapter. A score that only rolls up NR will look calm on a day when the staffing ratio board is the thing a state surveyor photographs. The ratio evidence is a staffing/scheduling feed (Open which product) plus the written plan in NR.02.03.01.

Data class: the plan, the job description, and the executive's credentials are workforce/administrative. A live staffing grid can be built without patient names (counts by unit and hour). A grid that lists patients is PHI.

### MS — Medical staff (not in the folder)

The index lists MS with no `x`. The 2025 survey guide still schedules **60 minutes** for credentialing and privileging, and the morning document list asks for bylaws, rules and regulations, and medical executive committee minutes.

Public CMS requirement, summarized rather than copied: 42 CFR 482.22 requires an organized medical staff operating under bylaws and accountable to the governing body, including periodic appraisal of members. Confidence: Confirmed that the CoP exists and that the workbook is absent. EP counts for the 2015 MS chapter were **not** reconstructed number-by-number, because that would mean retyping the accreditation manual.

Subcategories to hold open until a real MS extract exists:

- Bylaws and rules
- Appointment and reappointment
- Privileges matched to current competence
- Ongoing and focused professional practice evaluation
- Temporary and disaster privileges (disaster privileges also appear in EM.02.02.13)

Data class: **not the same as employee HR.** Many licensed independent practitioners are not hospital employees, so the HIPAA employment-record exclusion does not apply to them as a class. Peer-review material and NPDB reports have their own limits. See the security document. Do not pilot the graph here.

---

## 4. Domain 02 — Medication system

**MM, 20 standards, 136 EPs. Exposure 34. Compliance Unscored.** Data class: policies can be stored as documents; almost every process EP is PHI.

| Subcategory | Standards | EPs | Evidence shape |
|---|---|---:|---|
| Planning and access to patient information | MM.01.01.01 | 2 | Policy plus proof the data is actually available to the person giving the drug |
| High-alert and hazardous medications | MM.01.01.03 | 4 | A hospital-specific list, not only the ISMP or NIOSH list the standard points at |
| Look-alike / sound-alike | MM.01.02.01 | 3 | The list and the storage or labeling practice |
| Selection and procurement | MM.02.01.01 | 15 | Formulary, shortages, substitutions |
| Storage | MM.03.01.01 | 12 | Security, temperature, expiration. Temperature logs are a classic spreadsheet |
| Emergency medications | MM.03.01.03 | 4 | Crash cart checks |
| Medications brought in by patients | MM.03.01.05 | 3 | A process, then chart evidence |
| Orders | MM.04.01.01 | 13 | Complete orders in the EHR |
| Pharmacist review | MM.05.01.01 | 10 | Review before dispense, with the after-hours exception defined |
| Preparation | MM.05.01.07 | 6 | Sterile compounding evidence if they compound. The 2025 document list asks for engineering-control reports |
| Labeling | MM.05.01.09 | 12 | Labels on and off the sterile field. Related NPSG.03.04.01 |
| Dispensing | MM.05.01.11 | 4 | Cabinet or pharmacy transactions |
| Pharmacy closed | MM.05.01.13 | 7 | After-hours access process. Often a log |
| Recalls | MM.05.01.17 | 4 | A retrieval record with dates |
| Returns | MM.05.01.19 | 4 | Disposition records |
| Administration | MM.06.01.01 | 9 | The five-rights process in the chart and at the bedside. Tracer bait |
| Self-administration | MM.06.01.03 | 7 | Patient-specific |
| Investigational drugs | MM.06.01.05 | 4 | May be rare at this hospital. If unused, the EP can be not-applicable rather than a gap. Open |
| Adverse drug events | MM.07.01.03 | 5 | Event reports. Mixed PHI |
| System evaluation | MM.08.01.01 | 8 | Leadership review of the medication system |

53 EPs are category `C`. 54 are marked `M`. A medication score that is only "we have a policy" will sit at 2 on the rubric for the structural EPs and at 0 for the administration sample.

First feed that avoids PHI: the high-alert list, the look-alike list, the formulary policy version, and staff competency for medication administration (that competency is Domain 01). Second feed, after a BAA: order completeness, pharmacist-review timestamps, and barcode-administration rates as **aggregates**. Row-level chart access stays behind a drill-down role.

---

## 5. Domain 03 — Patient safety practices

**NPSG and Universal Protocol, 16 standards, 85 EPs. Exposure 28.** The CMS column is empty in this workbook. That does not mean Medicare ignores the topics; infection and medication NPSGs overlap CMS infection-control and pharmacy expectations scored in other chapters. It does mean this sheet is a poor CMS crosswalk.

The narrative cell for `UP.01.01.01` in the workbook is the literal text `MORE TEXT HIDDEN IN ROW`. The neighboring standards are site marking and the time-out, so this standard is the Universal Protocol preprocedure verification. The hidden text is a gap in the file, not a research finding. Confidence: Confirmed that the cell says that; the standard's usual subject is Inference from the rest of the Universal Protocol block.

| Subcategory | Standards | EPs |
|---|---|---:|
| Two patient identifiers | NPSG.01.01.01 | 2 |
| Transfusion identification | NPSG.01.03.01 | 3 |
| Critical results | NPSG.02.03.01 | 3 |
| Labeling in procedural areas | NPSG.03.04.01 | 8 |
| Anticoagulation | NPSG.03.05.01 | 8 |
| Medication reconciliation | NPSG.03.06.01 | 5 |
| Clinical alarms | NPSG.06.01.01 | 4 |
| Hand hygiene | NPSG.07.01.01 | 3 |
| Multidrug-resistant organisms | NPSG.07.03.01 | 9 |
| Central-line infection | NPSG.07.04.01 | 13 |
| Surgical-site infection | NPSG.07.05.01 | 8 |
| Catheter-associated urinary tract infection | NPSG.07.06.01 | 3 |
| Suicide risk | NPSG.15.01.01 | 3 |
| Preprocedure verification | UP.01.01.01 | 3 |
| Site marking | UP.01.02.01 | 5 |
| Time-out | UP.01.03.01 | 5 |

39 EPs are category `C`. Hand hygiene and time-outs are often scored by observation, not by an EHR query. A graph can store observation audits (date, unit, rate) without storing patient names. Suicide-risk screening rates can be aggregated; the screen itself is highly sensitive PHI and should not be in the default CEO view.

These goal numbers are the **2015** set. Later manuals retired or moved some goals. A second hospital on the current manual needs a crosswalk before these IDs are shown as "current NPSGs."

---

## 6. Domain 04 — Infection, waived testing, tissue

### IC — 11 standards, 64 EPs, exposure 25

| Subcategory | Standards | EPs |
|---|---|---:|
| Who is responsible | IC.01.01.01 | 4 |
| Resources | IC.01.01.02 | 3 |
| Risk identification | IC.01.03.01 | 5 |
| Goals | IC.01.04.01 | 5 |
| The plan | IC.01.05.01 | 7 |
| Influx of infectious patients | IC.01.06.01 | 6 |
| Implementation | IC.02.01.01 | 10 |
| Devices and supplies | IC.02.02.01 | 5 |
| Transmission among patients and staff | IC.02.03.01 | 4 |
| Influenza vaccination offer | IC.02.04.01 | 9 |
| Evaluation | IC.03.01.01 | 6 |

The morning list asks for the annual risk assessment and 12 months of surveillance. Surveillance line lists are PHI. Vaccination **offer rates** for staff can be workforce data if they are counts. An employee's own immunization record, if it lives in employee health as a medical record of the employee-as-patient, is a different store from the HR file and should not be scraped casually. See the security document.

### WT — 5 standards, 26 EPs, exposure 34

| Subcategory | Standards | EPs |
|---|---|---:|
| Policies and the CLIA certificate holder | WT.01.01.01, WT.02.01.01 | 10 |
| Competence of people who perform the tests | WT.03.01.01 | 6 |
| Quality control | WT.04.01.01 | 5 |
| Records | WT.05.01.01 | 5 |

CLIA certificates are item 2 on the survey morning list. QC logs for glucometers and similar devices are a known spreadsheet/paper habit in many hospitals (Pattern). Competence for the same people overlaps HR and Dossier.

### TS — 5 standards, 37 EPs, exposure 18

| Subcategory | Standards | EPs |
|---|---|---:|
| Agreements and the tissue program (narrative cell blank on TS.01.01.01) | TS.01.01.01 | 12 |
| Organ transplantation responsibilities | TS.02.01.01 | 2 |
| Tissue procedures | TS.03.01.01 | 11 |
| Bidirectional traceability | TS.03.02.01 | 7 |
| Adverse events and donor infection | TS.03.03.01 | 5 |

`TS.02` does not mean MLKCH is a transplant center. For a community hospital this block is usually the organ-procurement agreement and the duties when a death might be a donor. The morning list asks for the OPO agreement and the tissue agreement by name. Whether they implant tissue (orthopedics, burns, wound care) is Open, and it changes whether TS.03 is a live process or a short policy. Traceability logs, if they implant, are PHI.

---

## 7. Domain 05 — Record and rights

### RC — 10 standards, 53 EPs, exposure 60 (highest)

| Subcategory | Standards | EPs | Note |
|---|---|---:|---|
| Complete record defined | RC.01.01.01 | 11 | Narrative cell on the standard row was empty; EPs parsed |
| Authentication | RC.01.02.01 | 5 | Signatures and timing in the EHR |
| Timeliness | RC.01.03.01 | 4 | Delinquency rates are a classic HIM metric |
| Medical-record audits | RC.01.04.01 | 3 | The hospital already requires itself to sample charts |
| Retention | RC.01.05.01 | 2 | A policy plus a system setting |
| Content of the record | RC.02.01.01 | 5 | Tracer |
| Operative and sedation documentation | RC.02.01.03 | 11 | Tracer |
| Ambulatory summary list | RC.02.01.07 | 4 | Matters more if outpatient volume is in scope |
| Verbal orders | RC.02.03.07 | 5 | Authentication clocks |
| Discharge information | RC.02.04.01 | 3 | Overlaps CMS discharge obligations even though the CMS cite quality in the sheet was not rechecked |

40 of 53 EPs are category `C`. 35 are marked `M`. This is the chapter where "show me eight charts" is the audit. It is also the chapter that should not be ingested as full text into a chatbot. The useful score is a rate: percent of sampled records complete, percent of verbal orders authenticated on time, delinquency over 30 days. The chart stays in Oracle Health.

### RI — 19 standards, 116 EPs, exposure 39

Large blocks are conditional. Several standards apply only if the hospital elected the Primary Care Medical Home option, or has swing beds, or has a long-term psychiatric service. Scoring them as gaps without an applicability flag will punish the hospital for services it may not have. Open: which of those options MLKCH actually operates. The 2015 bed mix (med/surg, ICU, obstetrics, emergency) does not include swing beds or a psychiatric hospital. A medical office building was added later. Applicability still needs a human yes/no per standard, not a guess from the 2015 bed list.

| Subcategory | Standards | EPs |
|---|---|---:|
| Respect for rights | RI.01.01.01 | 11 |
| Information the patient can understand | RI.01.01.03 | 3 |
| Informed consent | RI.01.02.01 (narrative blank), RI.01.03.01 | 22 |
| Recordings and images | RI.01.03.03 | 8 |
| Research | RI.01.03.05 | 8 |
| Who is providing care | RI.01.04.01 | 2 |
| Primary care medical home information | RI.01.04.03 | 6 |
| End-of-life decisions | RI.01.05.01 | 16 |
| Freedom from abuse and neglect | RI.01.06.03 | 3 |
| Dignity and environment | RI.01.06.05 | 9 |
| Swing-bed and longer-term psychiatric rights | RI.01.06.09, .11, RI.01.07.05, .07, .13 | 11 |
| Complaints and grievances | RI.01.07.01 | 9 |
| Advocacy services | RI.01.07.03 | 3 |
| Patient responsibilities | RI.02.01.01 | 2 |

Grievance files are PHI. Consent policy versions are documents. A consent-completeness rate is a chart sample.

---

## 8. Domain 06 — Care delivery (missing workbook)

PC is on the index and not in the folder. This is the largest practical hole in the scorecard, because individual tracers are mostly Provision of Care: assessment, reassessment, plan of care, orders carried out, pain, restraint and seclusion, operative and anesthesia care, and coordination at discharge.

What is already partially covered elsewhere:

- Restraint **policy** is on the 2025 morning document list even without a PC file.
- Patient flow is `LD.04.03.11` (9 EPs).
- Operative **documentation** is `RC.02.01.03`.
- Nursing **leadership** is the NR chapter, not bedside care.

No EP counts are invented here. Until a PC extract exists, Domain 06 should display as **Not in source packet**, not as a high score and not as a zero. A zero would mean "we measured and they failed."

---

## 9. Domain 07 — Leadership and improvement

### LD — 33 standards, 190 EPs, exposure 15

Almost all category `A` (183). The survey test is "does the structure exist and do the minutes show it met." 104 EPs have a CMS cell, so a missing governing-body duty can still be a Medicare problem even though tracers will not "sample" it the way they sample medication administration.

Clusters:

| Subcategory | Standards | EPs |
|---|---|---:|
| Leadership structure and the governing body | LD.01.01.01 through LD.01.07.01 | 33 |
| Mission, conflict of interest, communication among leaders | LD.02.01.01 through LD.02.04.01 | 12 |
| Culture of safety and using data | LD.03.01.01 through LD.03.06.01 | 39 |
| Law, budget, department management, policies, space | LD.04.01.01 through LD.04.01.11 | 28 |
| Ethics, conflicts, denials of payment, patient needs, contracted services, patient flow | LD.04.02.01 through LD.04.03.11 | 44 |
| Performance-improvement priorities, design of new services, patient safety program, guidelines | LD.04.04.01 through LD.04.04.07 | 34 |

`LD.04.01.06` and any Primary Care Medical Home EPs should be applicability-gated, same as in RI.

Contracted services (`LD.04.03.09`, 10 EPs) are a quiet risk: the morning list asks for the list of contracts, and the hospital remains responsible for quality inside the contract. Evidence is the contract file plus some quality report. Usually not PHI if the report is aggregate.

### PI — 5 standards, 41 EPs, exposure 14

| Subcategory | Standards | EPs |
|---|---|---:|
| Data collection | PI.01.01.01 | 16 |
| Analysis | PI.02.01.01 | 10 |
| ORYX accountability measures | PI.02.01.03 | 1 |
| Improvement | PI.03.01.01 | 4 |
| Staffing-effectiveness indicators | PI.04.01.01 | 10 |

The 2025 morning list asks for 12 months of PI data, project documentation, an analysis of a high-risk process, and ORYX or Accelerate PI dashboard reports. This is a dashboard domain. The trap is that the underlying patient-level events are PHI even when the slide shown to the board is a rate.

### APR — 14 standards, 33 EPs, exposure 6

All category `A`. This is the relationship with Joint Commission itself: timely application updates, honesty, public notice of how to file a complaint, no use of Joint Commission staff as consultants, ORYX measure-set selection (`APR.04.01.01`, 10 EPs), and no immediate threat to life (`APR.09.04.01`).

Useful as a checklist for the accreditation lead. A poor APR score is rarely what closes a hospital; an immediate-threat finding is. Don't let the low exposure number hide `APR.09.04.01`.

---

## 10. Domain 08 — Place, utilities, emergencies, information

### LS — 18 standards, 195 EPs, exposure 51

The chapter is split. `LS.02.*` is the health care occupancy chapter. `LS.03.*` repeats the same themes (egress, fire alarm, extinguishment) for the other occupancy chapters in the Life Safety Code. Both are in the file. A score should not average them as if every EP applied to every room. Applicability is by building area. That mapping is Open (which suites are which occupancy).

| Theme (appears under both LS.02 and LS.03) | What fails on the walk |
|---|---|
| LS.01.01.01, LS.01.02.01 | Life Safety Code compliance and interim life safety measures during construction |
| .01.10 | Fire and smoke barriers |
| .01.20 | Means of egress (largest single standard: 32 EPs in LS.02.01.20) |
| .01.30 | Fire and smoke protection features |
| .01.34 | Fire alarm |
| .01.35 | Extinguishing systems |
| .01.40 | Special features |
| .01.50 | Building services (HVAC, smoke control) |
| .01.70 | Operating features (storage in corridors is the usual example) |

137 EPs are category `C`. Documentation flags are rare (5). CMS cells are on 180 EPs. The life safety surveyor is in the building 2–5 hours a day. Evidence is inspection records, drawings, and what is visible in the corridor. Data class: facility. The sensitive part is not PHI; it is that vendor inspection PDFs are scattered.

### EC — 20 standards, 148 EPs, exposure 46

| Subcategory | Standards | EPs |
|---|---|---:|
| Plans and leaders for the environment | EC.01.01.01 | 8 |
| Safety and security | EC.02.01.01 | 8 |
| Smoking | EC.02.01.03 | 3 |
| Hazardous materials and waste | EC.02.02.01 | 13 |
| Fire response and drills | EC.02.03.01, EC.02.03.03 | 10 |
| Fire safety equipment maintenance | EC.02.03.05 | 21 |
| Medical equipment inventory and maintenance | EC.02.04.01, EC.02.04.03 | 16 |
| Utilities | EC.02.05.01, .03, .05 | 25 |
| Emergency power | EC.02.05.07 | 10 |
| Medical gas and vacuum | EC.02.05.09 | 3 |
| Safe functional space | EC.02.06.01 | 6 |
| Construction risk (workbook code is `EC02.06.05`, missing a dot) | EC02.06.05 | 3 |
| Staff know their environment-of-care roles | EC.03.01.01 | 3 |
| Monitoring, analysis, improvement | EC.04.01.01, .03, .05 | 19 |

66 EPs are `D`. This is the binder chapter. Medical-equipment maintenance can include device identifiers without patient names. Incident reports inside "safety and security" can name patients or staff; those rows should be classified mixed, not dumped in with generator tests.

### EM — 12 standards, 112 EPs, exposure 12

Almost all category `A` (104 of 112). The 2025 guide's emergency packet is a document set: hazard vulnerability analysis, emergency operations plan, communications, continuity, training, exercises, after-action evaluation. The workbook's own standards match that shape (EM.01 planning, EM.02 the plan and its six management areas, EM.02.02.13 and .15 disaster privileges for volunteers, EM.03 evaluation). Note the workbook file is named "Emergency Medicine"; the standards are **Emergency Management**. `EM.02.02.15` carries a note in the code cell from someone named Tracy questioning why it repeats the prior standard. That is an internal comment baked into the standard-code cell. Confidence: Confirmed as text in the file; it is not a Joint Commission annotation.

Data class: plans and exercise rosters are administrative. A patient-tracking annex used in a real emergency would be PHI. The plan PDF is not.

### IM — 8 standards, 33 EPs, exposure 22

| Subcategory | Standards | EPs | Note |
|---|---|---:|---|
| Planning for information | IM.01.01.01 | 4 | Title on the standard row was blank in the parse because this file stores the narrative in the EP column without a separate ESP column. The peek of the sheet shows the standard text beginning "The hospital plans for managing information." |
| Continuity | IM.01.01.03 | 6 | Downtime procedures. Very relevant to a hosted EHR |
| Privacy | IM.02.01.01 | 5 | HIPAA-shaped obligations written as accreditation EPs |
| Security and integrity | IM.02.01.03 | 8 | Access control, audit, integrity |
| Collection | IM.02.02.01 | 3 | |
| Retrieval and transmission | IM.02.02.03 | 4 | |
| Knowledge resources | IM.03.01.01 | 2 | Drug references and similar must be current |
| Accurate health information | IM.04.01.01 | 1 | |

This chapter describes the duties a product also has to meet if it stores health information: privacy, integrity, continuity, retrieval. It is a design input to [05-Data-Sensitivity-and-Security.md](05-Data-Sensitivity-and-Security.md), not only a scorecard row.

---

## 11. What "good" looks like on a card

The card keeps both numbers visible so exposure is not confused with compliance.

```
01  People and competence                          2 sub-areas in pilot
    Competence of staff                 — / 5   UNSCORED     exposure 51   P1
    Evidence not ingested. Category C: 24 of 44 HR EPs.
    Data class: workforce. Systems: SnapSkill (confirmed), Dossier (named, unconfirmed).

    Nurse executive structure           — / 5   UNSCORED     exposure 6
    All 30 EPs are structural. Does not measure bedside practice.
```

A later card, after a feed exists, can use Partially ready or Material gap. Until then, the honest status is Unscored. The number that can be defended is exposure, plus data class, plus whether a system is known.
