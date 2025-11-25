# FHIR Patient Monitoring Dashboard

### 🔗 [Live Demo](https://fhir-patient-dashboard.vercel.app/)

A real-time patient monitoring dashboard built with React that integrates with HL7 FHIR R4 APIs to display vital signs, clinical alerts, and patient demographics. Designed for healthcare interoperability and clinical decision support.

## Why This Project

Healthcare systems remain fragmented — EHRs don't talk to each other, and critical patient data gets siloed. FHIR (Fast Healthcare Interoperability Resources) is the modern standard solving this problem, mandated by the 21st Century Cures Act for US healthcare systems.

This project demonstrates practical FHIR integration skills by building a clinical dashboard that:
- Fetches real patient data from FHIR-compliant servers
- Parses standardized medical coding (LOINC) for vital signs
- Displays real-time monitoring with clinical threshold alerts

## Features

- **Live FHIR Integration** — Connects to HAPI FHIR R4 public server (swappable for any FHIR-compliant EHR)
- **Patient Search** — Query patients by name with paginated results
- **Vital Signs Monitoring** — Heart rate, SpO₂, temperature, respiratory rate, blood pressure
- **Clinical Alerts** — Color-coded status indicators based on normal reference ranges
- **Real-time Updates** — Simulated continuous monitoring with trend visualization
- **LOINC Code Mapping** — Industry-standard medical coding for observations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Recharts |
| Styling | Tailwind CSS |
| Data Standard | HL7 FHIR R4 |
| Medical Coding | LOINC |
| API | RESTful FHIR Resources |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                           │
├─────────────────────────────────────────────────────────────┤
│  PatientSearch  │  VitalCards  │  AlertPanel  │  TrendChart │
└────────┬────────┴──────┬───────┴──────┬───────┴─────────────┘
         │               │              │
         ▼               ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FHIR Service Layer                        │
│  • Patient demographics    • Observation parsing            │
│  • LOINC code mapping      • Reference range validation     │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              FHIR R4 Server (HAPI FHIR)                     │
│  Resources: Patient, Observation, Encounter                 │
└─────────────────────────────────────────────────────────────┘
```

## FHIR Resources Used

| Resource | Purpose | Endpoint |
|----------|---------|----------|
| `Patient` | Demographics, identifiers | `GET /Patient/{id}` |
| `Observation` | Vital signs measurements | `GET /Observation?patient={id}&category=vital-signs` |

## LOINC Code Mappings

| LOINC Code | Vital Sign | Unit | Normal Range |
|------------|------------|------|--------------|
| 8867-4 | Heart Rate | bpm | 60-100 |
| 2708-6 | Oxygen Saturation (SpO₂) | % | 95-100 |
| 8310-5 | Body Temperature | °C | 36.5-37.5 |
| 9279-1 | Respiratory Rate | /min | 12-20 |
| 85354-9 | Blood Pressure Panel | mmHg | <120/80 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/mohammadkhalaf262002-blip/fhir-patient-dashboard.git
cd fhir-patient-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

1. Open `http://localhost:5173` in your browser
2. Use the search bar to find patients (try "Smith", "John", or "Maria")
3. Select a patient to load their FHIR data
4. Vitals update in real-time with clinical status indicators

### Configuration

To connect to a different FHIR server, update the base URL in the Dashboard component:

```javascript
const FHIR_BASE = 'https://your-fhir-server.com/fhir/R4';
```

## Project Structure

```
src/
├── components/
│   └── Dashboard.jsx        # Main dashboard with FHIR integration
├── main.jsx                 # React entry point
├── App.jsx                  # App wrapper
└── index.css                # Tailwind styles
```

## Roadmap

- [ ] **SMART on FHIR Auth** — OAuth 2.0 for EHR integration
- [ ] **Additional Resources** — Condition (diagnoses), MedicationRequest, Encounter
- [ ] **FHIR Subscriptions** — WebSocket-based real-time updates
- [ ] **CDS Hooks** — Clinical decision support integration
- [ ] **Offline Support** — IndexedDB caching for intermittent connectivity

## Healthcare Standards Reference

- [HL7 FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [LOINC Database](https://loinc.org/)
- [SMART on FHIR](https://docs.smarthealthit.org/)
- [US Core Implementation Guide](https://www.hl7.org/fhir/us/core/)

## Disclaimer

This project is for educational and demonstration purposes. It is not intended for clinical use. Always consult qualified healthcare professionals for medical decisions.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

**Mohammad Khalaf** — Biomedical Engineer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mohammad-khalaf-b80273261/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mohammadkhalaf262002-blip)

---

*Built to demonstrate healthcare interoperability skills and FHIR integration patterns.*
