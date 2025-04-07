import React from 'react'; // Add React import for JSX icons

// PCI color scheme
const colors = {
  primary: '#004B87',     // Dark Blue
  secondary: '#81C341',   // Green
  accent: '#F47920',      // Orange
  light: '#E6EEF4',       // Light Blue
  dark: '#002D56',        // Very Dark Blue
  gray: '#707070',        // Gray
  lightGray: '#F1F1F1',   // Light Gray
  white: '#FFFFFF',       // White
};

// Import icons needed for roles data
import { UserCircle, Users, Clipboard, ClipboardCheck, AlertCircle, Beaker } from 'lucide-react';

// Full roles data
const roles = {
  director: {
    title: "Quality Director",
    icon: <UserCircle size={24} />,
    responsibilities: [
      "Strategic quality leadership for entire focus factory",
      "Final approval for critical quality decisions",
      "Leadership-level client relationship management",
      "Budget and resource management",
      "Direct supervision of 4 reports (3 QMs + Systems Lead)"
    ],
    detailedResponsibilities: {
        "Strategic Leadership": [
          "Define quality vision and strategy for the focus factory",
          "Establish quality objectives aligned with business goals",
          "Implement continuous improvement initiatives",
          "Drive quality culture throughout organization",
          "Interface with senior client leadership"
        ],
        "Quality Oversight": [
          "Final approval of major deviations and CAPAs",
          "Review and approval of validation protocols/reports",
          "Oversight of quality metrics and trending",
          "Management of critical quality events",
          "Strategic input on regulatory submissions"
        ],
        "Client Management": [
          "Represent quality in high-level client meetings",
          "Lead escalation discussions with client quality leaders",
          "Review and approve quality agreements",
          "Participate in strategic client planning sessions",
          "Handle executive-level quality communications"
        ],
        "Resource Management": [
          "Develop and manage quality department budget",
          "Strategic resource allocation across client teams",
          "Performance management of direct reports",
          "Long-term capacity planning",
          "Career development of quality leadership team"
        ]
    },
    kpis: [
      "Focus Factory Quality Scorecard Performance",
      "Major Deviation Reduction Rate",
      "Client Audit Success Rate",
      "Team Performance/Development Goals"
    ],
    skills: [
      "Strategic Quality Planning",
      "Regulatory Compliance (FDA, EMA)",
      "Risk Management",
      "Budget Management",
      "Leadership & Mentoring"
    ],
    nextRoles: ['execDirector'],
    color: colors.primary,
    salary: "$150,000 - $180,000",
    department: "Quality"
  },
  systemsLead: {
    title: "Quality Systems Lead",
    icon: <ClipboardCheck size={24} />,
    responsibilities: [
        "Maintain quality management system architecture",
        "Develop and maintain centralized metrics dashboards",
        "Establish standardized training requirements and materials",
        "Provide technical systems support for all teams",
        "Analyze organization-wide quality trends",
        "Support onboarding with standard quality systems training"
    ],
    detailedResponsibilities: {
        "Quality System Management": [
          "Administer MasterControl EQMS configuration",
          "Develop and update quality system procedures",
          "Maintain document hierarchies and templates",
          "Drive system improvements and upgrades",
          "Ensure alignment with regulatory requirements"
        ],
        "Metrics & Analytics": [
          "Design quality KPIs for all client teams",
          "Create and maintain Power BI dashboards",
          "Generate monthly quality metrics packages",
          "Identify adverse trends across quality data",
          "Recommend improvements based on data analysis"
        ],
        "Training System Management": [
          "Establish training curricula for quality roles",
          "Develop standard training materials",
          "Maintain training requirements matrix",
          "Track training completion and effectiveness",
          "Support new employee onboarding processes"
        ],
        "System Support": [
          "Troubleshoot quality system issues",
          "Interface between quality and IT departments",
          "Research and recommend technology solutions",
          "Provide support for system audits",
          "Train staff on system use and requirements"
        ]
    },
    kpis: [
      "EQMS Uptime/Availability",
      "Training Compliance Rate",
      "Metrics Dashboard Accuracy/Timeliness",
      "System Audit Finding Rate"
    ],
    skills: [
      "Quality Systems (e.g., MasterControl)",
      "Data Analytics & Visualization (e.g., Power BI)",
      "Technical Writing",
      "Project Management",
      "Training Development"
    ],
    nextRoles: ['director', 'itManager'],
    color: colors.primary,
    salary: "$90,000 - $105,000",
    department: "Quality"
  },
  qualityManager: {
    title: "Quality Manager",
    icon: <Users size={24} />,
    responsibilities: [ /* ... */ ],
    detailedResponsibilities: { /* ... */ },
    kpis: ['Team Deviation Rate', 'Client Satisfaction Score', 'CAPA Effectiveness'],
    skills: ['Team Leadership', 'Client Communication', 'QMS Expertise', 'Problem Solving'],
    nextRoles: ['director'],
    color: colors.primary,
    salary: "$126,000 - $158,000",
    department: "Quality"
  },
  seniorSpecialist: {
    title: "Senior Quality Specialist",
    icon: <Clipboard size={24} />,
    responsibilities: [ /* ... */ ],
    detailedResponsibilities: { /* ... */ },
    kpis: ['Batch Record Review Timeliness', 'Minor Deviation Closure Rate'],
    skills: ['Batch Record Review', 'Deviation Handling', 'Client Interaction'],
    nextRoles: ['qualityManager', 'systemsLead'],
    color: colors.primary,
    salary: "$90,000 - $110,000",
    department: "Quality"
  },
  qualitySpecialist: {
    title: "Quality Specialist",
    icon: <Clipboard size={24} />,
    responsibilities: [ /* ... */ ],
    detailedResponsibilities: { /* ... */ },
    kpis: [],
    skills: ['Batch Record Review', 'GMP Documentation'],
    nextRoles: ['seniorSpecialist', 'complaintsSpecialist'],
    color: colors.primary,
    salary: "$65,000 - $80,000",
    department: "Quality"
  },
  complaintsSpecialist: {
    title: "Complaints Specialist",
    icon: <Clipboard size={24} />,
    responsibilities: [ /* ... */ ],
    detailedResponsibilities: { /* ... */ },
    kpis: [],
    skills: ['Complaint Handling', 'Investigation Skills'],
    nextRoles: ['seniorSpecialist', 'qualityManager'],
    color: colors.primary,
    salary: "$70,000 - $85,000",
    department: "Quality"
  },
  associateSpecialist: {
    title: "Associate QA Specialist",
    icon: <Clipboard size={24} />,
    responsibilities: [ /* ... */ ],
    detailedResponsibilities: { /* ... */ },
    kpis: [],
    skills: ['Basic GMP', 'Documentation Assistance'],
    nextRoles: ['qualitySpecialist'],
    color: colors.primary,
    salary: "$55,000 - $70,000",
    department: "Quality"
  },
  offshiftAssociate: {
    title: "Off-Shift Associate QA",
    icon: <Clipboard size={24} />,
    responsibilities: [ /* ... */ ],
    detailedResponsibilities: { /* ... */ },
    kpis: [],
    skills: ['Basic GMP', 'Shift Coordination'],
    nextRoles: ['qualitySpecialist'],
    color: colors.primary,
    salary: "$60,000 - $75,000",
    department: "Quality"
  },
  labManager: {
    title: "Lab Manager",
    icon: <Beaker size={24} />,
    responsibilities: [ /* ... */ ],
    detailedResponsibilities: { /* ... */ },
    kpis: ['Lab Turnaround Time', 'OOS Rate', 'Lab Compliance'],
    skills: ['Lab Management', 'Analytical Techniques', 'Method Validation'],
    nextRoles: ['director'],
    color: colors.secondary,
    salary: "$110,000 - $130,000",
    department: "Testing"
  },
  seniorLabTechnician: {
    title: "Senior Lab Technician",
    icon: <Beaker size={24} />,
    responsibilities: [ /* ... */ ],
    detailedResponsibilities: { /* ... */ },
    kpis: [],
    skills: ['Advanced Analytical Techniques', 'Troubleshooting', 'Mentoring'],
    nextRoles: ['labManager'],
    color: colors.secondary,
    salary: "$70,000 - $85,000",
    department: "Testing"
  },
  labTechnician: {
    title: "Lab Technician",
    icon: <Beaker size={24} />,
    responsibilities: [ /* ... */ ],
    detailedResponsibilities: { /* ... */ },
    kpis: [],
    skills: ['Routine Testing', 'Equipment Calibration'],
    nextRoles: ['seniorLabTechnician'],
    color: colors.secondary,
    salary: "$55,000 - $70,000",
    department: "Testing"
  },
  associateLabTechnician: {
    title: "Associate Lab Technician",
    icon: <Beaker size={24} />,
    responsibilities: [ /* ... */ ],
    detailedResponsibilities: { /* ... */ },
    kpis: [],
    skills: ['Sample Prep', 'Basic Lab Operations'],
    nextRoles: ['labTechnician'],
    color: colors.secondary,
    salary: "$45,000 - $55,000",
    department: "Testing"
  }
};

