'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ChevronDown, ChevronUp, UserCircle, Users, Clipboard, ClipboardCheck, AlertCircle, 
         BarChart, Calendar, DollarSign, Home, Beaker, UserPlus, XCircle, Move, Save } from 'lucide-react';
import { db, auth, setupAuthObserver } from '../firebase/config';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
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

// Add these constants at the top of the file
const roles = {
  director: {
    title: "Quality Director",
    responsibilities: [
      "Strategic quality leadership for entire focus factory",
      "Final approval for critical quality decisions",
      "Leadership-level client relationship management",
      "Budget and resource management",
      "Direct supervision of 4 reports (3 QMs + Systems Lead)"
    ]
  },
  systemsLead: {
    title: "Quality Systems Lead",
    responsibilities: [
      "Maintain quality management system architecture",
      "Develop and maintain centralized metrics dashboards",
      "Establish standardized training requirements and materials",
      "Provide technical systems support for all teams",
      "Analyze organization-wide quality trends"
    ]
  },
  qualityManager: {
    title: "Quality Manager",
    responsibilities: [
      "Oversee two client accounts",
      "Approve major deviations/complaints",
      "Lead client meetings and manage escalations",
      "Coach team members and manage their development",
      "Review and approve complex quality documents"
    ]
  }
};

const budgetData = {
  leadership: {
    title: "Leadership",
    roles: [
      { title: "Quality Director", count: 1, costRange: "$150,000 - $180,000" },
      { title: "Quality Managers", count: 3, costRange: "$378,000 - $474,000" },
      { title: "Quality Systems Lead", count: 1, costRange: "$90,000 - $105,000" }
    ],
    subtotal: { count: 5, costRange: "$618,000 - $759,000" }
  },
  specialists: {
    title: "Specialists",
    roles: [
      { title: "Senior Quality Specialists", count: 6, costRange: "$540,000 - $660,000" },
      { title: "Quality Specialists", count: 8, costRange: "$560,000 - $680,000" },
      { title: "Quality Specialists, Complaints", count: 6, costRange: "$420,000 - $510,000" }
    ],
    subtotal: { count: 20, costRange: "$1,520,000 - $1,850,000" }
  },
  associates: {
    title: "Associates",
    roles: [
      { title: "Associate QA Specialists (Day)", count: 6, costRange: "$330,000 - $420,000" },
      { title: "Associate QA Specialists (Night)", count: 3, costRange: "$165,000 - $210,000" }
    ],
    subtotal: { count: 9, costRange: "$495,000 - $630,000" }
  },
  total: { count: 34, costRange: "$2,633,000 - $3,239,000" }
};

