# Sources, method, and open questions

## Method

Every `.xlsx` in `[0] MLKCH - The Joint Commission 2015 Requirements` was parsed with `_parse_tjc.py` (openpyxl, read-only). The parser detects the "Elements of Performance" column because some files (IM, RC, WT, TS) shift that column left by one. An EP row is a cell in that column that starts with a number. Output: `_tjc_inventory.json`.

Counts used throughout the other documents: **16 chapters, 209 standards, 1,343 EPs**. `2015 TJC Check List.xlsx` is the index and is not a chapter. The Gemini `.docx` in the parent folder is a prior summary of the same files. It was read and not used as a source for counts or for system facts.

CMS cells and Title 22 cells were counted, not legally verified one by one. A Medication Management sample row cites `482.26` and `482.53` on a high-alert medication EP. Those sections are not the pharmacy Condition of Participation (`482.25`). That is why the scorecard calls the crosswalk a lead.

Exposure weights (0.45 / 0.25 / 0.20 / 0.10) are a project formula, documented in the scorecard, not a Joint Commission formula.

---

## Primary sources

| Topic | Source | Used for |
|---|---|---|
| Packet structure and all EP counts | The 17 workbooks in this folder, parsed 22 Sep 2026 | Taxonomy, exposure, empty evidence columns |
| MLKCH licensed beds, 2015 opening, Joint Commission accreditation at opening | MLKCH, "MLKCH Achieved Accreditation and Opened to South LA on July 7 2015," https://www.mlkch.org/open-accreditation | Facility context. 131 beds: 93 med/surg, 20 ICU, 18 OB. 21-bed ED in that announcement |
| Volume and safety-net status | MLKCH Community Benefit Report FY2018, https://www.mlkch.org/sites/default/files/2018-12/MLKCH_Community_Benefit_Report_FY18_EN.pdf | About 100,000 ED visits a year in that year's report |
| Later volume | GuideStar profile for Martin Luther King Jr-Los Angeles Healthcare Corporation, EIN 27-4658935, fiscal year ended 30 Jun 2025 figures as published there | 124,457 emergency visits and other FY2025 counts. A filing, not a clinical system extract |
| Cerner big-bang, devices, hosted EHR, vendor strategy | healthsystemcio.com interview with Sajid Ahmed, 6 Dec 2016, https://healthsystemcio.com/2016/12/06/sajid-ahmed-chief-information-innovation-officer-mlk-community-hospital-chapter-2/ | 2015–2016 EHR facts |
| Cerner hosted in Kansas City; full instance rather than a small-hospital edition | HealthLeaders Media, "MLK Jr. Community Hospital Sets Blueprint for Hospital Reboots," https://www.healthleadersmedia.com/innovation/mlk-jr-community-hospital-sets-blueprint-hospital-reboots | 2016 hosting |
| County contract path for Cerner before opening | LA County Board document, https://file.lacounty.gov/SDSInter/bos/supdocs/81240.pdf | EHR contract existed as a three-party agreement and was intended to become MLK-LA and Cerner |
| Opening infrastructure | PLANNET, MLK-LA project page, https://plannet.com/portfolio-items/martin-luther-king-jr-community-hospital/ | Microsoft servers, VMware, EMC; Cerner as the EMR |
| Survey is unannounced; 30–36 month window; tracers; 60-day ESC | The Joint Commission, Accreditation Process, https://www.jointcommission.org/en-us/accreditation/process | Current process, reviewed 22 Sep 2026 |
| Team composition, E-App determines length, Life Safety surveyor on every hospital survey | The Joint Commission, Hospital Accreditation Survey Process Guide (2026 copyright notice on the fetched text), https://digitalassets.jointcommission.org/api/public/content/64731897e3d94ca69e54042c2e27d9c6 | On-site rules |
| Activity durations, morning document list, life safety hours | The Joint Commission, Hospital Accreditation Survey Activity Guide 2025, https://www.jointcommission.org/-/media/tjc/documents/accred-and-cert/survey-process-and-survey-activity-guide/2025/2025-hospital-organization-sag_july25_final.pdf | What the hospital must produce, and the credentialing session that has no workbook here |
| Example of a 3-surveyor, 5-day agenda | Joint Commission digital asset, https://digitalassets.jointcommission.org/api/public/content/96ce011fe99e4f8795170cf8e052426c | An example only. Not MLKCH |
| SAFER matrix | The Joint Commission, "What is the SAFER Matrix?," https://www.jointcommission.org/en-us/knowledge-library/support-center/post-survey-or-review/safer-matrix | How findings are shown now |
| 10 business days to post the report; ESC contents; 45-day note on condition-level examples | The Joint Commission, *The Source*, May 2022, https://digitalassets.jointcommission.org/api/public/content/assets/1/7/ts_20_2022_05.pdf | Post-survey clock |
| LS/EC document tool | The Joint Commission, Hospital Life Safety & Environment of Care Document List and Review Tool, effective 3/1/2024, https://digitalassets.jointcommission.org/api/public/content/29635f929b954b6c93beed7ed2a7816b | Why facilities evidence is a binder |
| 2015-era A/C, MOS, documentation icons; later decision to drop A/C and MOS as customer-facing complexity | HESNI conference slides, "Joint Commission Update," 2016, https://hesni.starchapter.com/images/downloads/2016_Annual_Conference/joint_commission_update.pdf | What the workbook columns meant, and that the survey model changed after this packet was built |
| Medical staff Condition of Participation | 42 CFR 482.22, eCFR | The missing MS chapter's federal backbone. EP text was not copied from the accreditation manual |
| PHI definition and employment-record exclusion | 45 CFR 160.103, https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-160/subpart-A/section-160.103 | Class W is not PHI |
| HHS explanation of employer records vs the employee's chart | HHS, "Employers and Health Information in the Workplace," https://www.hhs.gov/hipaa/for-individuals/employers-health-information-workplace/index.html | Same distinction, plain language. Page reviewed date on HHS: 2 Nov 2020 |
| Business associate contracts | 45 CFR 164.502(e) and 164.504(e) | When a BAA is required |
| NPDB redisclosure regime | 45 CFR Part 60 | Why credentialing files are not a normal export |
| California peer review | California Evidence Code section 1157 | Why medical staff case review is a separate lock. Application to a software product needs counsel |
| Oracle Health FHIR R4 | Oracle, "FHIR R4 APIs for Oracle Health Millennium Platform" and "R4 Overview," https://docs.oracle.com/en/industries/health/millennium-platform-apis/mfrap/r4_overview.html | Query API, staleness of search results, tenant implementation |
| FHIR Subscription gap on the public sandbox | Oracle community forum threads on Subscription and lab Observation, 2025–2026 | Practitioner reports, not a feature promise. Cited only as evidence that real-time FHIR push is not something to assume |
| Dossier product claims | https://dossier.com/our-platform/ and https://dossier.com/who-we-serve/inpatient-departments/ ; 2022 Dossier guides on dossier.com | Cloud competency system, LMS integration, no public API found |
| SnapSkill SSO | Your description, 22 Sep 2026 | The only live integration |

