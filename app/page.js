'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { ChevronDown, ChevronUp, UserCircle, Users, Clipboard, ClipboardCheck, AlertCircle,
         BarChart, Calendar, DollarSign, Home, Beaker, UserPlus, XCircle, Move, Save, Trash2 } from 'lucide-react';
import { db, auth, setupAuthObserver } from '../firebase/config'; // Removed isAdmin import, will check dynamically
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc, addDoc, writeBatch } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Timeline data
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

// Full roles data (ensure detailedResponsibilities are complete)
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
    color: colors.light,
    salary: "$150,000 - $180,000", // Updated from previous $1M
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
    color: colors.light,
    salary: "$90,000 - $105,000",
    department: "Quality"
  },
  qualityManager: {
    title: "Quality Manager",
    icon: <Users size={24} />,
    responsibilities: [
        "Oversee two client accounts",
        "Approve major deviations/complaints",
        "Lead client meetings and manage escalations",
        "Coach team members and manage their development",
        "Review and approve complex quality documents",
        "Manage OJT program for their teams",
        "Generate and analyze client-specific metrics"
    ],
    detailedResponsibilities: {
        "Client Account Management": [
          "Serve as primary quality contact for 2 client accounts",
          "Manage client quality expectations and deliverables",
          "Lead regular client quality review meetings",
          "Coordinate client audits and inspections",
          "Ensure client-specific requirements are met"
        ],
        "Quality Oversight": [
          "Review and approve significant deviations",
          "Approve CAPAs and effectiveness checks",
          "Oversee complaint investigations and responses",
          "Conduct periodic quality system reviews",
          "Ensure compliance with quality agreements"
        ],
        "Team Management": [
          "Supervise 8-10 quality professionals",
          "Conduct performance reviews and development planning",
          "Manage team workload and assignments",
          "Coach staff on technical and soft skills",
          "Ensure adequate training and qualification"
        ],
        "OJT Management": [
          "Oversee OJT program implementation",
          "Track completion and certification status",
          "Verify staff competency for assigned tasks",
          "Identify and address training gaps",
          "Ensure consistency in quality practices"
        ],
        "Client-Specific Metrics": [
          "Review and analyze client quality data",
          "Present metrics in client meetings",
          "Identify opportunities for improvement",
          "Drive corrective actions based on trends",
          "Report quality performance to leadership"
        ]
    },
    color: colors.light,
    salary: "$126,000 - $158,000",
    department: "Quality"
  },
  seniorSpecialist: {
    title: "Senior Quality Specialist",
    icon: <Clipboard size={24} />,
    responsibilities: [
        "Primary client-facing quality representative",
        "Review complex batch records",
        "Approve minor deviations",
        "Lead continuous improvement initiatives",
        "Participate in client audits",
        "Provide technical guidance to quality specialists",
        "Coordinate between day and night shifts"
    ],
    detailedResponsibilities: {
        "Client Interaction": [
          "Represent quality in routine client meetings",
          "Communicate quality event information to client",
          "Respond to client technical inquiries",
          "Present quality data and trending",
          "Support client change management activities"
        ],
        "Batch Record Review": [
          "Final review of complex batch records",
          "Resolution of batch record discrepancies",
          "Approval of completed batch documentation",
          "Identification of documentation improvements",
          "Determination of batch disposition"
        ],
        "Quality Event Management": [
          "Approve minor deviations and discrepancies",
          "Conduct technical reviews of investigations",
          "Approve level 1 CAPAs and effectiveness checks",
          "Monitor implementation of corrective actions",
          "Track recurring quality events"
        ],
        "Continuous Improvement": [
          "Identify process improvement opportunities",
          "Lead quality improvement initiatives",
          "Coordinate cross-functional improvements",
          "Implement best practices from other clients",
          "Track effectiveness of improvement projects"
        ],
        "Team Leadership": [
          "Provide technical guidance to specialists",
          "Serve as shift lead for day operations",
          "Train new quality team members",
          "Coordinate with night shift associates",
          "Serve as backup for Quality Manager"
        ]
    },
    color: colors.light,
    salary: "$90,000 - $110,000",
    department: "Quality"
  },
  qualitySpecialist: {
    title: "Quality Specialist",
    icon: <Clipboard size={24} />,
    responsibilities: [
        "Review batch records",
        "Document minor events/deviations",
        "Process batch record updates",
        "Implement continuous improvements",
        "Support client calls",
        "Provide technical support to production",
        "Monitor in-process quality criteria"
    ],
    detailedResponsibilities: {
        "Batch Record Processing": [
          "Perform detailed batch record reviews",
          "Identify and document batch record discrepancies",
          "Verify critical processing parameters",
          "Ensure compliance with established procedures",
          "Compile batch history documentation"
        ],
        "Event Documentation": [
          "Document minor deviations and events",
          "Conduct initial investigation of quality events",
          "Draft responses to quality observations",
          "Track event closure and due dates",
          "Prepare event summaries for trending"
        ],
        "Document Management": [
          "Process updates to batch records",
          "Review and comment on SOP drafts",
          "Maintain client-specific document matrices",
          "Verify document accuracy and completeness",
          "Support document change control process"
        ],
        "Production Support": [
          "Provide quality guidance to production staff",
          "Perform in-process quality checks",
          "Support line clearance activities",
          "Verify critical processing steps",
          "Monitor production quality in real-time"
        ],
        "Client Support": [
          "Participate in routine client calls",
          "Provide quality data for client reports",
          "Support client audit preparations",
          "Respond to routine client questions",
          "Document client-specific requirements"
        ]
    },
    color: colors.light,
    salary: "$70,000 - $85,000",
    department: "Quality"
  },
  complaintsSpecialist: {
    title: "Quality Specialist, Complaints",
    icon: <AlertCircle size={24} />,
    responsibilities: [
        "Manage complaint intake and documentation",
        "Perform complaint investigations",
        "Coordinate resolution activities",
        "Draft client responses",
        "Implement complaint-related CAPAs",
        "Track complaint metrics and trends",
        "Interface with clients on complaint status"
    ],
    detailedResponsibilities: {
        "Complaint Intake": [
          "Receive and document client complaints",
          "Perform initial assessment of complaint severity",
          "Assign complaint classification and categories",
          "Determine regulatory reporting requirements",
          "Initialize complaint tracking in MasterControl"
        ],
        "Investigation Management": [
          "Develop complaint investigation plan",
          "Coordinate cross-functional investigation team",
          "Analyze product samples and returned materials",
          "Document investigation findings",
          "Determine root cause of complaint"
        ],
        "Risk Assessment": [
          "Evaluate health hazard implications",
          "Assess potential for similar occurrences",
          "Determine if field action is warranted",
          "Document risk evaluation findings",
          "Coordinate with regulatory when needed"
        ],
        "Client Communication": [
          "Draft formal responses to client complaints",
          "Provide regular status updates to clients",
          "Present investigation findings to client",
          "Address client follow-up questions",
          "Coordinate complaint closure with client"
        ],
        "CAPA Implementation": [
          "Develop CAPAs based on investigations",
          "Track implementation of corrective actions",
          "Verify effectiveness of implemented actions",
          "Document CAPA closure evidence",
          "Trend similar complaints for systemic issues"
        ]
    },
    color: colors.light,
    salary: "$70,000 - $85,000",
    department: "Quality"
  },
  associateSpecialist: {
    title: "Associate Quality Specialist",
    icon: <Clipboard size={24} />,
    responsibilities: [
        "Generate batch records",
        "Perform initial batch record reviews",
        "Maintain quality documentation",
        "Support quality data collection",
        "Assist with basic investigations",
        "Document quality observations",
        "Support floor operations as needed"
    ],
    detailedResponsibilities: {
        "Batch Record Generation": [
          "Create batch records for production runs",
          "Ensure correct template and revision is used",
          "Populate batch-specific information",
          "Verify completeness of batch documentation",
          "Stage batch records for production use"
        ],
        "Documentation Review": [
          "Perform initial batch record reviews",
          "Flag discrepancies for specialist review",
          "Verify completeness of documentation",
          "Check data entry and calculations",
          "Organize batch documentation packages"
        ],
        "Data Collection": [
          "Gather quality data for metrics reporting",
          "Compile batch release information",
          "Document in-process quality checks",
          "Maintain monitoring logs and records",
          "Support data entry in quality systems"
        ],
        "Quality Support": [
          "Assist with basic investigations",
          "Support floor quality audits",
          "Document quality observations",
          "Participate in quality event documentation",
          "Provide administrative support to quality team"
        ]
    },
    color: colors.light,
    salary: "$55,000 - $70,000",
    department: "Quality"
  },
  offshiftAssociate: {
    title: "Associate Quality Specialist (Off-Shift)",
    icon: <Clipboard size={24} />,
    responsibilities: [
        "Cover all clients during night shifts",
        "Respond to production quality issues",
        "Perform critical in-process checks",
        "Document quality observations",
        "Escalate issues to day shift",
        "Support manufacturing operations",
        "Ensure compliance to procedures during night production"
    ],
    detailedResponsibilities: {
        "Shift Coverage": [
          "Provide quality coverage across all production areas",
          "Monitor 12-hour night shift operations",
          "Cover multiple client productions simultaneously",
          "Maintain communication with production leads",
          "Support weekend operations as scheduled"
        ],
        "Quality Monitoring": [
          "Perform critical in-process quality checks",
          "Verify compliance to manufacturing procedures",
          "Document quality observations in real-time",
          "Monitor environmental conditions",
          "Perform line clearance verifications"
        ],
        "Event Response": [
          "Respond to quality events during off-hours",
          "Document deviations and discrepancies",
          "Initiate containment actions when needed",
          "Escalate critical issues to on-call personnel",
          "Provide initial assessment of quality impact"
        ],
        "Documentation": [
          "Complete quality check documentation",
          "Verify batch record entries for shift activities",
          "Document manufacturing observations",
          "Prepare shift handover reports",
          "Maintain equipment monitoring logs"
        ],
        "Cross-Client Support": [
          "Apply knowledge across multiple client products",
          "Adapt to different client requirements",
          "Prioritize quality events across clients",
          "Navigate various client documentation",
          "Support multiple production lines simultaneously"
        ]
    },
    color: colors.light,
    salary: "$55,000 - $70,000 (plus shift differential)",
    department: "Quality"
  },
  labManager: {
    title: "Lab Manager",
    icon: <Beaker size={24} />,
    responsibilities: [
        "Oversee functional testing laboratory operations",
        "Manage testing equipment and calibration schedules",
        "Develop and maintain testing protocols",
        "Supervise lab personnel and assign workload",
        "Review and approve test results and reports",
        "Coordinate with clients on test requirements",
        "Ensure compliance with quality standards"
    ],
    detailedResponsibilities: {
        "Lab Operations": [
          "Oversee day-to-day laboratory activities",
          "Establish testing priorities and schedules",
          "Manage lab budget and resources",
          "Ensure lab safety and compliance",
          "Implement laboratory efficiency improvements"
        ],
        "Equipment Management": [
          "Maintain Zwick and Instron testing equipment",
          "Schedule equipment calibration and maintenance",
          "Qualify new testing equipment",
          "Troubleshoot equipment issues",
          "Maintain equipment qualification documentation"
        ],
        "Protocol Development": [
          "Create client-specific testing protocols",
          "Validate test methods for autoinjector products",
          "Develop technical procedures for lab operations",
          "Review and update testing procedures",
          "Establish testing acceptance criteria"
        ],
        "Personnel Management": [
          "Supervise lab technicians and specialists",
          "Conduct performance evaluations",
          "Coordinate training and development",
          "Assign projects and testing activities",
          "Manage workload distribution"
        ],
        "Quality Oversight": [
          "Review and approve test reports",
          "Ensure data integrity in testing activities",
          "Investigate out-of-specification results",
          "Implement corrective actions for lab issues",
          "Prepare for lab audits and inspections"
        ]
    },
    color: colors.light,
    salary: "$95,000 - $120,000",
    department: "Testing"
  },
  seniorLabTechnician: {
    title: "Senior Lab Technician",
    icon: <Beaker size={24} />,
    responsibilities: [
        "Perform complex functional testing on autoinjectors",
        "Analyze test data and prepare technical reports",
        "Calibrate and maintain testing equipment",
        "Train and mentor junior technicians",
        "Investigate testing anomalies and discrepancies",
        "Develop and optimize testing methodologies",
        "Support test protocol development"
    ],
    detailedResponsibilities: {
        "Advanced Testing": [
          "Conduct specialized testing on autoinjectors",
          "Perform complex force profile analysis on Zwick/Instron",
          "Execute method transfers and validations",
          "Conduct stability testing evaluations",
          "Perform product complaint investigations"
        ],
        "Data Analysis": [
          "Perform statistical analysis of test data",
          "Prepare comprehensive test reports",
          "Evaluate trends in test results",
          "Document test observations and anomalies",
          "Present testing results to clients and management"
        ],
        "Equipment Expertise": [
          "Serve as subject matter expert for testing equipment",
          "Calibrate Zwick and Instron testing machines",
          "Troubleshoot and resolve equipment issues",
          "Develop equipment operation procedures",
          "Train others on equipment operation"
        ],
        "Method Development": [
          "Optimize testing methods for efficiency",
          "Develop specialized test fixtures and tools",
          "Validate new testing approaches",
          "Support creation of testing standards",
          "Document testing procedures and methods"
        ],
        "Team Leadership": [
          "Provide technical guidance to lab technicians",
          "Train new lab personnel on testing procedures",
          "Review work of junior technicians",
          "Serve as backup for Lab Manager",
          "Lead technical projects within the lab"
        ]
    },
    color: colors.light,
    salary: "$75,000 - $90,000",
    department: "Testing"
  },
  labTechnician: {
    title: "Lab Technician",
    icon: <Beaker size={24} />,
    responsibilities: [
        "Conduct functional testing on autoinjectors using Zwick/Instron",
        "Record and document test results",
        "Prepare test samples and equipment",
        "Perform routine equipment maintenance",
        "Follow established testing protocols",
        "Document testing activities and observations",
        "Support laboratory operations"
    ],
    detailedResponsibilities: {
        "Functional Testing": [
          "Perform break-loose and extrusion force testing",
          "Conduct activation force measurements",
          "Test autoinjector needle extension",
          "Measure injection time and delivered volume",
          "Perform dose accuracy testing"
        ],
        "Data Recording": [
          "Document test results in laboratory systems",
          "Maintain accurate testing records",
          "Generate basic data reports",
          "Record equipment parameters",
          "Document test deviations"
        ],
        "Equipment Operation": [
          "Operate Zwick and Instron testing equipment",
          "Set up test fixtures and attachments",
          "Perform routine equipment calibration checks",
          "Clean and maintain testing equipment",
          "Report equipment malfunctions"
        ],
        "Sample Management": [
          "Prepare test samples according to protocols",
          "Track sample inventory and storage",
          "Document sample history and condition",
          "Handle samples according to procedures",
          "Dispose of samples properly after testing"
        ],
        "Laboratory Support": [
          "Maintain laboratory cleanliness and organization",
          "Inventory and order laboratory supplies",
          "Support laboratory documentation system",
          "Assist with equipment qualification activities",
          "Support laboratory audits and inspections"
        ]
    },
    color: colors.light,
    salary: "$55,000 - $70,000",
    department: "Testing"
  },
  associateLabTechnician: {
    title: "Associate Lab Technician",
    icon: <Beaker size={24} />,
    responsibilities: [
        "Assist with basic functional testing procedures",
        "Prepare test samples and equipment setup",
        "Record test data under supervision",
        "Maintain laboratory cleanliness and organization",
        "Support inventory management",
        "Perform basic equipment maintenance",
        "Assist senior lab personnel as needed"
    ],
    detailedResponsibilities: {
        "Testing Support": [
          "Assist with autoinjector testing procedures",
          "Set up basic test equipment under supervision",
          "Record data during testing activities",
          "Follow established testing workflows",
          "Support sample preparation activities"
        ],
        "Laboratory Maintenance": [
          "Clean and organize laboratory workspaces",
          "Maintain testing fixtures and tools",
          "Clean equipment after use",
          "Dispose of waste according to procedures",
          "Restock laboratory supplies"
        ],
        "Data Entry": [
          "Enter test data into laboratory systems",
          "Assist with organizing test documentation",
          "File testing records and reports",
          "Maintain basic testing logs",
          "Support data verification activities"
        ],
        "Equipment Care": [
          "Perform basic maintenance on lab equipment",
          "Clean testing components and fixtures",
          "Check equipment supplies and consumables",
          "Report equipment issues to senior staff",
          "Organize equipment accessories and parts"
        ],
        "General Support": [
          "Assist with sample receipt and processing",
          "Support inventory checks and ordering",
          "Help with laboratory administrative tasks",
          "Prepare materials for testing activities",
          "Assist with training documentation"
        ]
    },
    color: colors.light,
    salary: "$45,000 - $55,000",
    department: "Testing"
  }
};

