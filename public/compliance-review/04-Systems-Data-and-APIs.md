# Systems, data, APIs, and what is actually connectable

For each scorecard domain: where the evidence lives, whether MLKCH's system is known, whether that product has an API, how fresh the data is, whether it is on-prem or hosted, and what to do if it cannot feed a graph.

Confidence labels are the same as in the executive summary. Brand names in the **Pattern** rows are examples of the category. They are not a claim that MLKCH has bought them.

Data class (W workforce, F facility, M mixed, P patient) is defined in [05-Data-Sensitivity-and-Security.md](05-Data-Sensitivity-and-Security.md).

---

## 1. What is already known about MLKCH's technology

| Fact | Class | Confidence | Source |
|---|---|---|---|
| Core EHR is Cerner, now Oracle Health, full Millennium instance rather than a small-hospital edition. Big-bang go-live for the 2015 opening. About 58 medical devices interfaced at launch. CPOE, reporting (PowerInsight and related), maternity (PowerChart Maternity), Meaningful Use reporting were part of the build | P for clinical content | Confirmed for 2015–2016. Not reconfirmed module-by-module for 2026 | CIO interview, healthsystemcio.com, 6 Dec 2016; HealthLeaders Media; LA County Board materials on the three-party Cerner contract; a project manager's public description of the opening program |
| In 2016 Cerner hosted that EHR in its Kansas City data center. The hospital did not run the EHR on a large local data center | Hosting | Confirmed for 2016. **Open for 2026.** Oracle has been moving Millennium customers toward Oracle Cloud. No MLKCH-specific 2025/2026 hosting disclosure was found | HealthLeaders Media |
| Enterprise infrastructure at opening was Microsoft Windows servers, directory, VMware, EMC backup, designed by PLANNET with Top Tier Consulting. The campus network is the hospital's. The EHR was the hosted application on top | Hosting of non-EHR apps | Confirmed as the opening design. What still runs that way is Open | PLANNET project description |
| Staff single-sign-on to SnapSkill, a learning system, with MLK credentials. That product has no inbound access to the hospital's other systems | W | Confirmed from the working relationship | — |
| MLKCH uses a system called Dossier | Likely W | Stated by the hospital relationship. dossier.com is a healthcare competency platform that markets Joint Commission / CMS audit readiness and says it integrates with HR, EHR, and LMS products. That is the best public match. It is not proof of the contract | dossier.com |
| Spreadsheets are still used for a lot of operational tracking | F and M | Stated from the working relationship. Consistent with the blank evidence columns in the packet. Not a system inventory | — |
| Microsoft 365, Purview, SharePoint, or Power BI specifically | — | Open. "Microsoft infrastructure" in 2015 does not establish today's compliance stack | Not established |

Identity inference: SSO from "MLK credentials" into an outside learning system usually means an identity provider (often Microsoft Entra ID, formerly Azure AD, or AD FS in front of on-prem Active Directory). Inference from the Microsoft infrastructure plus the SSO fact. The directory product itself has not been confirmed.

---

## 2. Oracle Health (Cerner) Millennium — the clinical system

**Covers:** Domain 02 process EPs, Domain 03 chart-derived EPs, Domain 05, much of Domain 06 when that workbook exists, infection documentation, orders, results, medication administration, verbal orders, operative documentation.

**Does not cover:** life-safety inspections, fire drills, board minutes, license primary-source verification, most competency checkoffs, the hazard vulnerability analysis, policy approval workflow. Connecting only the EHR leaves Domains 01 and 08 largely empty, and those are the safer pilots.

**Where it runs:** vendor-hosted as of 2016 (Kansas City). Not an on-prem database that can be read with a SQL account. Any integration is an interface the vendor and the hospital both have to turn on.

**APIs, from Oracle's own documentation:**