## Secondary sources (used carefully)

| Source | How it was used |
|---|---|
| Taction, "Cerner Oracle Health Integration Guide 2026," https://www.tactionsoft.com/blog/cerner-oracle-health-integration-guide/ | A vendor's view that HL7 v2 remains the practical event feed and FHIR Subscriptions are limited. Not treated as Oracle documentation |
| MCN / Ntracts policy-manager pages | Example of a healthcare policy suite. Not attributed to MLKCH |
| Identum eADM "Dossier" SFTP documentation | Named only to warn that it is a different product. Not used as MLKCH's interface |

## Pattern examples (not MLKCH facts)

These names appear in the system document as the usual products in a category: BD Pyxis, Omnicell, Nuvolo, Accruent, symplr, HealthStream CredentialStream, RLDatix, UKG, Veoci, LiveProcess, PolicyStat, NHSN, Press Ganey. None of them was confirmed from an MLKCH contract, a job posting tied to a purchase, or a statement about this hospital, except the three confirmed rows in the system document (Oracle Health, SnapSkill, and the Microsoft-era infrastructure).

---

## Open questions

Resolving any of these changes a score, a data class, or a build decision. None of them was filled with a guess in the other documents.

| # | Question | Why it matters |
|---|---|---|
| 1 | Date and type of the recent Joint Commission event (full survey, follow-up, or extension) | Sets the 30–36 month window and whether an ESC is still open |
| 2 | Is "Dossier" the dossier.com competency product, and is there an export or API on the MLKCH tenant? | Decides whether Domain 01 is an integration or a SnapSkill extension |
| 3 | Does the existing SnapSkill agreement already include a BAA? | Decides how careful course content must be |
| 4 | Identity provider behind MLK SSO | Reuse for the graph |
| 5 | Where policies, fire-drill logs, temperature logs, and PI spreadsheets actually sit | The evidence-register scope |
| 6 | Dispensing cabinet vendor, biomedical/CMMS vendor, HRIS, scheduling vendor, credentialing vendor | Replaces Pattern rows with Confirmed rows |
| 7 | Do they compound sterile products, implant tissue, run trials, operate swing beds, or hold a Primary Care Medical Home election? | Applicability flags. Scoring these as gaps would be wrong |
| 8 | Is there a moderate- or high-complexity lab beyond waived testing? | The packet has WT only. CLIA certificates are on the morning list either way |
| 9 | 2026 location of the Oracle Health tenant (still vendor-hosted, and in which region) | On-prem vs hosted for the EHR |
| 10 | Who at MLKCH approves a BAA, and do they require HITRUST or SOC 2? | Calendar for class P, not for class W |
| 11 | What the workbook column `CR` was meant to mean (values 1, 2, 3) | Left unused on purpose |
| 12 | Medical Staff and Provision of Care workbooks, if they exist anywhere internally | The two survey-critical gaps |
| 13 | Which ORYX / performance vendor they use now | PI and APR evidence |
| 14 | Whether any Microsoft Purview, SharePoint, or Power BI compliance workspace exists | You did not know. Still open |

---

## What was deliberately not done

- The 2015 EPs were not rewritten into the current Comprehensive Accreditation Manual. A later hospital on the current manual needs a crosswalk. The requirement-intent ids in the graph design are there so that crosswalk has somewhere to land.
- Full EP text was not copied into the narrative documents. The JSON has a 220-character excerpt for traceability. The accreditation manual is Joint Commission's text.
- No compliance score was assigned to MLKCH. The evidence column is empty.
- No brand was assigned to cabinets, CMMS, credentialing, or policy software.
