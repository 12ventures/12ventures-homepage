# Connectors for the knowledge graph

The connector set in the MLKCH Joint Commission live assessment demo as of Sep 25, 2026. Each row is one system the score reads. Topics are the compliance areas that use it.

**Confirmed** means MLKCH uses this system.

**Not confirmed** means it is only a market example or a file, and it is not a confirmed MLKCH system.

UKG appears twice because it is two connector types: HRIS and workforce management. Oracle Health is confirmed on the chart topics and only an example on two topics where the hospital setup is not known.

## Confirmed

| Type | System | Topics |
|---|---|---|
| LMS | [SnapSkill](https://snapskill.ai) | Staff qualifications and competence |
| LMS | [HealthStream](https://www.healthstream.com/) | Staff qualifications and competence |
| Competency | [Dossier](https://www.dossier.com) | Staff qualifications and competence |
| HRIS | [UKG](https://www.ukg.com/) | Staff qualifications and competence |
| WFM | [UKG](https://www.ukg.com/) | Nursing leadership and staffing plan |
| EHR | [Oracle Health](https://www.oracle.com/health/) | Medication use; Identification, medications, alarms, and critical results; Infection steps, suicide risk, and procedures; Medical record |
| Clinical reference | [UpToDate](https://www.uptodate.com/) | Medication use |
| HIE | [Manifest MedEx](https://www.manifestmedex.org/who-we-help/hospitals/) | Medical record |

HealthStream and Dossier are both in use. HealthStream assigns courses. Dossier records a demonstrated skill. UKG is the HR source of truth. Workday is not the HR system. UpToDate is the clinical reference used in practice. Manifest MedEx is the exchange used for outside hospital records.

## Not confirmed

### Named, connection not confirmed

| Type | System | Topics |
|---|---|---|
| Lab certificate | CLIA certificate and competency | Waived testing |
| Accreditation | [Joint Commission](https://www.jointcommission.org/) | Accreditation participation |

### Market examples

A common product in that slot. Not confirmed as the system MLK uses.

| Type | System | Topics |
|---|---|---|
| Credentialing | [symplr](https://www.symplr.com/) | Medical staff credentialing and privileging |
| Environmental monitoring | [SmartSense](https://www.smartsense.co/) | Medication control |
| ADC | [BD Pyxis](https://www.bd.com/en-us/products-and-solutions/products/product-families/pyxis-medstation-es-system) | Medication use |
| Hand hygiene | [BioVigil](https://www.biovigil.com/) | Infection steps, suicide risk, and procedures |
| Infection reporting | [NHSN](https://www.cdc.gov/nhsn/) | Infection prevention program |
| POC testing | [Telcor](https://www.telcor.com/) | Waived testing |
| EHR | [Oracle Health](https://www.oracle.com/health/) | Tissue and organ responsibilities; Provision of care, treatment, and services |

Oracle Health on those last two topics is an example only. The same product is confirmed on the chart topics in the table above.

### Files and folders

No vendor connection. A document, spreadsheet, or export.

| Type | What it is | Topics |
|---|---|---|
| Staffing plan | The staffing-plan file | Nursing leadership and staffing plan |
| Pharmacy policy | Pharmacy policy folder | Medication control |
| Quality audit | Audit spreadsheet or form | Identification, medications, alarms, and critical results |
| Infection plan | Infection plan documents | Infection prevention program |
| Donation agreements | OPO and tissue-bank agreements | Tissue and organ responsibilities |
| Policy system | [PolicyStat](https://www.policystat.com/) | Patient rights |
| Safety and risk | [RLDatix](https://www.rldatix.com/) | Patient rights |
| Governance | Board and leadership files | Leadership and governance |
| Quality reporting | [Press Ganey](https://www.pressganey.com/) | Performance improvement |
| Life safety | Facilities inspection files | Life safety |
| CMMS | [Nuvolo](https://www.nuvolo.com/) | Environment of care |
| Emergency management | [Veoci](https://www.veoci.com/) | Emergency management |
| Privacy and security | Information-management policies | Information privacy, security, and continuity |

PolicyStat, RLDatix, Press Ganey, Nuvolo, and Veoci are named products, but the demo only has them as a file the hospital might already keep. They are not confirmed connections.
