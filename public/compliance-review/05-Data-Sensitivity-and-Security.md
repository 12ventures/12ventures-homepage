# Data sensitivity and what has to be in place before data is stored

This document is the security gate on each kind of data: what is employee administration, what is patient information, and which is safer to handle. It is not a legal opinion. A healthcare privacy lawyer should review the first real data-use agreement. The classifications below are tied to published rules so that review has a starting point.

"Clearance" in this project means **permission and controls to receive a data class**. It does not mean a federal security clearance. Nothing found in public sources about MLKCH suggests classified systems, CMMC, or a Department of Defense environment.

---

## 1. The four classes

| Class | Plain meaning | Typical examples in this scorecard | HIPAA PHI? | What has to be in place before storing it |
|---|---|---|---|---|
| **W — Workforce** | Records the hospital keeps as an employer about its own staff | License dates, job title, orientation completion, in-service completion, competency result that does not describe a patient, evaluation date | No, if they stay employment records. 45 CFR 160.103 excludes employment records held by a covered entity in its role as employer. HHS states the same thing in its employer guidance | A confidentiality commitment and access control. SOC 2 is a commercial expectation if a vendor hosts it. A HIPAA business associate agreement is **not** the right instrument for pure employment records, and signing one "just in case" can blur the boundary |
| **F — Facility and operations** | The building and the program, not a person | Fire-drill matrix, generator tests, fire-alarm inspection, life-safety drawings, hazard vulnerability analysis, policy version, committee attendance | No | Same as W, often easier. Vendor PDFs may be copyrighted or contract-confidential |
| **M — Mixed** | A workflow that is safe in aggregate and unsafe at row level | Infection rates vs. a line list; grievance counts vs. the grievance file; safety-event rates vs. the event narrative; staffing counts vs. a board that names patients | The row is often PHI. The rate often is not, if it cannot be re-identified | Build the feed as the rate. Keep the row behind a second gate |
| **P — Patient** | Individually identifiable health information the hospital holds as a provider | The chart, medication administration, orders, lab results, operative notes, suicide-risk screens, tissue implant records tied to a patient | Yes. HIPAA Privacy, Security, and Breach Notification Rules | Business associate agreement (45 CFR 164.502(e) and 164.504(e)), minimum necessary, access logs, encryption, a security risk analysis, and a way to handle breach notice. SOC 2 Type II is what a hospital security review will also ask for. It does not replace the BAA |

Two extra locks sit on top of P and sometimes on M:

| Lock | Where it shows up | Why it is tighter than ordinary PHI |
|---|---|---|
| **Peer review** | Medical staff credentialing, case review inside OPPE/FPPE, some quality minutes | California Evidence Code section 1157 restricts discovery of certain peer-review records. Putting them in a general chatbot is a redisclosure problem even for the CEO |
| **NPDB** | Reports inside a credentialing file | The National Practitioner Data Bank has its own federal limits on redisclosure (45 CFR Part 60). Do not copy NPDB reports into the graph |
| **Employee as patient** | Occupational health, a staff member's own ED visit, a drug test kept as a medical record | The employment-record exclusion covers the HR file. It does not cover the staff member's chart in the EHR. HHS is explicit that the medical record is still protected if they are a patient |
| **Sensitive clinical categories** | Suicide risk (NPSG.15), behavioral health notes, substance-use treatment records | Substance-use disorder treatment records can fall under 42 CFR Part 2, which is stricter than HIPAA. Whether MLKCH operates a Part 2 program is Open. Suicide-risk detail should not be in the default executive view even when a BAA exists |

California's Confidentiality of Medical Information Act (Civil Code section 56 and following) sits beside HIPAA for medical information. It is another reason class P is not "HIPAA paperwork only." Workforce data can still be personal information under the California Consumer Privacy Act as amended by CPRA. The statutory employee-data exemption expired on 1 January 2023, so employee data is not a free zone under state privacy law. Confidence: the HIPAA employment-record exclusion is Confirmed from the current eCFR text and HHS guidance. The CPRA employee-exemption date is a widely stated legal fact; have counsel confirm it against the statute that will govern the work rather than treating this paragraph as the last word. The peer-review and NPDB points are Confirmed as the existence of those regimes; the exact boundary of section 1157 in a software context is a lawyer's question.

---

## 2. Class by scorecard domain

This is the table to use when someone asks "can we connect that next."

| Domain | First feed class | Do not include in the first feed | Gate |
|---|---|---|---|
| 01 HR competence, orientation, license dates | **W** | Competency narratives that quote a patient; employee-health charts; disciplinary medical detail | The existing SnapSkill single sign-on. Contract as a vendor of an education system, not as a business associate, **only if** the data stays in class W. If a course completion record includes a patient case, it flips to P |
| 01 Nurse executive structure and staffing plan | **W** or **F** | A staffing board that names patients | Counts by unit are W/F |
| 01 Medical staff | **Not in the pilot** | Bylaws can be F. The credential file is peer review / NPDB | Separate project, separate permission |
| 02 Medication policies, high-alert list, staff med competence | **F** and **W** | Orders, administrations, pharmacist review of a named patient | BAA before any administration record |
| 02 Medication process rates | **M** | The chart behind the rate | BAA if the rate is produced inside the product from identified records. If the hospital's EHR team hands over a de-identified rate, the gate is lighter and must be documented |
| 03 Safety-goal observation rates (hand hygiene, time-out) | **M**, often reducible to **F** | Patient identifiers on the audit sheet | Design the audit tool so the unit and the pass/fail are stored and the patient sticker is not |
| 03 Suicide risk, transfusion, critical results | **P** | | BAA, and a tighter role than general quality |
| 04 Infection plan and risk assessment | **F** | Surveillance line list | |
| 04 Staff influenza-offer rate | **W** if it is a count of offers | The employee's immunization record from employee health | Keep employee health out of SnapSkill |
| 04 Waived-test competence | **W** | QC results tied to a patient account | |
| 04 Tissue traceability | **P** if they implant | The OPO agreement itself is **F** | |
| 05 Record of care rates | **M** / **P** | Full note text | This is the last clinical domain to connect, not the first. Exposure is high and so is sensitivity |
| 05 Consent and grievance policy versions | **F** | The grievance file, the signed consent image | |
| 06 Provision of care | **P** | | Missing workbook, and PHI. Not a pilot |
| 07 Leadership minutes, budget, org chart, contract list | **F** | Any minute that discusses a named patient or a peer-review case | Someone has to redact or the minutes stay out |
| 07 PI dashboards | **M** | Patient-level event rows | Prefer to ingest the dashboard number plus the definition of the measure |
| 08 Life safety, utilities, fire, medical-equipment PM | **F** | Safety incident reports that name a person | Best second pilot after workforce |
| 08 Emergency plans and exercise records | **F** | A real-event patient tracking log | |
| 08 Information-management policies | **F** | Access-audit logs that show which patient record was opened | Those logs are a security tool and also PHI-adjacent; they are for the privacy officer, not the CEO chatbot |