// Main Dashboard component
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('structure');
  const [expandedRoles, setExpandedRoles] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [personnel, setPersonnel] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Auth state observer
  useEffect(() => {
    const unsubscribe = setupAuthObserver((user, isAdmin) => {
      setUser(user);
      setIsUserAdmin(isAdmin);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Load personnel from Firebase
  useEffect(() => {
    const loadPersonnel = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'personnel'));
        const loadedPersonnel = [];
        querySnapshot.forEach((doc) => {
          loadedPersonnel.push({ id: doc.id, ...doc.data() });
        });
        setPersonnel(loadedPersonnel || []);
      } catch (error) {
        console.error('Error loading personnel:', error);
        setPersonnel([]);
      }
    };

    if (user) {
      loadPersonnel();
    }
  }, [user]);

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
  
  const addNewPerson = async () => {
    if (newPersonName.trim()) {
      try {
        const newId = (personnel.length > 0 ? Math.max(...personnel.map(p => parseInt(p.id))) + 1 : 1).toString();
        const newPerson = {
          id: newId,
          name: newPersonName.trim(),
          assignedRole: null
        };
        
        // Save to Firebase
        await setDoc(doc(db, 'personnel', newId), newPerson);
        
        setPersonnel([...personnel, newPerson]);
        setNewPersonName('');
        setShowAddPersonModal(false);
      } catch (error) {
        console.error('Error adding new person:', error);
      }
    }
  };
  
  const removePerson = async (personId) => {
    try {
      // Update in Firebase
      await updateDoc(doc(db, 'personnel', personId), { assignedRole: null });
      
      const updatedPersonnel = personnel.map(person => 
        person.id === personId ? { ...person, assignedRole: null } : person
      );
      setPersonnel(updatedPersonnel);
    } catch (error) {
      console.error('Error removing person:', error);
    }
  };
  
  const clearAllAssignments = async () => {
    try {
      // Update all personnel in Firebase
      const batch = personnel.map(person => 
        updateDoc(doc(db, 'personnel', person.id), { assignedRole: null })
      );
      await Promise.all(batch);
      
      const updatedPersonnel = personnel.map(person => ({ ...person, assignedRole: null }));
      setPersonnel(updatedPersonnel);
    } catch (error) {
      console.error('Error clearing assignments:', error);
    }
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
  
  const handleDrop = async (roleId) => {
    if (draggedPerson) {
      try {
        // Update in Firebase
        await updateDoc(doc(db, 'personnel', draggedPerson.id), { assignedRole: roleId });
        
        const updatedPersonnel = personnel.map(person => {
          if (person.id === draggedPerson.id) {
            return { ...person, assignedRole: roleId };
          }
          return person;
        });
        
        setPersonnel(updatedPersonnel);
        setDraggedPerson(null);
      } catch (error) {
        console.error('Error updating assignment:', error);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Try to create or sign in the admin user
      await createAdminUser();
      setShowLoginModal(false);
      setLoginError('');
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid credentials');
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
      <div className="dashboard-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Head>
        <title>PCI Quality Organization</title>
        <meta name="description" content="PCI Quality Organization Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Admin Controls */}
      <div className="admin-controls">
        <h1>PCI Quality Organization</h1>
        {user ? (
          <div>
            <span>{user.email} {isUserAdmin ? '(Admin)' : ''}</span>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button onClick={() => setShowLoginModal(true)}>Admin Login</button>
        )}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="login-modal">
            <h2>Admin Login</h2>
            {loginError && <div className="error-message">{loginError}</div>}
            <input
              type="email"
              className="login-input"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <input
              type="password"
              className="login-input"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            <button className="login-button" onClick={handleLogin}>
              Login
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'structure' ? 'active' : ''}`}
          onClick={() => setActiveTab('structure')}
        >
          Organization Structure
        </button>
        <button
          className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Implementation Timeline
        </button>
        <button
          className={`tab-button ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          Budget Analysis
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'structure' && (
        <div className="organization-structure">
          <div className="personnel-list">
            <h3>Available Personnel</h3>
            <div className="personnel-cards">
              {personnel.filter(person => !person.assignedRole).map((person) => (
                <div
                  key={person.id}
                  className="personnel-card draggable"
                  draggable
                  onDragStart={() => handleDragStart(person)}
                >
                  <span>{person.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="role-card">
            <div className="role-header" onClick={() => toggleRole('director')}>
              <h3>{roles.director.title}</h3>
              <span>{expandedRoles.director ? <ChevronUp /> : <ChevronDown />}</span>
            </div>
            {expandedRoles.director && (
              <div 
                className="role-content"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop('director')}
              >
                <h4>Responsibilities:</h4>
                <ul>
                  {roles.director.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
                <div className="assigned-personnel">
                  {personnel.filter(person => person.assignedRole === 'director').map(person => (
                    <div key={person.id} className="assigned-person">
                      {person.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="role-card">
            <div className="role-header" onClick={() => toggleRole('systemsLead')}>
              <h3>{roles.systemsLead.title}</h3>
              <span>{expandedRoles.systemsLead ? <ChevronUp /> : <ChevronDown />}</span>
            </div>
            {expandedRoles.systemsLead && (
              <div 
                className="role-content"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop('systemsLead')}
              >
                <h4>Responsibilities:</h4>
                <ul>
                  {roles.systemsLead.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
                <div className="assigned-personnel">
                  {personnel.filter(person => person.assignedRole === 'systemsLead').map(person => (
                    <div key={person.id} className="assigned-person">
                      {person.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="role-card">
            <div className="role-header" onClick={() => toggleRole('qualityManager')}>
              <h3>{roles.qualityManager.title}</h3>
              <span>{expandedRoles.qualityManager ? <ChevronUp /> : <ChevronDown />}</span>
            </div>
            {expandedRoles.qualityManager && (
              <div 
                className="role-content"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop('qualityManager')}
              >
                <h4>Responsibilities:</h4>
                <ul>
                  {roles.qualityManager.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
                <div className="assigned-personnel">
                  {personnel.filter(person => person.assignedRole === 'qualityManager').map(person => (
                    <div key={person.id} className="assigned-person">
                      {person.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div>
          {/* Timeline Content */}
          {timelineData.map((phase) => (
            <div key={phase.id} className="timeline-phase">
              <h3>{phase.title}</h3>
              <p>{phase.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'budget' && (
        <div>
          {/* Budget Content */}
          <table className="budget-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {budgetData.map((item) => (
                <tr key={item.id}>
                  <td>{item.category}</td>
                  <td>{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 