// Full implementation timeline data
const timelineData = [
  {
    id: 'phase1',
    title: 'Phase 1: Planning & Preparation',
    description: 'Month 1 (April) - Finalize organization structure and job descriptions, develop transition plan, identify training needs, create communication plan, prepare transition documentation.'
  },
  {
    id: 'phase2',
    title: 'Phase 2: Initial Implementation',
    description: 'Month 2 (May 1st Deadline) - Transition existing staff to new roles, fill critical open positions, conduct initial training, implement new client team structure, establish metrics dashboards.'
  },
  {
    id: 'phase3',
    title: 'Phase 3: Rollout & Stabilization',
    description: 'Months 5-6 - Complete training and onboarding, implement new shift coverage model, standardize client communication processes, launch quality metrics tracking, validate new quality workflows.'
  },
  {
    id: 'phase4',
    title: 'Phase 4: Optimization',
    description: 'Months 7-9 - Review and refine organization based on feedback, develop advanced training, optimize client-specific processes, implement continuous improvement initiatives, conduct post-implementation assessment.'
  }
];

// Full implementation timeline data (Original version, if needed)
const timelineInitialData = [ /* ... same as timelineData or different? */ ];

// NEW: Initial Budget Data (Multi-Factory Structure)
const initialBudgetData = {
  factoryA: {
    name: "Factory A (Client X)",
    personnelCosts: {
      leadership: { 
        title: "Leadership", 
        roles: [
            { title: "Quality Director", count: 1, costRange: "$150,000 - $180,000" },
            { title: "Quality Managers", count: 1, costRange: "$126,000 - $158,000" }, // Adapted count
            { title: "Quality Systems Lead", count: 1, costRange: "$90,000 - $105,000" },
            { title: "Lab Manager", count: 1, costRange: "$110,000 - $130,000" } // Updated range from roles data
        ], 
        subtotal: { count: 4, costRange: "$476,000 - $573,000" } // Recalculated approx
      },
      specialists: { 
        title: "Specialists", 
        roles: [
            { title: "Senior Quality Specialists", count: 2, costRange: "$180,000 - $220,000" }, // Adapted count
            { title: "Quality Specialists", count: 3, costRange: "$195,000 - $240,000" }, // Adapted count
            { title: "Quality Specialists, Complaints", count: 2, costRange: "$140,000 - $170,000" }, // Adapted count
            { title: "Senior Lab Technicians", count: 1, costRange: "$70,000 - $85,000" } // Adapted count
        ], 
        subtotal: { count: 8, costRange: "$585,000 - $715,000" } // Recalculated approx
      },
      associates: { 
        title: "Associates", 
        roles: [
            { title: "Associate QA Specialists (Day)", count: 3, costRange: "$165,000 - $210,000" }, // Adapted count
            { title: "Associate QA Specialists (Night)", count: 1, costRange: "$55,000 - $70,000" }, // Adapted count
            { title: "Lab Technicians", count: 2, costRange: "$110,000 - $140,000" }, // Adapted count
            { title: "Associate Lab Technicians", count: 1, costRange: "$45,000 - $55,000" } // Adapted count
        ], 
        subtotal: { count: 7, costRange: "$375,000 - $475,000" } // Recalculated approx
      },
      // Add total personnel calculation later if needed
    },
    operationalExpenses: [
      { category: "Materials", amount: 500000 },
      { category: "Utilities", amount: 150000 },
      { category: "Maintenance", amount: 100000 },
      { category: "Other", amount: 50000 },
    ],
    productionVolume: 1000000, // Units per period (e.g., year)
    // Add overall total calculation later
  },
  factoryB: {
    name: "Factory B (Client Y & Z)",
    personnelCosts: {
      leadership: { 
        title: "Leadership", 
        roles: [
          { title: "Quality Director", count: 1, costRange: "$150,000 - $180,000" },
          { title: "Quality Managers", count: 2, costRange: "$252,000 - $316,000" }, // Adjusted count/cost
          // No Systems Lead or Lab Manager assumed for Factory B
        ], 
        subtotal: { count: 3, costRange: "$402,000 - $496,000" } 
      },
      specialists: { 
         title: "Specialists", 
         roles: [
          { title: "Senior Quality Specialists", count: 4, costRange: "$360,000 - $440,000" },
          { title: "Quality Specialists", count: 6, costRange: "$420,000 - $510,000" }, 
        ], 
        subtotal: { count: 10, costRange: "$780,000 - $950,000" } 
       },
      associates: { 
         title: "Associates", 
         roles: [
            { title: "Associate QA Specialists", count: 5, costRange: "$275,000 - $350,000" },
          ], 
        subtotal: { count: 5, costRange: "$275,000 - $350,000" } 
      },
    },
    operationalExpenses: [
      { category: "Materials", amount: 750000 },
      { category: "Utilities", amount: 200000 },
      { category: "Maintenance", amount: 120000 },
       { category: "Other", amount: 75000 },
    ],
    productionVolume: 1500000, 
  }
};

// NEW: Workload Analysis Constants
const PRODUCTIVITY_METRICS = {
  clientA_batchReview: 50, // 50 WOs per Specialist per Month
  clientA_release: 100,    // 100 WOs per Sr. Specialist per Month
  clientB_complaints: 30, // 30 WOs per Complaints Specialist per Month
  // Add more metrics as needed for different roles/tasks/clients
};

const ROLE_TASK_MAPPING = {
  qualitySpecialist: ['clientA_batchReview'], 
  seniorSpecialist: ['clientA_release'],
  complaintsSpecialist: ['clientB_complaints'],
  // ... map other roles to relevant task metrics
};

// Update exports - ensure all needed variables are defined and exported
export { 
    timelineData, 
    colors, 
    roles, 
    timelineInitialData, 
    initialBudgetData, 
    PRODUCTIVITY_METRICS, 
    ROLE_TASK_MAPPING 
}; 