---

## 3. What "SOC 2" and "HIPAA" each do

They are not interchangeable.

| Instrument | What it is | When this project needs it |
|---|---|---|
| HIPAA business associate agreement | A required contract when a vendor creates, receives, maintains, or transmits PHI for a covered entity. 45 CFR 164.502(e), 164.504(e) | Class P, and any class M feed that holds identified records. Not the tool for pure class W |
| HIPAA Security Rule | Administrative, physical, and technical safeguards for electronic PHI (45 CFR 164.308, 164.310, 164.312) | As soon as a BAA is signed. Risk analysis, unique user IDs, audit controls, transmission security |
| HIPAA Privacy Rule minimum necessary | Use and disclose only what the purpose needs (45 CFR 164.502(b)), with exceptions for treatment | Design default: store rates and evidence pointers. Retrieve a chart only for a named quality or survey role, for a named purpose, with a log |
| SOC 2 Type II | An AICPA attestation that a service organization's controls operated over a period. Trust Services Criteria, commonly security, plus availability, confidentiality, or privacy | Hospitals will ask once a vendor hosts their data, including workforce data. It is the security review artifact. It is not a statutory substitute for a BAA |
| HITRUST | A certification framework many health systems recognize, heavier than SOC 2 | Not required by HIPAA. Pattern: large systems ask; a 131-bed independent hospital may accept SOC 2 plus a BAA. Open what MLKCH's security team requires |
| Business associate vs. conduit | A conduit that only transmits information and does not store it has a narrower HIPAA position. A knowledge graph that stores evidence is not a conduit | Treat the product as a business associate the day class P lands in its database |

The current relationship is narrower than either of these. MLKCH staff authenticate into SnapSkill with MLK credentials. That is an identity assertion (name, email, employee identifier). That is class W. There is no path from that product into the EHR. Confidence: Confirmed from the described single sign-on. The legal paper around SnapSkill (whether a BAA already exists) is Open and should be read before anyone extends SnapSkill to store clinical cases.

---

## 4. Practical design rules that keep the first phase safer

1. **Separate stores.** Workforce graph and patient-derived graph should not be one bucket with a flag. A query bug should not be able to attach a chart to a competency record.
2. **Aggregates by default.** CEO and CTO views use rates, dates, and document versions. Patient-level drill-down is a different role (quality director, HIM, accreditation), time-boxed, and logged.
3. **Evidence pointer, not evidence copy.** For class P, store "Oracle Health encounter reference, measure, pass/fail, timestamp," and open the chart in the hospital's system under a hospital login when a human needs it. Copying note text into the graph multiplies breach scope.
4. **Applicability before scoring.** Swing-bed and medical-home EPs that do not apply should be `Not applicable`, not `Material gap`. Same for investigational drugs if they do not run trials.
5. **No NPDB, no peer-review narrative, no employee-health chart** in version one, even if a vendor offers an export that includes them.
6. **On-prem vs hosted does not decide the class.** Cerner's Kansas City hosting (2016) means the EHR is not in the hospital basement. PHI is still PHI there. A spreadsheet of fire drills on a share drive is class F even if the share drive is on-prem and awkward to reach.
7. **Role answers follow the class.** Personalization by role (CEO, CTO, CNO) is also an access policy. The CEO does not get a richer clinical answer by default. The CEO gets a better summary of the same aggregates. Detail that is class P stays with the role that has the job of looking at it.

---

## 5. Order of operations

| Step | Data class | Agreement | What becomes visible |
|---|---|---|---|
| 0 (today) | W, identity only | Whatever already covers SnapSkill SSO | Training activity already held in SnapSkill. Not a compliance score |
| 1 | W + F documents they choose to export | Confidentiality, no BAA if the export is clean | HR / competency / life-safety document score for the EPs whose evidence is in those files |
| 2 | M aggregates computed inside the hospital and sent as numbers | Written confirmation the file is de-identified or limited, plus security review | Medication, infection, and record-of-care **rates** |
| 3 | P, pointers and selected resources via Oracle Health | BAA, tenant app approval, SOC 2 in hand | Drill-down for accreditation and quality, not for a general chatbot |

Step 1 is enough to demonstrate the product on a real, high-exposure chapter (HR exposure 51, life safety exposure 51) without taking on chart data. Step 3 is what makes record of care (exposure 60) real. Doing step 3 first because the EHR is "where the data is" maximizes both regulatory work and the chance of a bad early story.
