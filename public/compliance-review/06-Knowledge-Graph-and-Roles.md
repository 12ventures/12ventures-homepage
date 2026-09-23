# Knowledge graph and role-shaped answers

This is a design for the graph, derived from the scorecard and the system map. It is not a claim about software MLKCH already runs.

The graph exists so a question can be answered from relationships ("which high-exposure EPs in medication administration have no evidence this quarter, and which system should have had it") and so the same fact can be phrased for a CEO, a CTO, or a chief nursing officer without giving each of them the same rows.

---

## 1. What is a node

| Node | Identity | Comes from |
|---|---|---|
| Domain | `people`, `medication`, `safety`, `infection`, `record`, `care`, `leadership`, `place` | Scorecard document |
| Standard | 2015 code, e.g. `MM.06.01.01` | Workbook |
| Requirement intent | A stable id such as `med.admin.safe` that can point at a 2015 EP now and a later manual's EP later | Designed once, mapped per manual version |
| EP | Standard + number + scoring category + documentation flag + MOS flag | Workbook |
| Applicability | Applies / does not apply / unknown, with a reason (no swing beds, no compounding) | Human, once, then stored |
| Evidence | One proof for one EP for one time window: state 0–5, timestamp, owner, source system, URI | Register and feeds |
| Source system | Oracle Health, SnapSkill, Dossier, evidence register, file share | System map |
| Document | Policy, plan, minute, certificate. Version and approval date | Register |
| Person | Staff or practitioner id. Not a clinical patient id in the workforce graph | IdP, HR, Dossier |
| Unit | ED, ICU, med/surg, OB, OR | Hospital structure |
| Measure | Numerator, denominator, period, definition | Aggregates only, in the default graph |
| Finding | An RFI if they choose to load a past survey report. Optional | Joint Commission report, typed in. There is no public API for this |
| Role | CEO, CTO, CNO, accreditation, quality, facilities, surveyor-temporary | Directory groups |

Edges that matter: `EP satisfies RequirementIntent`, `Evidence supports EP`, `Evidence sourcedFrom System`, `Person owns EP`, `Document addresses EP`, `Measure rollsUpTo Domain`, `EP crosswalksTo CMS citation` (only after the citation is checked), `Role maySee DataClass`.

Patients are not nodes in the default graph. A class P drill-down uses a reference (`source system`, `resource id`) resolved in Oracle Health under that user's own rights. The graph stores that a measure failed, not the note.

---

## 2. Two graphs, not one bucket

| Graph | Nodes allowed | Why split |
|---|---|---|
| Operations graph | Domains, EPs, evidence of class W and F, de-identified measures, documents, systems, owners | This is the pilot. A compromised query cannot return a chart |
| Clinical evidence graph | Class M and P pointers, under a BAA | Built when step 3 in the security document is real |

A measure node may live in the operations graph only if the definition was agreed as de-identified (unit, month, rate). The row-level extract that produced it stays in the hospital or in the clinical graph.

---

## 3. How a score is computed

For a domain, take every EP where applicability is `applies`. Drop `does not apply`. Treat `unknown` as its own bucket, not as a failure (Primary Care Medical Home and swing-bed EPs start as unknown).

Apply the 0–5 evidence rubric and the weights in [03-Compliance-Scorecard.md](03-Compliance-Scorecard.md). Store the inputs on the evidence node so the number can be explained. An answer that says "medication is 2.4" is incomplete. The graph should be able to list the EPs at 0 and the system that was supposed to feed them.

Audit exposure stays a property of the chapter from the 2015 parse. It does not change when they upload a policy. Compliance score changes. Showing both stops a clean policy library from looking like a clean tracer result.

---

## 4. Roles

Personalization is mostly **which relationships to walk** and **which words to use**, not a different set of facts. Access is a hard filter applied before the walk.

| Role | Data classes | What the answer emphasizes | Example question the graph can actually support |
|---|---|---|---|
| CEO | W and F aggregates, domain scores, exposure, owners missing, contract and budget EPs in leadership. No peer review. No chart text | Risk to accreditation and to operations, in domain language, with the single next gap | "Where are we exposed before the next survey, and who owns the worst gap?" |
| CTO | Same aggregates, plus source-system freshness, failed feeds, on-prem vs hosted, API gaps | Whether the score is trustworthy, and which system is dark | "Which domains are unscored because we have no feed, and which of those are on a file share?" |
| CNO / head of nursing | W competency and orientation for nursing roles, staffing-plan document status, safety-practice rates that are de-identified, nurse-executive structure EPs. Patient-level only if this person is separately granted class P | Unit and role: who is not current, which unit's hand-hygiene or time-out rate is the outlier | "Which units have nurses with expired medication-administration competency?" |
| Accreditation / quality director | W, F, and, after the BAA, M and P pointers for the EPs in scope | The EP, the evidence, the due date, the CMS flag | "Show RC EPs that are category C with no sample in the last 12 months." |
| Facilities / safety officer | F for LS and EC, nothing clinical | Overdue inspections and interim life safety | "Which egress and fire-alarm EPs are past due?" |
| Medical staff office | Appointment and privilege dates only, in a later phase | Expiring appointments | Not in version one |
| Time-boxed survey support | Read-only slice the accreditation lead publishes: evidence links for requested EPs | A packet organized like the morning document list | "Generate the life-safety document index for the surveyor base room." This user does not get the whole graph |

The CEO does not receive a more clinically detailed answer than the CNO. The CEO receives a shorter rollup. If the CEO asks "show me the chart for the central-line infection last Tuesday," the honest answer is that this view does not open charts, and the quality director's view can. That is the product behaving correctly.

Directory groups should come from the same identity provider that already federates into SnapSkill, so a terminated employee loses the graph when they lose the LMS. Inference that this is possible: they already operate SSO. Open until the IdP is named.

---

## 5. Questions the graph is for

These are the ones the current model can answer once evidence exists. They are also the ones a survey week actually asks.

- Which EPs marked documentation-required have no current document version?
- Which category `C` EPs have no sample in the window?
- Which high-exposure domains are still Unscored, and is that because the system is unknown or because the feed is down?
- Who is the owner, and which owners have the most EPs at state 0 or 1?
- For a tracer on a procedural patient, which Universal Protocol and medication-labeling EPs have a recent observation rate, and which are policy-only?
- For the life safety surveyor tomorrow, which inspection records are inside their required frequency?

These are not answerable from the 2015 workbooks alone, because the evidence nodes do not exist yet. The workbooks are the requirement side of the graph. They can be loaded now. The score stays Unscored until evidence nodes show up, which is the correct behavior.

---

## 6. Loading the 2015 packet

Load standards and EPs from `_tjc_inventory.json`. Do not load the CMS cell as a verified legal cite until it has been checked; store it as `crosswalk_as_entered`. Do not treat `CR` as a risk score. Set every evidence state to empty. Set applicability to `unknown` on standards whose text says they apply only for swing beds, primary care medical home, or deemed-status long-term care, and to `applies` otherwise only where the 2015 service list makes that safe (inpatient med/surg, ICU, OB, ED). When unsure, leave `unknown`.

Medical Staff and Provision of Care load as domains with zero EPs and status `source packet missing`, so the scorecard cannot silently look finished.
