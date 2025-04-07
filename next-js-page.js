import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ChevronDown, ChevronUp, UserCircle, Users, Clipboard, ClipboardCheck, AlertCircle, 
         BarChart, Calendar, DollarSign, Home, Beaker, UserPlus, XCircle, Move, Save } from 'lucide-react';

// Main Dashboard component
export default function Home() {
  return (
    <div>
      <Head>
        <title>PCI Quality Organization</title>
        <meta name="description" content="PCI Quality Organization Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Dashboard />
      </main>
              </div>
        </div>
        
        {showAddPersonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-bold mb-4" style={{ color: colors.primary }}>Add New Person</h3>
              <input
                type="text"
                className="w-full p-2 border rounded mb-4"
                placeholder="Enter person's name"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <button
                  className="px-3 py-1 rounded text-gray-600 border"
                  onClick={() => setShowAddPersonModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 rounded text-white"
                  style={{ backgroundColor: colors.secondary }}
                  onClick={addNewPerson}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium mb-2">Available Personnel</h4>
            <div className="border rounded-lg min-h-40 p-3 bg-gray-50">
              {availablePersonnel.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-10">All personnel assigned</div>
              ) : (
                <div className="space-y-2">
                  {availablePersonnel.map(person => (
                    <div
                      key={person.id}
                      className="bg-white p-2 rounded border shadow-sm flex justify-between items-center cursor-move"
                      draggable
                      onDragStart={() => handleDragStart(person)}
                    >
                      <div className="font-medium">{person.name}</div>
                      <Move size={16} className="text-gray-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Assigned Personnel</h4>
            <div className="border rounded-lg min-h-40 p-3 bg-gray-50">
              {assignedPersonnel.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-10">No personnel assigned yet</div>
              ) : (
                <div className="space-y-2">
                  {assignedPersonnel.map(person => (
                    <div
                      key={person.id}
                      className="bg-white p-2 rounded border shadow-sm flex justify-between items-center"
                      draggable
                      onDragStart={() => handleDragStart(person)}
                    >
                      <div className="font-medium">{person.name}</div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">
                          {roles[person.assignedRole]?.title || person.assignedRole}
                        </span>
                        <button
                          className="text-red-500"
                          onClick={() => removePerson(person.id)}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-sm text-center text-gray-500">
          Drag and drop personnel onto role cards to assign them
        </div>
      </div>
  );
}

// Dashboard Component 
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('structure');
  const [expandedRoles, setExpandedRoles] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [personnel, setPersonnel] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  
  // Client-side only code
  useEffect(() => {
    // Load saved personnel if available
    const savedPersonnel = localStorage.getItem('pciPersonnel');
    if (savedPersonnel) {
      setPersonnel(JSON.parse(savedPersonnel));
    } else {
      // Initialize with some example personnel
      const initialPersonnel = [
        { id: 1, name: "Jane Smith", assignedRole: null },
        { id: 2, name: "John Doe", assignedRole: null },
        { id: 3, name: "Alice Johnson", assignedRole: null },
        { id: 4, name: "Bob Williams", assignedRole: null },
        { id: 5, name: "Carol Martinez", assignedRole: null },
      ];
      setPersonnel(initialPersonnel);
      localStorage.setItem('pciPersonnel', JSON.stringify(initialPersonnel));
    }
    
    // Add window beforeunload handler
    const handleBeforeUnload = () => {
      localStorage.setItem('pciPersonnel', JSON.stringify(personnel));
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Save personnel when it changes
  useEffect(() => {
    if (personnel.length > 0) {
      localStorage.setItem('pciPersonnel', JSON.stringify(personnel));
    }
  }, [personnel]);
  
  const toggleRole = (roleId) => {
    setExpandedRoles({
      ...expandedRoles,
      [roleId]: !expandedRoles[roleId]
    });
  };

  const toggleCategory = (roleId, category) => {
    const key = `${roleId}-${category}`;
    setExpandedCategories({
      ...expandedCategories,
      [key]: !expandedCategories[key]
    });
  };
  
  const addNewPerson = () => {
    if (newPersonName.trim()) {
      const newPerson = {
        id: personnel.length > 0 ? Math.max(...personnel.map(p => p.id)) + 1 : 1,
        name: newPersonName.trim(),
        assignedRole: null
      };
      
      const updatedPersonnel = [...personnel, newPerson];
      setPersonnel(updatedPersonnel);
      localStorage.setItem('pciPersonnel', JSON.stringify(updatedPersonnel));
      setNewPersonName('');
      setShowAddPersonModal(false);
    }
  };
  
  const removePerson = (personId) => {
    const updatedPersonnel = personnel.map(person => 
      person.id === personId ? { ...person, assignedRole: null } : person
    );
    setPersonnel(updatedPersonnel);
    localStorage.setItem('pciPersonnel', JSON.stringify(updatedPersonnel));
  };
  
  const clearAllAssignments = () => {
    const updatedPersonnel = personnel.map(person => ({ ...person, assignedRole: null }));
    setPersonnel(updatedPersonnel);
    localStorage.setItem('pciPersonnel', JSON.stringify(updatedPersonnel));
  };
  
  const saveToFile = () => {
    const assignmentData = personnel
      .filter(person => person.assignedRole)
      .map(person => `${person.name} - ${person.assignedRole}`)
      .join('\n');
    
    const blob = new Blob([assignmentData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pci_personnel_assignments.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleDragStart = (person) => {
    setDraggedPerson(person);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDrop = (roleId) => {
    if (draggedPerson) {
      // First remove person from any previous role
      const updatedPersonnel = personnel.map(person => {
        if (person.id === draggedPerson.id) {
          return { ...person, assignedRole: roleId };
        }
        return person;
      });
      
      setPersonnel(updatedPersonnel);
      localStorage.setItem('pciPersonnel', JSON.stringify(updatedPersonnel));
      setDraggedPerson(null);
    }
  };
  
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
  
  // Updated roles to include the new Functional Testing Group
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
    // New Functional Testing Group roles
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
  
  // Implementation timeline data
  const timeline = [
    {
      phase: "Phase 1: Planning & Preparation",
      timeframe: "Month 1 (April)",
      activities: [
        "Finalize organization structure and job descriptions",
        "Develop transition plan for existing staff",
        "Identify training needs and create development plans",
        "Create communication plan for clients and internal stakeholders",
        "Prepare transition documentation"
      ]
    },
    {
      phase: "Phase 2: Initial Implementation",
      timeframe: "Month 2 (May 1st Deadline)",
      activities: [
        "Transition existing staff to new roles and responsibilities",
        "Fill critical open positions",
        "Conduct initial training for all team members",
        "Implement new client team structure",
        "Establish metrics dashboards and reporting"
      ]
    },
    {
      phase: "Phase 3: Rollout & Stabilization",
      timeframe: "Months 5-6",
      activities: [
        "Complete training and onboarding for all staff",
        "Implement new shift coverage model",
        "Standardize client communication processes",
        "Launch all quality metrics tracking",
        "Validate new quality workflows"
      ]
    },
    {
      phase: "Phase 4: Optimization",
      timeframe: "Months 7-9",
      activities: [
        "Review and refine organization based on initial feedback",
        "Develop advanced training for specialized roles",
        "Optimize client-specific processes",
        "Implement continuous improvement initiatives",
        "Conduct post-implementation assessment"
      ]
    }
  ];
  
  // Updated staffing summary data to include Functional Testing Group
  const staffingSummary = {
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