// Full implementation timeline data (ensure activities are complete)
const timelineInitialData = [
  { id: 'phase1', phase: "Phase 1: Planning & Preparation", timeframe: "Month 1 (April)", 
    activities: [
        "Finalize organization structure and job descriptions",
        "Develop transition plan for existing staff",
        "Identify training needs and create development plans",
        "Create communication plan for clients and internal stakeholders",
        "Prepare transition documentation"
    ]
  },
  { id: 'phase2', phase: "Phase 2: Initial Implementation", timeframe: "Month 2 (May 1st Deadline)", 
    activities: [
        "Transition existing staff to new roles and responsibilities",
        "Fill critical open positions",
        "Conduct initial training for all team members",
        "Implement new client team structure",
        "Establish metrics dashboards and reporting"
    ]
  },
  { id: 'phase3', phase: "Phase 3: Rollout & Stabilization", timeframe: "Months 5-6", 
    activities: [
        "Complete training and onboarding for all staff",
        "Implement new shift coverage model",
        "Standardize client communication processes",
        "Launch all quality metrics tracking",
        "Validate new quality workflows"
    ]
  },
  { id: 'phase4', phase: "Phase 4: Optimization", timeframe: "Months 7-9", 
    activities: [
        "Review and refine organization based on initial feedback",
        "Develop advanced training for specialized roles",
        "Optimize client-specific processes",
        "Implement continuous improvement initiatives",
        "Conduct post-implementation assessment"
    ]
  }
];