- FHIR R4 on Millennium is documented as the Oracle Health Ignite / Millennium Platform APIs. The capability statement is published at `docs.oracle.com` (FHIR R4 APIs for Oracle Health Millennium Platform). The public metadata example identifies `fhirVersion` 4.0.1 and an implementation "on top of Millennium."
- Security model is OAuth. A production app is registered against **that hospital's tenant**. The public sandbox (`fhir-open.cerner.com` / Oracle's published sandbox) is not MLKCH's data.
- Oracle's R4 overview quotes the FHIR rule that search results are current at the moment of the search and go stale after that. Paging can repeat resource ids. That is a query API, not a live subscription bus.
- Oracle community threads (practitioners asking Oracle, not Oracle's manual) report that the FHIR Subscription resource was not documented on the public sandbox for lab Observation updates. A 2026 integrator write-up (Taction) recommends FHIR R4 for request/response and HL7 v2 through Cerner's Open Interface when the hospital needs event-driven updates, and says FHIR Subscriptions exist only for a limited set of resources. Confidence: the Oracle docs are Confirmed. The forum posts are practitioner reports. The Taction piece is a vendor blog, useful as a second view, not as Oracle policy.

**Limitations that matter for a compliance score:**

- The hospital, or Oracle on the hospital's behalf, must approve the application. Knowing that MLKCH uses Cerner is not enough to connect a client.
- Not every Millennium field is a FHIR resource. Historical compliance evidence (a temperature log, a paper consent from 2015, a committee minute) will not appear.
- Write-back is the wrong goal. This product needs to **read evidence**, not write orders.
- Real-time bedside facts (a medication given 30 seconds ago) are more reliable on the HL7 feed the hospital already uses for devices and ancillary systems than on polling FHIR. For a daily or weekly compliance score, polling or a scheduled bulk export is enough. FHIR Bulk Data exists in the Oracle API family as an asynchronous export; confirm the resources enabled on their tenant before depending on it. Confidence: Bulk Data is part of the published Millennium API set; whether MLKCH's tenant has it enabled is Open.
- A BAA and a security review come before the first identified record. See the security document. Minimum-necessary design is to pull measures and identifiers, not full notes.

**Freshness:** the EHR itself is real-time for orders, results, and administration once clinicians document. The API is as fresh as the last query unless an HL7 feed is added. Documentation lag (a note written at the end of the shift) is a clinical fact, not an API flaw. Record-of-care timeliness EPs are partly about that lag.

**If this path is too slow:** do not replace the EHR. Options that stay small:

- Ask their reporting team for a scheduled extract of **rates** (unsigned orders older than X, barcode-scan rate, restraint order counts) into a file drop. That can be class M if specified carefully. Many Cerner sites already have PowerInsight / Discern-style reports. The 2016 project included PowerInsight. Whether anyone still runs those reports is Open.
- A small service that only accepts those rate files (step 2 in the security document) gives a score without a FHIR project.

---

## 3. Domain 01 — People and competence

### SnapSkill (learning system)

| | |
|---|---|
| Evidence | Orientation and ongoing education EPs (HR.01.04.01, HR.01.05.03), and any NPSG or department module already delivered there |
| Confirmed | SSO with MLK credentials. Staff come to SnapSkill. SnapSkill does not query the hospital directory |
| API | Defined by the SnapSkill product. If completion records are not already exportable by employee, course, and timestamp, that is the first engineering gap, and it is on the learning-system side |
| Freshness | As soon as the learner finishes, if the product records it that way. That behavior is a product fact, not something the workbooks establish |
| Hosting | Wherever SnapSkill is hosted. The hospital's identity provider stays the hospital's |
| Data class | W, unless course content or uploads include patient cases |
| Limit | An LMS proves a module was completed. It does not prove a preceptor watched someone hang a medication. That second proof is competency, which is the Dossier-shaped problem |

### Dossier (named by MLKCH; vendor match is Inference)

| | |
|---|---|
| What the public product is | dossier.com: cloud competency platform for nursing, pharmacy, lab, imaging. Marketing says it sits on top of an LMS, aggregates completion from many content sources, and is aimed at Joint Commission, DNV, CMS, and Magnet survey readiness |
| API | No public developer API was found on dossier.com or in its 2022 product guides. The guides describe LMS integration and "real time" updates at the point of completion, without endpoint documentation. A Norwegian identity product also named Dossier uses SFTP (Identum). **Do not assume that SFTP spec is this vendor.** |
| Freshness | Vendor claims the competency record updates when learning is completed. That is marketing until the MLKCH tenant is seen |
| Hosting | Vendor describes it as cloud. Not on-prem |
| Data class | W if checkoffs stay skill-and-date. P if free text names a patient |
| Limit | If there is no API, the graph cannot stay current without a vendor export (CSV, SFTP, or a partner API they will turn on for a customer). That is a question for their customer success team, via the CTO |

**Options if Dossier will not expose data:**

- Ask for a scheduled CSV of person, skill, result, assessor, expiration. A small loader is enough. This is not a new clinical system.
- Extend SnapSkill so it becomes the system of record for the HR competency EPs, and treat Dossier as a source to import, or later replace, for those slices. The identity relationship already exists. Replacing a competency tool is politically real and technically modest compared with replacing an EHR. The build itself is a normal web application plus the data model in the scorecard (skill, EP, expiration, assessor).
- Do not scrape their UI.

### HR employment system — Open

Needed for HR.01.02.05 (qualifications verified) and HR.01.07.01 (performance evaluations): hire date, job code, license number, primary-source verification date, evaluation date. Dossier and SnapSkill usually do not own the legal personnel file.

Pattern, not confirmed: UKG, ADP, Oracle HCM, Workday, or Infor/Lawson. Hospitals of this size and vintage often still have a payroll vendor plus a spreadsheet for license expirations. API quality ranges from modern REST (Workday, UKG) to flat-file payroll interfaces (older Lawson). Freshness for license expiration is only as good as the last manual check unless they have bought a primary-source verification service (pattern: symplr, SkillSurvey, state-board APIs where they exist).

**Small build if the HRIS is hostile:** a license-and-evaluation register (person, credential, expiration, document link) that HR keeps current. SQL plus the graph. Do not rebuild payroll.

### Scheduling and California staffing — Open

NR.02.03.01 includes the nurse staffing plan. Live ratios need a scheduling system (pattern: UKG Dimensions, ShiftWizard, QGenda for physicians) or the EHR's staffing view. Unknown here. Counts without patient names stay class W/F.

### Medical staff office — Open, and not the pilot

The survey still spends an hour on credentialing. Pattern products: symplr Provider, HealthStream CredentialStream (the VerityStream lineage). Both are cloud credentialing and privileging suites with their own APIs or integration teams. Whether MLKCH uses one, or a shared drive of PDFs, is Open.

Even with a perfect API, peer-review and NPDB content stays out of the general graph. The safe extract is: practitioner, privilege set, appointment expiration, board status. Not the case narrative and not the NPDB report.

---

## 4. Domain 08 — Buildings, utilities, equipment, emergencies

This is the other high-exposure, low-PHI pilot. The life safety surveyor is on every survey, 2–5 hours a day in the building, and starts with a document list.

| Evidence | Typical system (Pattern) | API reality | Freshness | Hosting | If it is hostile |
|---|---|---|---|---|---|
| Fire alarm, sprinkler, extinguisher, damper inspections | Often a vendor (the inspection company) emails PDFs. Sometimes a CMMS: Nuvolo (ServiceNow), Accruent TMS, or a homegrown Access database | Vendor portals rarely have a hospital-facing API. CMMS products in this generation usually have REST or scheduled reports; confirm per product | The inspection is as fresh as the last visit, often quarterly or annual. The **record** is late if nobody files the PDF | Mixed. CMMS may be cloud. The PDF is wherever email puts it | A single evidence register: asset or system, EP, inspection date, next due, file link. You can build this. It replaces the binder index, not the fire-alarm vendor |
| Generator and emergency power tests (EC.02.05.07) | Same CMMS or a spreadsheet | Same | Monthly/annual test rhythm set by code, not by the API | Often on-prem spreadsheet | Same register |
| Medical gas and vacuum | Vendor inspection PDFs | Poor | Annual plus repairs | Files | Same register |
| Medical equipment inventory and PM (EC.02.04) | A biomedical system. Pattern: Nuvolo, TMS, Four Rivers, or a spreadsheet. Sometimes the EHR has a device record and the PM history does not | Modern CMMS: API or flat file. Spreadsheet: the register is the interface | PM compliance is a date math problem once the inventory exists | Often on-prem in older hospitals | Same register, keyed by device id |
| Fire drills (EC.02.03.03) | Spreadsheet or the environment-of-care committee's Excel. The Joint Commission even publishes a fire-drill matrix | None | Quarterly by shift, if they follow the standard | Files | Your register is a better matrix than a workbook that nobody owns. The packet's owner column is empty |
| Hazardous waste manifests | Vendor or EHS spreadsheet | Poor | Each shipment | Files | Link, don't rebuild the waste vendor |
| Life-safety drawings and interim life safety measures | Facilities share drive, sometimes a drawing system | File links | Changes when construction happens | On-prem file share is the Pattern | Store the link and the approval date |
| Emergency operations plan, hazard vulnerability analysis, after-action reports (EM) | Pattern: LiveProcess, Veoci, or Word/SharePoint. Unknown here | Those products have admin exports. Word does not | The 2025 guide describes this set as reviewed at least every two years. Freshness is slow on purpose | Cloud if they bought a tool; otherwise files | Policy/version object in the graph. Not a new EOC product unless they ask |
| Staff knowledge of environment-of-care roles (EC.03.01.01) | Training record | SnapSkill | On completion | Your cloud | Map specific modules to these EPs |

**On-prem note:** facilities data is the most likely slice to still be on a file server inside the hospital or the county campus network. The 2015 design had that kind of server room for enterprise apps. Reaching it means a site-to-site path or an export the hospital drops, not a public API. The EHR being in Kansas City does not mean the fire-drill spreadsheet is.

Nothing here requires replacing a life-safety vendor. The missing object is an index with an owner, a due date, and a file. That is a small system.

---

## 5. Domain 02 — Medication, beyond the EHR

| Function | System | Confidence | API and freshness | Data class |
|---|---|---|---|---|
| Orders, pharmacist review, administration charting | Oracle Health | Confirmed as the EHR | FHIR query; HL7 if they already emit it. Charting is real-time when the nurse scans | P |
| Automated dispensing cabinets | Pattern: BD Pyxis or Omnicell. One of these is nearly universal in a US hospital with an inpatient pharmacy. **Which brand is Open** | Pattern | Both vendors interface to the EHR (HL7 and proprietary). A direct API to a third party is a vendor project, slower than reading the EHR's dispense and administration events. Cabinet transactions are real-time into the EHR if the interface is up; the compliance score can lag a day | P |
| Smart pumps and the other devices | CIO said 58 devices were connected in 2016. Brands not named | Confirmed that devices were interfaced; brand Open | Device data that landed in the EHR is available through the EHR path. A direct pump-server API (BD, ICU Medical) is a second project and usually class P | P |
| Temperature and expiration in medication rooms | Often a log or a continuous sensor (pattern: SmartSense, Primex, or a clipboard) | Pattern. Spreadsheets are still used for a lot of operational tracking | Sensors can be real-time. Clipboards are as fresh as the last photo. A sensor API is usually vendor-specific | F if the log is only location and temperature |
| Sterile compounding environmental controls | Certification vendor PDFs. On the 2025 morning list if they compound | Open whether they compound | No API. File link | F |
| Recall process | Pharmacy procedure plus a spreadsheet or the wholesaler portal (pattern: McKesson, Cardinal, Cencora) | Open | Portal exports | F for the drug list; P if tied to doses already given |

**Do not build a pharmacy system.** If cabinet data is not in the EHR, the smaller move is to turn the existing EHR interface back on, which is an Oracle Health / cabinet-vendor configuration, not a startup product.

---

## 6. Domain 03 and 04 — Safety practices, infection, lab, tissue

| Evidence | Where it usually is | API | Freshness | Class |
|---|---|---|---|---|
| Time-out, site marking, two identifiers | Observed, or documented in the EHR procedure record | EHR path for the documented time-out. Observation audits are a form someone fills. Pattern tools: the quality module of the EHR, or Excel | The audit is as fresh as the last observation round | M if the stored fields are unit and rate |
| Hand hygiene | Secret-shopper audits. Pattern: a phone app (Swipestats, BioVigil) or paper | App vendors have exports. Paper does not | Weekly or monthly rounds are normal | F/M |
| Infection surveillance | Pattern: NHSN reporting plus a local tool (VigiLanz, Premier, Epic/Cerner infection module, or Excel). NHSN is the CDC system they likely already file to if they are a Medicare hospital. **Local tool is Open** | NHSN has its own upload specifications for the hospital's submission; it is not a convenient read API for a startup. The local tool varies | Surveillance is daily-to-weekly inside the hospital; NHSN deadlines are monthly/quarterly | P at row level |
| Device infection bundles (central line, catheter, surgical site) | EHR documentation plus the surveillance tool | EHR | As documented | P |
| Waived testing QC | Device middleware or a log. Glucometers often sit on a middleware (pattern: Telcor, RALS) that feeds the EHR | Middleware-to-EHR is the path to prefer | Real-time if interfaced; otherwise the log | P if patient-linked; the QC pass/fail on a device can be F |
| CLIA certificate and who may test | A PDF and a competency record | File + Dossier/SnapSkill | Certificate is annual | F and W |
| Tissue traceability | Pattern: a tissue tracking module or a log. Open whether they implant | Often poor | Per implant | P |
| OPO and eye/tissue bank agreements | Contract file. Morning list asks for them by name | File | Multi-year | F |

**Small build:** an observation-audit capture (unit, measure, numerator, denominator, date, observer) for hand hygiene and time-outs. That is a form, not an EHR. It moves category `C` EPs that are not in any system today onto the scorecard without PHI, if the form forbids patient stickers.

---

## 7. Domain 05 and 06 — The chart, rights, and care delivery

System of record is Oracle Health for anything that is a chart fact: authentication, verbal order sign-off, operative note presence, discharge information, consent scanned into the media tab, restraint orders.

Rights policies (the text of the consent policy, the grievance policy) are documents. Where those PDFs live is Open. Pattern: SharePoint, PolicyStat, MCN/Ntracts Policy Manager, or a shared drive. MCN's materials describe a healthcare policy workflow with audit trails and regulatory alerts; that is an example, not MLKCH's purchase. If the CTO says the policies are on a file share, the API is "there isn't one," and the small build is a policy register: document id, EP, version, approval date, owner, link. You should not clone a full policy-authoring suite unless they ask. The scorecard only needs the version and the link.

Grievance **logs** are often a spreadsheet or the risk system (pattern: RLDatix, Origami Risk). Row-level grievances are class P. A count by month is class M.

Provision of Care has no workbook here. When it shows up, assume Oracle Health plus the policy register, and class P.

---

## 8. Domain 07 — Leadership and quality numbers

| Evidence | System | API | Class |
|---|---|---|---|
| Governing body and medical executive minutes, 12 months | Open. Pattern: a board portal or Word in a share | File | F until a case is discussed |
| Contract list and quality of contracted services | Open. Pattern: a contract tool or legal's spreadsheet | File | F |
| PI data and ORYX / Accelerate PI | `APR.04` and `PI.02.01.03` require a performance-measurement arrangement. The 2015 packet does not name the vendor. Current Joint Commission materials tell hospitals to be ready to show ORYX and/or Accelerate PI dashboard reports | The vendor sends data to Joint Commission. A copy of the same rates is a file or a user login, not a scrape of Joint Commission Connect | M |
| Culture-of-safety survey | On the 2025 morning list. Pattern: Press Ganey or a similar survey | Export | W/F. Comments can name people |
| Patient-flow dashboards (LD.04.03.11) | Often a homegrown Excel on top of EHR timestamps (ED arrival, bed assign, discharge order) | EHR report | M if de-identified to hour and unit |

**Small build:** a minutes-and-measures index is the same register as policies, with a different type. Don't buy a GRC platform on their behalf in the first design. If they later want workflow (review, approve, attest), that is a real product, and several exist. Your graph can sit on top of whichever they pick.

---

## 9. Cross-cutting: identity, files, and spreadsheets

| Need | What to ask the CTO | Why |
|---|---|---|
| Identity provider | Is SSO Entra ID, AD FS, or something else? Can a future app use the same federation SnapSkill uses? | That federation already exists. Reuse it |
| File shares | Where do survey binders live (SharePoint, on-prem file server, someone's desktop)? | This is the likely home of class F evidence |
| Spreadsheet inventory | Which of these are still Excel: fire drills, temperatures, waived-test QC, grievances, contract list, license expirations, PI? | Each one is a candidate for the small register rather than an integration |
| Reporting team | Who can run a Discern/PowerInsight or SQL-behind-Cerner report without a new FHIR app? | Fastest path to class M rates |
| Security reviewer | Who signs a BAA, and do they require HITRUST or is SOC 2 enough? | Open. Decides the calendar for class P, not for class W |

---

## 10. Build vs buy vs leave it, in one list

| Need | Recommendation | Size |
|---|---|---|
| EHR replacement | Leave Oracle Health in place | Out of scope |
| Cabinet, pump, lab analyzer | Prefer the interface that already lands in the EHR | Vendor config, not a new system |
| Competency evidence | Use Dossier if an export exists; otherwise extend SnapSkill | Small or medium. Staff already sign in |
| License expiration and evaluations if HRIS is closed | A register | Small |
| Life safety, equipment PM, drills, utility tests | An evidence register with file links and due dates | Small. Highest leverage non-PHI build |
| Policy and minutes index | Same register, different type | Small |
| Hand hygiene and time-out audits | A form that stores rates only | Small |
| Quality rates from the chart | Scheduled aggregate extract first; FHIR later | Medium, and gated by a BAA |
| Credentialing suite | Buy or keep whatever the medical staff office uses. Do not build NPDB | Not a version-one build |
| Full GRC / policy suite | Only if they want workflow. The graph does not require it | Their buying decision |

The register is one database: `requirement`, `evidence`, `owner`, `period`, `source_system`, `uri`, `data_class`. It is ordinary relational storage. The knowledge graph sits on top of it and adds the relationships (EP to standard to domain to system to role). Building the register is what makes Domains 01 and 08 scorable without waiting for Oracle Health.
