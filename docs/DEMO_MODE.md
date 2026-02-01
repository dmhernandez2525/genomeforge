# Demo Mode

GenomeForge includes a demo mode that allows users to explore the platform without uploading their own genetic data. This is particularly useful for:

- **Portfolio demonstrations**: Showcase the application to potential employers or clients
- **User exploration**: Let prospective users try the platform before committing
- **Testing**: Verify UI/UX without real data dependencies

## How It Works

### Architecture

```
Landing Page
    |
    v
Demo Mode Check (VITE_DEMO_MODE)
    |
    +-- DEMO_MODE=false --> Normal Flow (Upload genome file)
    |
    +-- DEMO_MODE=true  --> Demo Role Selector
                                |
                                v
                          Demo Experience
                          (Pre-loaded mock data)
```

### Environment Variable

Demo mode is controlled by the `VITE_DEMO_MODE` environment variable:

```env
# Enable demo mode
VITE_DEMO_MODE=true

# Disable demo mode (production with real data)
VITE_DEMO_MODE=false
```

## Demo Roles

GenomeForge provides two demo roles with different access levels:

### 1. Researcher (Dr. Sarah Chen)

- **Description**: Genetic researcher with full access to detailed analysis tools
- **Features**:
  - Full analysis capabilities
  - Raw data export
  - Detailed variant annotations
  - Research tools
  - API access simulation

### 2. Patient (Alex Morgan)

- **Description**: Patient viewing their own genetic analysis with simplified insights
- **Features**:
  - Health insights
  - Drug interaction summaries
  - Risk reports
  - Actionable recommendations

## Demo Data

The demo mode includes realistic but entirely fictional genetic data:

### Mock Genome

- **Format**: 23andMe v5 (simulated)
- **Build**: GRCh38
- **Variants**: 30+ clinically relevant SNPs

### Included Variants

| Category | Examples |
|----------|----------|
| Pharmacogenomics | CYP2D6, CYP2C19, SLCO1B1, VKORC1 |
| Disease Risk | APOE (Alzheimer's), MTHFR, Factor V Leiden |
| Traits | FTO (BMI), ACTN3 (athletic performance), LCT (lactose) |
| Cancer Genes | BRCA1, BRCA2 (benign variants) |

### Mock Analysis Results

- **Match Results**: Pre-computed variant annotations
- **Drug Interactions**: 4 pharmacogenomic findings
- **GWAS Associations**: 5 trait associations
- **Polygenic Risk Scores**: 3 calculated PRS

## Implementation Details

### Files

```
apps/web/src/
  contexts/
    DemoContext.tsx      # React context for demo state
  components/
    DemoRoleSelector.tsx # Role selection UI
    DemoModeBanner.tsx   # Active demo indicator
  lib/
    demo-data.ts         # Mock genomic data
```

### Context API

```tsx
import { useDemoContext } from '../contexts/DemoContext';

function MyComponent() {
  const {
    isDemoMode,        // Is demo mode enabled?
    isDemoActive,      // Is a demo role selected?
    currentDemoUser,   // Current demo user info
    activateDemo,      // Select a demo role
    deactivateDemo,    // Exit demo mode
    hasFeatureAccess,  // Check role-based feature access
  } = useDemoContext();

  // ...
}
```

### Feature Access

```tsx
const { hasFeatureAccess } = useDemoContext();

// Check if current role has access to a feature
if (hasFeatureAccess('raw_data_export')) {
  // Show export button
}
```

Available features:
- `raw_data_export`
- `detailed_annotations`
- `research_tools`
- `batch_analysis`
- `api_access`

## Local Development

### Enable Demo Mode

```bash
VITE_DEMO_MODE=true pnpm dev
```

### Disable Demo Mode

```bash
pnpm dev
# or explicitly:
VITE_DEMO_MODE=false pnpm dev
```

### Testing Without Dependencies

Demo mode allows testing the full UI without:
- Real genome files
- Database connections
- AI API keys

```bash
# Run with only demo mode, no other dependencies
VITE_DEMO_MODE=true pnpm dev
```

## Production Deployment

For portfolio/demo deployments on Render:

```yaml
# render.yaml
services:
  - type: web
    runtime: static
    name: genomeforge-site
    envVars:
      - key: VITE_DEMO_MODE
        value: "true"
```

For production deployments where users upload real data:

```yaml
envVars:
  - key: VITE_DEMO_MODE
    value: "false"
```

## Session Persistence

Demo sessions are persisted in `sessionStorage`:
- Role selection survives page refreshes
- Cleared when browser tab is closed
- Can be manually cleared via "Exit Demo" button

## Medical Disclaimer

The demo data is entirely fictional and for demonstration purposes only. It should not be used for:
- Medical diagnosis
- Treatment decisions
- Health advice

The same disclaimers that apply to real analysis results apply to demo results.