// Full staffing summary data (ensure roles/subtotals are complete)
const staffingSummaryInitialData = {
  leadership: { 
    title: "Leadership", 
    roles: [
        { title: "Quality Director", count: 1, costRange: "$150,000 - $180,000" },
        { title: "Quality Managers", count: 3, costRange: "$378,000 - $474,000" },
        { title: "Quality Systems Lead", count: 1, costRange: "$90,000 - $105,000" },
        { title: "Lab Manager", count: 1, costRange: "$95,000 - $120,000" }
    ], 
    subtotal: { count: 6, costRange: "$713,000 - $879,000" } 
  },
  specialists: { 
    title: "Specialists", 
    roles: [
        { title: "Senior Quality Specialists", count: 6, costRange: "$540,000 - $660,000" },
        { title: "Quality Specialists", count: 8, costRange: "$560,000 - $680,000" },
        { title: "Quality Specialists, Complaints", count: 6, costRange: "$420,000 - $510,000" },
        { title: "Senior Lab Technicians", count: 2, costRange: "$150,000 - $180,000" }
    ], 
    subtotal: { count: 22, costRange: "$1,670,000 - $2,030,000" } 
  },
  associates: { 
    title: "Associates", 
    roles: [
        { title: "Associate QA Specialists (Day)", count: 6, costRange: "$330,000 - $420,000" },
        { title: "Associate QA Specialists (Night)", count: 3, costRange: "$165,000 - $210,000" },
        { title: "Lab Technicians", count: 4, costRange: "$220,000 - $280,000" },
        { title: "Associate Lab Technicians", count: 2, costRange: "$90,000 - $110,000" }
    ], 
    subtotal: { count: 15, costRange: "$805,000 - $1,020,000" } 
  },
  total: { count: 43, costRange: "$3,188,000 - $3,929,000" }
};

