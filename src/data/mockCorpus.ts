import { DocumentItem } from '../types/classifier';

export const SAMPLE_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-001',
    title: 'GPM311_Freelancer_Annual_Tax_Return_2025_Final.pdf',
    snippet: 'Form GPM311 personal income tax return for fiscal year 2025. Total freelance software engineering revenue €78,400. Deductions for home office expenses, fiber internet utilities, and personal healthcare contributions.',
    fullText: `STATE TAX INSPECTORATE DECLARATION FORM GPM311
Taxpayer ID: 38804190234
Period: 2025-01-01 to 2025-12-31
Declaration Type: Annual Personal Income & Freelance Activity
Income breakdown:
- Freelance Software Engineering & AI Consulting: €78,400.00
- Deductible operating expenses: €23,520.00 (30% flat rate)
- Health insurance (PSD) paid: €2,140.00
- Social security (VSD) paid: €4,890.00
- Attached documents: Personal bank statement, utility bills (Telia fiber, Ignitis electricity), VAT receipt summary.
Attached note: Includes automated Python script snippet used for calculating currency conversions against ECB daily rates.`,
    source: 'corpus',
    fileType: 'pdf',
    drivePath: '/My Drive/Inbox/GPM311_Freelancer_Annual_Tax_Return_2025_Final.pdf',
    modifiedAt: '2026-03-24 14:22',
    fileSize: '412 KB',
    status: 'pending'
  },
  {
    id: 'doc-002',
    title: 'Series_A_Cap_Table_Valuation_Model_v4.2.xlsx',
    snippet: 'Post-money valuation model and cap table for Series A round. Fully diluted share count 12,500,000 shares. Pre-money valuation $18.5M, new investment $4.5M at $1.84/share. Option pool expansion to 15%.',
    fullText: `SERIES A FINANCING SPREADSHEET & CAPITALIZATION TABLE
Company: CyberScale Technologies Inc.
Round: Series A Preferred Stock
Pre-Money Valuation: $18,500,000
Capital Raised: $4,500,000
Post-Money Valuation: $23,000,000
Share Price: $1.84 per share

Ownership Distribution (Fully Diluted):
- Founders Common Stock: 6,850,000 shares (54.8%)
- Seed Investors (Convertible SAFE notes): 1,420,000 shares (11.36%)
- Series A Lead Investor: 2,445,652 shares (19.57%)
- Unallocated Option Pool (ESOP): 1,784,348 shares (14.27%)
Projections: 36-month burn rate forecast, cash runway extension through Q4 2028, revenue share and royalty terms for initial licensing partners.`,
    source: 'corpus',
    fileType: 'xlsx',
    drivePath: '/My Drive/Finance/Series_A_Cap_Table_Valuation_Model_v4.2.xlsx',
    modifiedAt: '2026-08-11 09:15',
    fileSize: '1.2 MB',
    status: 'pending'
  },
  {
    id: 'doc-003',
    title: 'SmartPlanet_MQTT_Spine_and_WOPR_Governance_Architecture.md',
    snippet: 'Technical specification for SmartPlanet AI core infrastructure. Details the MQTT messaging spine, real-time audit engines, enforcer mechanics, and NORAD control nodes. DEFCON status escalation protocols.',
    fullText: `# SmartPlanet Infrastructure Architecture Specification
System Code: WOPR-NORAD-CORE-01
Initiative: SmartPlanet Social Media & Autonomous AI Platform

1. Operational Nodes
- WOPR Central Hub: Primary orchestration server handling real-time consensus.
- NORAD Control: Defensive posture monitor and DEFCON status (DEFCON 5 to DEFCON 1) handler.
- The Farm: Data synthesis compute cluster.
- The Factory: High-throughput agent reproduction and model training farm.

2. Messaging Spine
- High-availability MQTT broker cluster with TLS 1.3 mutual auth.
- Topics: /smartplanet/enforcer/mechanics, /smartplanet/audit/engine/telemetry.
- Autonomous Enforcer mechanics: Enforces governance rules across distributed agent nodes, terminating errant threads when audit thresholds fail.`,
    source: 'corpus',
    fileType: 'md',
    drivePath: '/My Drive/Smartplanet/Architecture/SmartPlanet_MQTT_Spine_and_WOPR_Governance_Architecture.md',
    modifiedAt: '2026-09-02 17:40',
    fileSize: '84 KB',
    status: 'pending'
  },
  {
    id: 'doc-004',
    title: 'Ainie_Genesis_Protocol_MultiSpace_HUD_Spec_v2.docx',
    snippet: 'Specification for Ainie personal digital twin. Architecture of AgentDash, AgentFrame, multi-space OS HUD, reality isolation layers, and localized domain routing (.life variants: Faulpelz, Tinginys, Flemmard).',
    fullText: `AINIE SYSTEM SPECIFICATION: GENESIS PROTOCOL
Component: Personal AI Assistant & Digital Twin Architecture
Subsystems: AgentDash, AgentFrame, Reality Isolation Layers

1. Architecture Overview
Ainie operates as the singular digital twin interface for human-agent symbiosis.
- AgentFrame: Base execution harness running the Genesis Protocol bootstrap.
- Multi-space OS: Context switcher between personal life spaces, creative labs, and execution arenas.
- Heads-Up Display (HUD): Ambient projection and wearable interface specifications.

2. Localized Domains & Personality Profiles
- Domains configured under .life top-level space:
  * faulpelz.life (Germanic leisure & recovery persona)
  * tinginys.life (Baltic slow-living & focus assistant)
  * flemmard.life (Francophone creative contemplation space)
- Reality Isolation Layer: Strictly partitions cognitive states between external persona interaction and private host consciousness.`,
    source: 'corpus',
    fileType: 'docx',
    drivePath: '/My Drive/Ainie/Core/Ainie_Genesis_Protocol_MultiSpace_HUD_Spec_v2.docx',
    modifiedAt: '2026-07-19 11:05',
    fileSize: '320 KB',
    status: 'pending'
  },
  {
    id: 'doc-005',
    title: 'Ergonomic_Assisted_Living_Sensory_Automation_Blueprint.pdf',
    snippet: 'Architectural designs for barrier-free adaptive living residence. Details motor-assisted kitchen countertops, circadian lighting controllers, voice-guided accessibility actuators, and wellness sensors.',
    fullText: `BLUEPRINT & SPECIFICATION: ADAPTIVE LIVING RESIDENCE
Project: Universal Accessibility & Ergonomic Assisted Living Suite
Location: Horizon Wellness Community

Section 1: Physical Infrastructure
- Zero-threshold barrier-free floor transitions with slip-resistant tactile paving.
- Height-adjustable hydraulic cabinetry and ergonomic prep surfaces for wheelchair accessibility.
- Integrated grab rails with force-sensing bio-telemetry.

Section 2: Ambient Smart Home Automation
- Circadian rhythm dynamic kelvin light sequencing (2700K to 5000K).
- Fall detection radar nodes (60GHz mmWave) without intrusive cameras.
- Voice and gesture operated motorized door and window actuators.
- Environmental air filtration, humidity equilibrium, and acoustic dampening zones.`,
    source: 'corpus',
    fileType: 'pdf',
    drivePath: '/My Drive/Living/Ergonomic_Assisted_Living_Sensory_Automation_Blueprint.pdf',
    modifiedAt: '2026-05-14 16:30',
    fileSize: '2.8 MB',
    status: 'pending'
  },
  {
    id: 'doc-006',
    title: 'Grand_Lodge_Fraternal_Registry_Visitation_Minutes_2026.docx',
    snippet: 'Administrative correspondence and protocol documentation for Grand Lodge of Ancient Free and Accepted Masons. Visitation itinerary, membership roster update, and trestleboard degree work schedule.',
    fullText: `IN THE NAME OF THE GRAND LODGE
Lodge Administration & Fraternal Roster Records
Meeting: Regular Communication of Lodge No. 42
Date of Labor: October 3, 2026

Present:
- Worshipful Master, Senior Warden, Junior Warden, Secretary, Treasurer.
- Roster of Brethren present and registered in the Tyler's Register: 38 Master Masons.
- Visiting Dignitaries: Right Worshipful District Deputy Grand Master and suite.

Agenda & Proceedings:
1. Opening on the Third Degree in due and ancient form.
2. Reading and approval of minutes of previous regular communication.
3. Secretary report on fraternal correspondence received from Grand Secretary regarding the upcoming Annual Grand Communication.
4. Trestleboard announcement: Fellowcraft degree conferring next fortnight.
5. Relief and Charity Committee report on fraternal alms and support for distressed brethren.`,
    source: 'corpus',
    fileType: 'docx',
    drivePath: '/My Drive/Lodge/Grand_Lodge_Fraternal_Registry_Visitation_Minutes_2026.docx',
    modifiedAt: '2026-10-04 20:12',
    fileSize: '150 KB',
    status: 'pending'
  },
  {
    id: 'doc-007',
    title: 'Dockerfile_and_MCP_Tools_Python_Pipeline_Setup.py',
    snippet: 'Multi-stage Dockerfile configuration and Python Model Context Protocol (MCP) server implementation. Includes GitHub Actions CI/CD workflows, automated tests, and DORA lead-time metric trackers.',
    fullText: `"""
Model Context Protocol (MCP) Server & Dockerized Automation Pipeline
Repository: github.com/enterprise/ai-tools-mcp-spine
"""
import os
import asyncio
from typing import Dict, Any
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP("Enterprise-Dev-Pipeline")

@mcp.tool()
async def deploy_container(image_tag: str, namespace: str) -> str:
    """Trigger container rollout via Kubernetes API and report DORA metrics."""
    # Automated GitHub Actions webhook trigger
    return f"Container {image_tag} deployed to {namespace} with DORA lead-time 14m."

# DOCKERFILE DEFINITION
DOCKERFILE = """
FROM python:3.12-slim AS builder
WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry export -f requirements.txt --output requirements.txt
FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENTRYPOINT ["python", "-m", "pipeline.worker"]
"""
# Automated n8n workflow webhook listener included below`,
    source: 'corpus',
    fileType: 'py',
    drivePath: '/My Drive/Dev/Repos/Dockerfile_and_MCP_Tools_Python_Pipeline_Setup.py',
    modifiedAt: '2026-09-18 13:45',
    fileSize: '45 KB',
    status: 'pending'
  },
  {
    id: 'doc-008',
    title: 'Enterprise_Operating_Model_and_Balanced_Scorecard_2027.pdf',
    snippet: 'Executive strategic roadmap, Target Operating Model (TOM), Balanced Scorecard (BSC) metrics, enterprise governance architecture, organizational redesign, and 5-year transformation milestones.',
    fullText: `ENTERPRISE STRATEGIC ROADMAP 2026-2030
Document: Target Operating Model (TOM) & Balanced Scorecard (BSC)
Classification: Strategic Executive Leadership

1. Balanced Scorecard Framework
- Financial Perspective: 22% CAGR on enterprise SaaS contracts, operational efficiency ratio under 64%.
- Customer Perspective: Net Promoter Score (NPS) > 72, enterprise account retention 96.5%.
- Internal Business Processes: Cycle time reduction across core deliverables from 18 to 4 days.
- Learning & Growth: AI workforce literacy program, organizational agility index.

2. Enterprise Architecture Governance
- Architectural Review Board (ARB) charter and stage-gate approval criteria.
- Target operating model transitioning from siloed functional business units to value-stream aligned product pods.
- RACI matrix defining executive accountabilities across CEO, CTO, and BU Presidents.`,
    source: 'corpus',
    fileType: 'pdf',
    drivePath: '/My Drive/Strategy/Roadmaps/Enterprise_Operating_Model_and_Balanced_Scorecard_2027.pdf',
    modifiedAt: '2026-09-29 10:15',
    fileSize: '1.9 MB',
    status: 'pending'
  },
  {
    id: 'doc-009',
    title: 'Dr_Smith_Clinical_Summary_and_Blood_Test_Results.pdf',
    snippet: 'Private patient medical record and clinical examination summary. Comprehensive metabolic panel, lipid profile, MRI lumbar spine report, prescription medications, and follow-up consultation notes.',
    fullText: `CONFIDENTIAL MEDICAL RECORD & CLINICAL REPORT
Patient Name: Alexander Vance
Date of Birth: 1984-06-12 | Patient MRN: 902-881-A
Physician: Dr. Eleanor Smith, MD (Internal Medicine & Endocrinology)

Clinical Summary:
Patient presented for routine annual health evaluation and review of chronic lumbar discomfort.
- Blood Pressure: 118/76 mmHg | Resting Heart Rate: 64 bpm
- Comprehensive Metabolic Panel: Normal renal and hepatic markers. Fasting glucose 92 mg/dL.
- Lipid Profile: Total cholesterol 182 mg/dL, HDL 54 mg/dL, LDL 108 mg/dL.
- Imaging: MRI lumbar spine shows mild L4-L5 disc desiccation without canal stenosis.
Prescription: Ergonomic physical therapy regimen, Ergocalciferol 50,000 IU weekly.
Note: Patient also requested a home health expense invoice for personal tax record filing.`,
    source: 'corpus',
    fileType: 'pdf',
    drivePath: '/My Drive/Personal/Medical/Dr_Smith_Clinical_Summary_and_Blood_Test_Results.pdf',
    modifiedAt: '2026-06-14 08:30',
    fileSize: '380 KB',
    status: 'pending'
  },
  {
    id: 'doc-010',
    title: 'Lufthansa_Flight_Booking_and_DHL_Shipping_Receipts.pdf',
    snippet: 'Personal roundtrip flight itinerary from Frankfurt to Tokyo, airline e-ticket, seat assignment, along with DHL express international package tracking receipt and customs declaration for personal luggage.',
    fullText: `TRAVEL ITINERARY & COURIER DISPATCH RECEIPT
Booking Reference: LH-88X99Z
Passenger: Mr. Alexander Vance
Flights:
- Outbound: LH716 Frankfurt (FRA) -> Tokyo Haneda (HND), Seat 14A (Business Class)
- Inbound: LH717 Tokyo Haneda (HND) -> Frankfurt (FRA), Seat 12K

Attached Shipping Receipt:
- Carrier: DHL Express Worldwide
- Tracking Number: 1928-3849-5011
- Shipper: Private Residence, Munich, Germany
- Contents: Personal clothing, used camera gear, household travel essentials.
- Total paid: €148.50 (Paid via personal Visa card)`,
    source: 'corpus',
    fileType: 'pdf',
    drivePath: '/My Drive/Personal/Travel/Lufthansa_Flight_Booking_and_DHL_Shipping_Receipts.pdf',
    modifiedAt: '2026-04-12 19:50',
    fileSize: '290 KB',
    status: 'pending'
  },
  {
    id: 'doc-011',
    title: 'Reality_Isolation_Trap_Personal_VAT_Invoice_with_AI_Code.txt',
    snippet: 'TRAP TEST CASE: Freelancer VAT invoice and passport ID copy, but contains embedded Python Docker deployment scripts and enterprise cap table notes in the margin.',
    fullText: `INVOICE & PERSONAL TAX RECEIPT - FREELANCE VAT NO. LT100982341
Client Bill-To: Personal Record Archive
Tax Identification / Passport No: 4890123984 (Republic of Lithuania Passport)
Invoice No: INV-2026-099
Items:
1. Personal Home Office Fiber Broadband Reimbursement: €85.00
2. Personal Health Clinic Co-payment: €120.00
VAT (21%): €43.05 | Total: €248.05

[MARGIN NOTES FOR ATTACHED WORK]:
Here is the python snippet used for checking my deployment script:
import docker; client = docker.from_env(); client.containers.run("ai-agent:latest")
Also discussed our company valuation model and cap table funding target with VC.`,
    source: 'corpus',
    fileType: 'txt',
    drivePath: '/My Drive/Inbox/Reality_Isolation_Trap_Personal_VAT_Invoice_with_AI_Code.txt',
    modifiedAt: '2026-10-01 15:10',
    fileSize: '32 KB',
    status: 'pending'
  },
  {
    id: 'doc-012',
    title: 'Random_Coffee_Machine_Cleaning_and_Office_Snacks.txt',
    snippet: 'Office kitchen manual for descaling the Jura bean-to-cup espresso machine, weekly pantry snack preferences list, and instructions for resetting the milk frother wand.',
    fullText: `BREAKROOM & KITCHEN MAINTENANCE GUIDE
Topic: Espresso Machine Care & Snack Stocking
Equipment: Jura GIGA 10 Commercial Coffee System

Cleaning Cycle:
1. Daily: Empty drip tray and coffee grounds container. Rinse milk frothing tube with Jura auto-clean tablet.
2. Weekly: Run full 20-minute descaling program using 3 descaling tablets dissolved in 600ml warm water.
3. Monthly: Replace water filter cartridge (Claris Smart Pro).

Office Pantry Order:
- Oat milk (Barista edition) x 12
- Whole bean dark roast Arabica x 5kg
- Salted almonds and dried cranberries x 8 packs`,
    source: 'corpus',
    fileType: 'txt',
    drivePath: '/My Drive/General/Random_Coffee_Machine_Cleaning_and_Office_Snacks.txt',
    modifiedAt: '2026-02-18 11:20',
    fileSize: '18 KB',
    status: 'pending'
  }
];
