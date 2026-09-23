# Access required for a live score

The category map has 20 readiness areas. They do not need 20 systems. Most of them collapse onto six sources. A willing hospital and a sponsor in the CTO's office remove the political barrier. They do not remove Oracle's tenant process or the HIPAA agreement, and those two are the long pole only for the chart.

Data classes are shorthand from [05-Data-Sensitivity-and-Security.md](05-Data-Sensitivity-and-Security.md): **W** workforce, **F** facility and documents, **P** patient information.

---

## The six sources

| Source | Readiness areas it can feed | Known at MLKCH? | Patient data? |
|---|---|---|---|
| 1. SnapSkill (learning system) | Staff training and orientation. Pieces of nursing education, infection education, environment-of-care role training | Yes. Staff already sign in with MLK credentials | No, if courses do not contain patient cases |
| 2. Dossier, or a competency export | Staff competence, waived-testing competence, medication-administration competence | MLKCH uses a system called Dossier. Public match is the competency product at dossier.com. Contract not in this source set | No, if the checkoff is skill and date, not a patient story |
| 3. One document and log register | Policies and plans for every area. Life safety and environment-of-care inspection records. Emergency plans. Leadership minutes. Consent and grievance **policies**. Contract list | System not named. Much of this evidence is still spreadsheets. Likely a file share plus Excel | The policy PDF is not patient data. A grievance file or an incident narrative is |
| 4. HR system | License verification dates, job requirements, performance evaluations, hire and job code | Not named | Workforce, not the chart |
| 5. Oracle Health (Cerner) | Medication use, safety-goal documentation, the medical record, consent images, infection documentation in the chart, care delivery once that chapter exists | Yes. Full Cerner, live since 2015, vendor-hosted as of 2016 | Yes |
| 6. A rates file from their own reporting team | The same chart areas, but as monthly percentages instead of rows | The 2016 build included Cerner reporting (PowerInsight). Whether anyone still runs it is not confirmed | Only if the file still has names. A unit-month rate does not have to |

Medical staff credentialing is a seventh source, later. It is a different legal problem (peer review and NPDB), and the workbook is not even in the folder. Do not block the first scorecard on it.

These are not six integrations on day one. Sources 1 and 3 cover a real scorecard. Source 5 is the one that needs the heavy agreement.

---

## How feasible, if they want the project

Assumption: the CEO, CTO, and head of nursing will sponsor access. Feasibility below is the vendor and the paperwork, not the relationship.

| Source | What "access" actually means | Calendar if the hospital is helpful | What has to be in place |
|---|---|---|---|
| SnapSkill | The completion data already sits in SnapSkill. The work is an export: person, course, completed-at, expiration | Days, on the learning system's own side | Keep it workforce-only. A confidentiality commitment. SOC 2 if the hospital asks vendors for it. A business associate agreement is the wrong tool unless patient cases are in the courses |
| Document and log drop | The hospital points at the survey binder, or drops the spreadsheets and PDFs on a schedule. Those files are indexed against the standard codes on the category map | A few weeks to name the shares and the owners. The index itself is a small database | Confidentiality. No business associate agreement if someone strips patient names out of minutes and incident logs before the drop. That strip is the real task |
| Dossier | The hospital asks the vendor for a scheduled CSV: person, skill, result, assessor, expiration. No public API was found, so an API call should not be assumed | Weeks if the vendor already gives customers an export. Longer if they refuse and SnapSkill has to hold competency instead | Same as SnapSkill, workforce-only |
| HR system | A report of credentials and evaluation dates. Payroll is not required | Weeks once the system is named. Many HR products only offer a file, not an API. A file is enough | Workforce confidentiality. Not HIPAA |
| Rates from Oracle Health, built by hospital analysts | The hospital schedules a report it already knows how to run. The file that comes back is numbers | One to two months, mostly the reporting backlog, not a new interface | Written confirmation the file has no names, or a business associate agreement if it does |
| Oracle Health API (FHIR) | The hospital's tenant approves an application. The application queries. There is no SQL login. The 2016 system was in Cerner's data center, not in the hospital basement | Several months. The relationship supplies an internal sponsor. Oracle still has to enable the app, and the hospital's security review still happens | Business associate agreement. HIPAA Security Rule safeguards (access control, audit, encryption, risk analysis). SOC 2 Type II is what a hospital security review expects to see before PHI lands in a vendor database. HITRUST is a common extra ask at large systems. Nothing found says MLKCH requires it. Confirm once with the CTO. It does not replace the business associate agreement |

Life safety and environment of care do not need a new facilities product to become visible. They need the document drop (source 3) plus due dates. Replacing a fire-alarm vendor or the EHR is out of scope and unnecessary.

---

## What has to be in place before each kind of data

| If the product stores | Required | Not required |
|---|---|---|
| Training completions, competency dates, license expirations | Access control, encryption in transit, a confidentiality term, and ideally SOC 2 so their review is short | A business associate agreement, HITRUST, or access to Cerner |
| Policy PDFs, fire-drill logs, generator tests, emergency plans | Same as above | A business associate agreement, as long as patient and peer-review narratives are not in the files |
| Chart rows, medication administrations, infection line lists, grievance files, suicide-risk screens | Business associate agreement, HIPAA security safeguards, minimum necessary (store the rate and a pointer, not the note), SOC 2 Type II before go-live | A government security clearance. This is not a classified environment |
| Medical staff case review or NPDB reports | Do not store these in version one | — |

SOC 2 is an audit report about the company that hosts the data (controls operated over a period, usually security plus confidentiality). Hospitals ask for it when a vendor hosts their data, including employee data. It is not a license to receive patient information. The business associate agreement is that license, and only for patient information.

Practical order: SOC 2 is on the critical path for Cerner and also makes the workforce pilot an easier yes. The category map and an internal SnapSkill export do not have to wait for SOC 2. Any identified patient record copied into the product does have to wait for the agreement.

---

## What the first scored cards can be

Without Cerner, and without a business associate agreement, a willing hospital can still fill scores for:

- Staff qualifications and competence, from SnapSkill plus a Dossier or HR export
- Nursing leadership, from the staffing-plan document and the nurse executive's credentials
- Medication **control** policies and the high-alert list, from the document drop. Medication **use** stays blank until the chart or a rates file exists
- Infection **program** documents and the risk assessment. Surveillance rates stay blank
- Life safety, environment of care, and emergency management, from the document drop
- Leadership minutes, performance-improvement packets, and information-management policies, from the same drop

The cards that stay "not assessed" until Cerner or a rates file exists are medication use, the safety-goal practices, the medical record, patient-level rights (consents, grievances), and care delivery.

That split is the overlap that matters. One learning system, one competency export, and one document drop cover the non-chart half of the map. One EHR covers the chart half. A different vendor is not required for each readiness area.