// Helper component for displaying a role card in the hierarchy
const RoleCardDisplay = ({ roleKey, roleData, personnel, isUserAdmin, expandedRoles, toggleRole, 
                           handleDragOver, handleDropOnRole, handleDragEnter, handleDragLeave, 
                           handleDragStart, handleDragEnd, handleTextClick, handleTextBlur, handleKeyDown, 
                           editText, editingId, unassignPerson }) => {

    const assigned = personnel.filter(p => p.assignedRole === roleKey);

    return (
        <div key={roleKey} className={`role-card role-card-${roleKey}`}> {/* Add roleKey specific class */}
            <div className="role-header" onClick={() => toggleRole(roleKey)}>
                <div className="role-header-title">
                    {roleData.icon}
                    <h3>{roleData.title}</h3>
                </div>
                <span>{expandedRoles[roleKey] ? <ChevronUp /> : <ChevronDown />}</span>
            </div>
            {expandedRoles[roleKey] && (
                <div
                    className="role-content drop-zone"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnRole(roleKey)}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                >
                    <h4>Responsibilities:</h4>
                    <ul>{roleData.responsibilities.map((resp, index) => <li key={index}>{resp}</li>)}</ul>
                    <div className="role-details">
                        <p><strong>Salary:</strong> {roleData.salary}</p>
                        <p><strong>Department:</strong> {roleData.department}</p>
                    </div>
                    <div className="assigned-personnel">
                        <h4>Assigned Personnel:</h4>
                        {assigned.map(person => (
                            <div key={person.id} className="assigned-person draggable"
                                draggable={isUserAdmin}
                                onDragStart={(e) => handleDragStart(e, person)}
                                onDragEnd={handleDragEnd}
                            >
                                <div
                                    data-edit-id={`person-${person.id}`}
                                    className="editable-text personnel-name"
                                    contentEditable={isUserAdmin}
                                    suppressContentEditableWarning={true}
                                    onMouseDown={(e) => { if (!isUserAdmin) e.preventDefault() }}
                                    onClick={() => isUserAdmin && handleTextClick(`person-${person.id}`, person.name)}
                                    onBlur={() => handleTextBlur(`person-${person.id}`)}
                                    onKeyDown={(e) => handleKeyDown(e, `person-${person.id}`)}
                                    onInput={handleTextChange} // Make sure handleTextChange is defined
                                >
                                    {editingId === `person-${person.id}` ? editText : person.name}
                                </div>
                                {isUserAdmin && (
                                    <button
                                        onClick={() => unassignPerson(person.id)}
                                        className="unassign-button"
                                        title="Unassign Role"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {assigned.length === 0 && (
                            <p className="empty-list-message">Drag available personnel here.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Main Dashboard component
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('structure');
  const [expandedRoles, setExpandedRoles] = useState({});
  const [personnel, setPersonnel] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [timeline, setTimeline] = useState([]);
  const [staffingSummary, setStaffingSummary] = useState({});

  const checkAdminStatus = async (uid) => {
    if (!uid) return false;
    try {
      const adminDoc = await getDoc(doc(db, 'admins', uid));
      return adminDoc.exists();
    } catch (err) {
      console.error("Error checking admin status:", err);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = setupAuthObserver(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const isAdmin = await checkAdminStatus(authUser.uid);
        setIsUserAdmin(isAdmin);
        if (!initialDataLoaded) {
            await loadAllData();
            setInitialDataLoaded(true);
        } else {
            setLoading(false);
        }
      } else {
        setIsUserAdmin(false);
        setPersonnel([]);
        setTimeline([]);
        setStaffingSummary({});
        setInitialDataLoaded(false);
        setLoading(false);
        setShowLoginModal(false);
        setLoginError('');
      }
    });
    return () => unsubscribe();
  }, [initialDataLoaded]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    console.log("Loading all data...");
    try {
      await Promise.all([
        loadPersonnel(),
        loadTimeline(),
        loadBudget()
      ]);
      console.log("Data loading complete.");
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load application data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const loadPersonnel = useCallback(async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'personnel'));
        const loadedPersonnel = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPersonnel(loadedPersonnel || []);
        console.log("Personnel loaded:", loadedPersonnel.length);
    } catch (err) {
        console.error("Error loading personnel:", err);
        setError(prev => prev ? prev + "\nFailed to load personnel." : "Failed to load personnel.");
    }
  }, []);

  const loadTimeline = useCallback(async () => {
    try {
        const docRef = doc(db, 'timeline', 'current');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTimeline(docSnap.data().phases || []);
        } else {
          await setDoc(docRef, { phases: timelineInitialData });
          setTimeline(timelineInitialData);
          console.log("Timeline document created.");
        }
        console.log("Timeline loaded:", timeline.length, "phases");
    } catch (err) {
        console.error("Error loading timeline:", err);
        setError(prev => prev ? prev + "\nFailed to load timeline." : "Failed to load timeline.");
    }
  }, []);

  const loadBudget = useCallback(async () => {
     try {
        const docRef = doc(db, 'budget', 'current');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStaffingSummary(docSnap.data().summary || {});
        } else {
          await setDoc(docRef, { summary: staffingSummaryInitialData });
          setStaffingSummary(staffingSummaryInitialData);
          console.log("Budget document created.");
        }
        console.log("Budget loaded:", Object.keys(staffingSummary).length, "categories");
    } catch (err) {
        console.error("Error loading budget:", err);
        setError(prev => prev ? prev + "\nFailed to load budget." : "Failed to load budget.");
    }
  }, []);

  const toggleRole = (roleId) => {
    setExpandedRoles(prev => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  const addNewPerson = async () => {
    if (!newPersonName.trim() || !isUserAdmin) return;
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'personnel'), {
        name: newPersonName.trim(),
        assignedRole: null,
        createdAt: new Date()
      });
      setPersonnel(prev => [...prev, { id: docRef.id, name: newPersonName.trim(), assignedRole: null, createdAt: new Date() }]);
      setNewPersonName('');
      setShowAddPersonModal(false);
    } catch (err) {
      setError('Failed to add new person.');
      console.error('Error adding person:', err);
    }
  };

  const removePerson = async (personId) => {
    if (!isUserAdmin) return;
    if (!confirm("Are you sure you want to permanently delete this person?")) return;
    setError(null);
    try {
      await deleteDoc(doc(db, 'personnel', personId));
      setPersonnel(prev => prev.filter(p => p.id !== personId));
    } catch (err) {
      setError('Failed to delete person.');
      console.error('Error deleting person:', err);
    }
  };

  const handleDragStart = (e, person) => {
    if (!isUserAdmin) {
      e.preventDefault();
      return;
    }
    setDraggedPerson(person);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedPerson(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (isUserAdmin) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDropOnRole = async (roleKey) => {
    if (!draggedPerson || !isUserAdmin) return;
    setError(null);
    const personId = draggedPerson.id;
    const previousRole = draggedPerson.assignedRole;

    if (previousRole === roleKey) return;

    setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRole: roleKey } : p));

    try {
      await updateDoc(doc(db, 'personnel', personId), {
        assignedRole: roleKey,
        updatedAt: new Date()
      });
    } catch (err) {
      setError('Failed to assign role. Reverting change.');
      console.error('Error updating assignment:', err);
      setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRole: previousRole } : p));
    }
  };

  const handleDropOnAvailable = async () => {
    if (!draggedPerson || !draggedPerson.assignedRole || !isUserAdmin) return;
    setError(null);
    const personId = draggedPerson.id;
    const previousRole = draggedPerson.assignedRole;
    setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRole: null } : p));

    try {
      await updateDoc(doc(db, 'personnel', personId), {
        assignedRole: null,
        updatedAt: new Date()
      });
    } catch (err) {
      setError('Failed to unassign role. Reverting change.');
      console.error('Error updating assignment to null:', err);
      setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRole: previousRole } : p));
    }
  };

  const handleDragEnter = (e) => {
    if (!isUserAdmin || !draggedPerson) return;
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    if (!isUserAdmin) return;
    e.preventDefault();
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDragEnterAvailable = (e) => {
    if (!isUserAdmin || !draggedPerson || !draggedPerson.assignedRole) return;
    e.preventDefault();
    e.currentTarget.classList.add('drag-over-available');
  };

  const handleDragLeaveAvailable = (e) => {
    if (!isUserAdmin) return;
    e.preventDefault();
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    e.currentTarget.classList.remove('drag-over-available');
  };

  const handleTextClick = (id, currentText) => {
    if (!isUserAdmin) return;
    setEditingId(id);
    setEditText(currentText);
    requestAnimationFrame(() => {
        const element = document.querySelector(`[data-edit-id="${id}"]`);
        if (element) {
            element.focus();
        }
    });
  };

  const handleTextChange = (e) => {
    setEditText(e.target.textContent);
  };

  const handleTextBlur = async (id) => {
    if (!isUserAdmin || editingId !== id) return;

    const originalText = getOriginalText(id);

    if (editText.trim() === originalText.trim()) {
        setEditingId(null);
        setEditText('');
        return;
    }

    setError(null);
    setEditingId(null);

    updateLocalState(id, editText);

    try {
        const success = await updateFirestore(id, editText);
        if (!success) {
            throw new Error("Update failed, reverting.");
        }
        console.log("Saved:", id, "->", editText);
    } catch (err) {
        console.error('Error updating document:', err);
        setError(`Failed to save changes for ${id}. Reverting.`);
        updateLocalState(id, originalText);
    } finally {
        setEditText('');
    }
  };

  const handleKeyDown = (e, id) => {
    if (editingId === id) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTextBlur(id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        const originalText = getOriginalText(id);
        e.target.textContent = originalText;
        setEditingId(null);
        setEditText('');
      }
    }
  };

  const getOriginalText = useCallback((id) => {
    if (!id) return '';
    const parts = id.split('-');
    const type = parts[0];

    try {
        if (type === 'person') {
            const person = personnel.find(p => p.id === parts[1]);
            return person ? person.name : '';
        } else if (type === 'timeline') {
            const phaseIndex = parseInt(parts[1]);
            const field = parts[2];
            if (!timeline || !timeline[phaseIndex]) return '';
            if (field === 'phase') return timeline[phaseIndex].phase;
            if (field === 'timeframe') return timeline[phaseIndex].timeframe;
            if (field === 'activity') {
                const activityIndex = parseInt(parts[3]);
                return timeline[phaseIndex].activities?.[activityIndex] || '';
            }
        } else if (type === 'budget') {
            const category = parts[1];
            const roleIndex = parseInt(parts[2]);
            const field = parts[3];
            if (!staffingSummary || !staffingSummary[category] || !staffingSummary[category].roles?.[roleIndex]) return '';
            if (field === 'title') return staffingSummary[category].roles[roleIndex].title;
            if (field === 'count') return (staffingSummary[category].roles[roleIndex].count ?? '').toString();
            if (field === 'costRange') return staffingSummary[category].roles[roleIndex].costRange;
        }
    } catch (err) {
        console.error("Error in getOriginalText:", err, "ID:", id);
    }
    return '';
  }, [personnel, timeline, staffingSummary]);

  const updateLocalState = useCallback((id, newText) => {
    if (!id) return;
    const parts = id.split('-');
    const type = parts[0];

    try {
        if (type === 'person') {
            setPersonnel(prev => prev.map(p => p.id === parts[1] ? { ...p, name: newText } : p));
        } else if (type === 'timeline') {
            const phaseIndex = parseInt(parts[1]);
            const field = parts[2];
            setTimeline(prev => {
                const updated = [...prev];
                if (!updated[phaseIndex]) return prev;
                if (field === 'phase') updated[phaseIndex].phase = newText;
                else if (field === 'timeframe') updated[phaseIndex].timeframe = newText;
                else if (field === 'activity') {
                    const activityIndex = parseInt(parts[3]);
                    if (updated[phaseIndex].activities) {
                        updated[phaseIndex].activities[activityIndex] = newText;
                    }
                }
                return updated;
            });
        } else if (type === 'budget') {
            const category = parts[1];
            const roleIndex = parseInt(parts[2]);
            const field = parts[3];
            setStaffingSummary(prev => {
                const updated = JSON.parse(JSON.stringify(prev));
                if (!updated[category]?.roles?.[roleIndex]) return prev;

                if (field === 'title') updated[category].roles[roleIndex].title = newText;
                else if (field === 'count') updated[category].roles[roleIndex].count = parseInt(newText) || 0;
                else if (field === 'costRange') updated[category].roles[roleIndex].costRange = newText;

                if (field === 'count') {
                    let newSubtotalCount = 0;
                    updated[category].roles.forEach(role => { newSubtotalCount += (role.count || 0); });
                    if (updated[category].subtotal) {
                        updated[category].subtotal.count = newSubtotalCount;
                    }

                    let newTotalCount = 0;
                    Object.keys(updated).forEach(catKey => {
                        if (catKey !== 'total' && updated[catKey].subtotal) {
                            newTotalCount += (updated[catKey].subtotal.count || 0);
                        }
                    });
                    if (updated.total) {
                        updated.total.count = newTotalCount;
                    }
                }

                return updated;
            });
        }
    } catch (err) {
        console.error("Error in updateLocalState:", err, "ID:", id);
    }
  }, []);

  const updateFirestore = useCallback(async (id, newText) => {
    if (!id) return false;
    const parts = id.split('-');
    const type = parts[0];

    try {
        if (type === 'person') {
            const personId = parts[1];
            await updateDoc(doc(db, 'personnel', personId), { name: newText, updatedAt: new Date() });
        } else if (type === 'timeline') {
            let timelineToSave;
            setTimeline(currentTimeline => {
                timelineToSave = currentTimeline;
                return currentTimeline;
            });
            if (timelineToSave) {
                 await updateDoc(doc(db, 'timeline', 'current'), { phases: timelineToSave });
            } else { throw new Error("Timeline state not available for saving"); }

        } else if (type === 'budget') {
            let budgetToSave;
            setStaffingSummary(currentSummary => {
                budgetToSave = currentSummary;
                return currentSummary;
            });
             if (budgetToSave) {
                await updateDoc(doc(db, 'budget', 'current'), { summary: budgetToSave });
            } else { throw new Error("Budget state not available for saving"); }
        } else {
            console.warn("Unknown type for Firestore update:", type);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Firestore update failed for ID:", id, err);
        return false;
    }
  }, [db]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      console.error('Login error:', error);
      if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-email'].includes(error.code)) {
        setLoginError('Invalid email or password.');
      } else {
        setLoginError('An error occurred during login.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container loading-overlay">
        <div className="loading-spinner">Loading Application...</div>
      </div>
    );
  }

  // Define common props to pass to RoleCardDisplay before the return statement
  const commonRoleCardProps = {
      personnel,
      isUserAdmin,
      expandedRoles,
      toggleRole,
      handleDragOver,
      handleDropOnRole,
      handleDragEnter,
      handleDragLeave,
      handleDragStart,
      handleDragEnd,
      handleTextClick,
      handleTextBlur,
      handleKeyDown,
      editText,
      editingId,
      unassignPerson: removePerson
  };

  return (
    <div className="dashboard-container">
      <Head>
        <title>PCI Quality Organization</title>
        <meta name="description" content="PCI Quality Organization Dashboard" />
      </Head>

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-error-button">
            <XCircle size={16} />
          </button>
        </div>
      )}

      <div className="admin-controls">
        <h1>PCI Quality Organization</h1>
        <div className="auth-section">
          {user ? (
            <>
              <span className="user-email">{user.email} {isUserAdmin ? '(Admin)' : ''}</span>
              <button onClick={handleLogout} className="auth-button logout-button">Logout</button>
            </>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="auth-button login-button">Admin Login</button>
          )}
        </div>
      </div>

      {showLoginModal && !user && (
        <div className="modal-overlay">
          <div className="modal-content login-modal">
            <h2>Admin Login</h2>
            {loginError && <div className="error-message">{loginError}</div>}
            <form onSubmit={handleLogin}>
              <input
                type="email"
                className="modal-input"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoFocus
              />
              <input
                type="password"
                className="modal-input"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <div className="modal-actions">
                 <button type="button" onClick={() => setShowLoginModal(false)} className="button secondary-button">Cancel</button>
                 <button type="submit" className="button primary-button">Login</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPersonModal && isUserAdmin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Person</h3>
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              className="modal-input"
              placeholder="Enter person's name"
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowAddPersonModal(false)} className="button secondary-button">Cancel</button>
              <button onClick={addNewPerson} className="button primary-button" disabled={!newPersonName.trim()}>Add Person</button>
            </div>
          </div>
        </div>
      )}

      {user ? (
        <>
          <div className="tab-navigation">
            <button className={`tab-button ${activeTab === 'structure' ? 'active' : ''}`} onClick={() => setActiveTab('structure')}>Organization Structure</button>
            <button className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Implementation Timeline</button>
            <button className={`tab-button ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>Budget Analysis</button>
          </div>

          <div className="tab-content">
            {activeTab === 'structure' && (
              <div className="structure-tab-content">
                <div className="structure-container-hierarchy"> {/* New container class */}
                  {/* --- Personnel Column --- */}
                  <div className="personnel-column">
                    <div className="personnel-list"
                      onDragOver={handleDragOver}
                      onDrop={handleDropOnAvailable}
                      onDragEnter={handleDragEnterAvailable}
                      onDragLeave={handleDragLeaveAvailable}
                     >
                      <div className="personnel-list-header">
                         <h3>Available Personnel</h3>
                          {isUserAdmin && (
                             <button onClick={() => setShowAddPersonModal(true)} className="add-person-button" title="Add New Person">
                                <UserPlus size={18} /> Add
                             </button>
                          )}
                      </div>
                      <div className="personnel-cards">
                        {personnel.filter(p => !p.assignedRole).map((person) => (
                          <div
                            key={person.id}
                            className={`personnel-card draggable ${draggedPerson?.id === person.id ? 'dragging' : ''}`}
                            draggable={isUserAdmin}
                            onDragStart={(e) => handleDragStart(e, person)}
                            onDragEnd={handleDragEnd}
                          >
                            <div
                                data-edit-id={`person-${person.id}`}
                                className="editable-text personnel-name"
                                contentEditable={isUserAdmin}
                                suppressContentEditableWarning={true}
                                onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                                onClick={() => isUserAdmin && handleTextClick(`person-${person.id}`, person.name)}
                                onBlur={() => handleTextBlur(`person-${person.id}`)}
                                onKeyDown={(e) => handleKeyDown(e, `person-${person.id}`)}
                                onInput={handleTextChange}
                              >
                                {editingId === `person-${person.id}` ? editText : person.name}
                              </div>
                              {isUserAdmin && (
                                 <button
                                   onClick={() => removePerson(person.id)}
                                   className="delete-person-button"
                                   title="Delete Person Permanently"
                                 >
                                   <Trash2 size={14} />
                                 </button>
                              )}
                          </div>
                        ))}
                         {personnel.filter(p => !p.assignedRole).length === 0 && (
                            <p className="empty-list-message">All personnel assigned.</p>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* --- Hierarchy Column --- */}
                  <div className="hierarchy-column"> {/* New column class */}
                    <div className="hierarchy-level director-level">
                       <RoleCardDisplay roleKey="director" roleData={roles.director} {...commonRoleCardProps} />
                    </div>

                    {/* Connector (Optional Visual) */}
                     <div className="connector-line-vertical"></div>

                    <div className="hierarchy-level reports-level">
                        <div className="systems-lead-container">
                           <RoleCardDisplay roleKey="systemsLead" roleData={roles.systemsLead} {...commonRoleCardProps} />
                        </div>
                        <div className="managers-container"> 
                            {/* Render 3 Manager sections */}
                            {[1, 2, 3].map(managerIndex => {
                                // We use the same 'qualityManager' roleKey for drop target, 
                                // but display visually separate sections. 
                                // If needed, can create specific keys like 'qm1', 'qm2' etc.
                                const managerRoleKey = 'qualityManager'; 
                                return (
                                    <div key={`manager-section-${managerIndex}`} className="manager-section">
                                        <RoleCardDisplay roleKey={managerRoleKey} roleData={roles.qualityManager} {...commonRoleCardProps} />
                                        
                                        {/* Visually Nest Team Members Under Manager */}
                                        {expandedRoles[managerRoleKey] && (
                                            <div className="team-members">
                                                <RoleCardDisplay roleKey="seniorSpecialist" roleData={roles.seniorSpecialist} {...commonRoleCardProps} />
                                                <RoleCardDisplay roleKey="qualitySpecialist" roleData={roles.qualitySpecialist} {...commonRoleCardProps} />
                                                <RoleCardDisplay roleKey="complaintsSpecialist" roleData={roles.complaintsSpecialist} {...commonRoleCardProps} />
                                                <RoleCardDisplay roleKey="associateSpecialist" roleData={roles.associateSpecialist} {...commonRoleCardProps} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {/* Connector (Optional Visual) */}
                     {/* <div className="connector-line-vertical"></div> */}
                    
                    <div className="hierarchy-level offshift-level">
                        <RoleCardDisplay roleKey="offshiftAssociate" roleData={roles.offshiftAssociate} {...commonRoleCardProps} />
                    </div>

                    {/* Add Lab Group Separately or integrate if structure is different */} 
                    <div className="hierarchy-level lab-group-level">
                        <h3>Functional Testing Group</h3>
                        <RoleCardDisplay roleKey="labManager" roleData={roles.labManager} {...commonRoleCardProps} />
                        <div className="lab-team">
                            <RoleCardDisplay roleKey="seniorLabTechnician" roleData={roles.seniorLabTechnician} {...commonRoleCardProps} />
                            <RoleCardDisplay roleKey="labTechnician" roleData={roles.labTechnician} {...commonRoleCardProps} />
                            <RoleCardDisplay roleKey="associateLabTechnician" roleData={roles.associateLabTechnician} {...commonRoleCardProps} />
                        </div>
                    </div>

                  </div> {/* End Hierarchy Column */}
                </div> {/* End Structure Container */}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="timeline-container">
                <h2>Implementation Timeline</h2>
                {timeline.map((phase, index) => (
                   <div key={phase.id || index} className="timeline-phase">
                      <h3
                         data-edit-id={`timeline-${index}-phase`}
                         className="editable-text timeline-title"
                         contentEditable={isUserAdmin}
                         suppressContentEditableWarning={true}
                         onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                         onClick={() => isUserAdmin && handleTextClick(`timeline-${index}-phase`, phase.phase)}
                         onBlur={() => handleTextBlur(`timeline-${index}-phase`)}
                         onKeyDown={(e) => handleKeyDown(e, `timeline-${index}-phase`)}
                         onInput={handleTextChange}
                       >
                         {editingId === `timeline-${index}-phase` ? editText : phase.phase}
                      </h3>
                       <p
                         data-edit-id={`timeline-${index}-timeframe`}
                         className="editable-text timeline-timeframe"
                         contentEditable={isUserAdmin}
                         suppressContentEditableWarning={true}
                         onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                         onClick={() => isUserAdmin && handleTextClick(`timeline-${index}-timeframe`, phase.timeframe)}
                         onBlur={() => handleTextBlur(`timeline-${index}-timeframe`)}
                         onKeyDown={(e) => handleKeyDown(e, `timeline-${index}-timeframe`)}
                         onInput={handleTextChange}
                       >
                         {editingId === `timeline-${index}-timeframe` ? editText : phase.timeframe}
                       </p>
                      <ul>
                        {phase.activities.map((activity, activityIndex) => (
                          <li
                             key={activityIndex}
                             data-edit-id={`timeline-${index}-activity-${activityIndex}`}
                             className="editable-text timeline-activity"
                             contentEditable={isUserAdmin}
                             suppressContentEditableWarning={true}
                             onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                             onClick={() => isUserAdmin && handleTextClick(`timeline-${index}-activity-${activityIndex}`, activity)}
                             onBlur={() => handleTextBlur(`timeline-${index}-activity-${activityIndex}`)}
                             onKeyDown={(e) => handleKeyDown(e, `timeline-${index}-activity-${activityIndex}`)}
                             onInput={handleTextChange}
                           >
                             {editingId === `timeline-${index}-activity-${activityIndex}` ? editText : activity}
                          </li>
                        ))}
                      </ul>
                   </div>
                ))}
              </div>
            )}

            {activeTab === 'budget' && (
              <div className="budget-container">
                <h2>Budget Analysis</h2>
                <table className="budget-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Role</th>
                      <th>Count</th>
                      <th>Cost Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(staffingSummary).map(([categoryKey, categoryData]) => (
                      categoryKey !== 'total' && categoryData.roles && (
                        <React.Fragment key={categoryKey}>
                          <tr><td colSpan="4" className="budget-category-title">{categoryData.title}</td></tr>
                          {categoryData.roles.map((role, index) => (
                            <tr key={`${categoryKey}-${index}`}>
                              <td></td>
                              <td
                                 data-edit-id={`budget-${categoryKey}-${index}-title`}
                                 className="editable-text"
                                 contentEditable={isUserAdmin}
                                 suppressContentEditableWarning={true}
                                 onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                                 onClick={() => isUserAdmin && handleTextClick(`budget-${categoryKey}-${index}-title`, role.title)}
                                 onBlur={() => handleTextBlur(`budget-${categoryKey}-${index}-title`)}
                                 onKeyDown={(e) => handleKeyDown(e, `budget-${categoryKey}-${index}-title`)}
                                 onInput={handleTextChange}
                                >
                                 {editingId === `budget-${categoryKey}-${index}-title` ? editText : role.title}
                              </td>
                              <td
                                 data-edit-id={`budget-${categoryKey}-${index}-count`}
                                 className="editable-text number-input"
                                 contentEditable={isUserAdmin}
                                 suppressContentEditableWarning={true}
                                 onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                                 onClick={() => isUserAdmin && handleTextClick(`budget-${categoryKey}-${index}-count`, (role.count ?? '').toString())}
                                 onBlur={() => handleTextBlur(`budget-${categoryKey}-${index}-count`)}
                                 onKeyDown={(e) => handleKeyDown(e, `budget-${categoryKey}-${index}-count`)}
                                 onInput={handleTextChange}
                                >
                                 {editingId === `budget-${categoryKey}-${index}-count` ? editText : (role.count ?? '')}
                              </td>
                              <td
                                 data-edit-id={`budget-${categoryKey}-${index}-costRange`}
                                 className="editable-text"
                                 contentEditable={isUserAdmin}
                                 suppressContentEditableWarning={true}
                                 onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                                 onClick={() => isUserAdmin && handleTextClick(`budget-${categoryKey}-${index}-costRange`, role.costRange)}
                                 onBlur={() => handleTextBlur(`budget-${categoryKey}-${index}-costRange`)}
                                 onKeyDown={(e) => handleKeyDown(e, `budget-${categoryKey}-${index}-costRange`)}
                                 onInput={handleTextChange}
                                >
                                 {editingId === `budget-${categoryKey}-${index}-costRange` ? editText : role.costRange}
                              </td>
                            </tr>
                          ))}
                          {categoryData.subtotal && (
                             <tr className="budget-subtotal">
                                <td></td>
                                <td><strong>Subtotal</strong></td>
                                <td><strong>{categoryData.subtotal.count}</strong></td>
                                <td><strong>{categoryData.subtotal.costRange}</strong></td>
                              </tr>
                           )}
                        </React.Fragment>
                      )
                    ))}
                     {staffingSummary.total && (
                       <tr className="budget-total">
                         <td colSpan="2"><strong>Total</strong></td>
                         <td><strong>{staffingSummary.total.count}</strong></td>
                         <td><strong>{staffingSummary.total.costRange}</strong></td>
                       </tr>
                     )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </>
      ) : (
        <div className="login-prompt">
          <h2>Welcome to the PCI Quality Organization Dashboard</h2>
          <p>Please log in as an admin to view and manage the organization.</p>
          <button onClick={() => setShowLoginModal(true)} className="auth-button login-button">Admin Login</button>
        </div>
      )}
    </div>
  );
}