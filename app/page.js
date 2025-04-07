'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ChevronDown, ChevronUp, UserCircle, Users, Clipboard, ClipboardCheck, AlertCircle, 
         BarChart, Calendar, DollarSign, Home, Beaker, UserPlus, XCircle, Move, Save } from 'lucide-react';
import { db } from './firebase/config';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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

  // Load personnel from Firebase
  useEffect(() => {
    const loadPersonnel = async () => {
      if (!db) {
        setError('Firebase is not properly initialized. Please check your configuration.');
        setLoading(false);
        return;
      }

      try {
        const querySnapshot = await getDocs(collection(db, 'personnel'));
        const loadedPersonnel = [];
        querySnapshot.forEach((doc) => {
          loadedPersonnel.push({ id: doc.id, ...doc.data() });
        });
        
        if (loadedPersonnel.length === 0) {
          // Initialize with some example personnel if none exists
          const initialPersonnel = [
            { id: '1', name: "Jane Smith", assignedRole: null },
            { id: '2', name: "John Doe", assignedRole: null },
            { id: '3', name: "Alice Johnson", assignedRole: null },
            { id: '4', name: "Bob Williams", assignedRole: null },
            { id: '5', name: "Carol Martinez", assignedRole: null },
          ];
          
          // Save initial personnel to Firebase
          for (const person of initialPersonnel) {
            await setDoc(doc(db, 'personnel', person.id), person);
          }
          setPersonnel(initialPersonnel);
        } else {
          setPersonnel(loadedPersonnel);
        }
      } catch (error) {
        console.error('Error loading personnel:', error);
        setError('Failed to load personnel data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadPersonnel();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
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
    <div>
      <Head>
        <title>PCI Quality Organization</title>
        <meta name="description" content="PCI Quality Organization Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">PCI Quality Organization</h1>
        
        <div className="mb-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
            onClick={() => setShowAddPersonModal(true)}
          >
            Add Person
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded mr-2"
            onClick={clearAllAssignments}
          >
            Clear All Assignments
          </button>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded"
            onClick={saveToFile}
          >
            Save Assignments
          </button>
        </div>

        {showAddPersonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-bold mb-4">Add New Person</h3>
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
                  className="px-3 py-1 rounded text-white bg-blue-500"
                  onClick={addNewPerson}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex border-b mb-4">
          <button 
            className={`py-2 px-4 font-medium ${activeTab === 'structure' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('structure')}
          >
            <div className="flex items-center">
              <BarChart size={18} className="mr-2" />
              Organization Structure
            </div>
          </button>
          <button 
            className={`py-2 px-4 font-medium ${activeTab === 'timeline' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('timeline')}
          >
            <div className="flex items-center">
              <Calendar size={18} className="mr-2" />
              Implementation Timeline
            </div>
          </button>
          <button 
            className={`py-2 px-4 font-medium ${activeTab === 'budget' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('budget')}
          >
            <div className="flex items-center">
              <DollarSign size={18} className="mr-2" />
              Budget Analysis
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'structure' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium mb-2">Available Personnel</h4>
              <div className="border rounded-lg min-h-40 p-3 bg-gray-50">
                {personnel.filter(p => !p.assignedRole).length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-10">All personnel assigned</div>
                ) : (
                  <div className="space-y-2">
                    {personnel.filter(p => !p.assignedRole).map(person => (
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
                {personnel.filter(p => p.assignedRole).length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-10">No personnel assigned yet</div>
                ) : (
                  <div className="space-y-2">
                    {personnel.filter(p => p.assignedRole).map(person => (
                      <div
                        key={person.id}
                        className="bg-white p-2 rounded border shadow-sm flex justify-between items-center"
                      >
                        <div className="font-medium">{person.name}</div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">
                            {person.assignedRole}
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
        )}

        {activeTab === 'timeline' && (
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="text-lg font-bold mb-4">Implementation Timeline</h3>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-bold">Phase 1: Planning & Preparation</h4>
                <p className="text-sm text-gray-600 mb-2">Month 1 (April)</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Finalize organization structure and job descriptions</li>
                  <li>Develop transition plan for existing staff</li>
                  <li>Identify training needs and create development plans</li>
                  <li>Create communication plan for clients and stakeholders</li>
                  <li>Prepare transition documentation</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-bold">Phase 2: Initial Implementation</h4>
                <p className="text-sm text-gray-600 mb-2">Month 2 (May 1st Deadline)</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Transition existing staff to new roles</li>
                  <li>Fill critical open positions</li>
                  <li>Conduct initial training for all team members</li>
                  <li>Implement new client team structure</li>
                  <li>Establish metrics dashboards and reporting</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-bold">Phase 3: Rollout & Stabilization</h4>
                <p className="text-sm text-gray-600 mb-2">Months 5-6</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Complete training and onboarding for all staff</li>
                  <li>Implement new shift coverage model</li>
                  <li>Standardize client communication processes</li>
                  <li>Launch all quality metrics tracking</li>
                  <li>Validate new quality workflows</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-bold">Phase 4: Optimization</h4>
                <p className="text-sm text-gray-600 mb-2">Months 7-9</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Review and refine organization based on feedback</li>
                  <li>Develop advanced training for specialized roles</li>
                  <li>Optimize client-specific processes</li>
                  <li>Implement continuous improvement initiatives</li>
                  <li>Conduct post-implementation assessment</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="text-lg font-bold mb-4">Budget Analysis</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-center">Count</th>
                    <th className="px-4 py-2 text-right">Cost Range</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Leadership */}
                  <tr className="border-t border-b bg-blue-50">
                    <td className="px-4 py-2 font-bold" rowSpan="4">Leadership</td>
                    <td className="px-4 py-2">Quality Director</td>
                    <td className="px-4 py-2 text-center">1</td>
                    <td className="px-4 py-2 text-right">$150,000 - $180,000</td>
                  </tr>
                  <tr className="border-t border-b bg-blue-50">
                    <td className="px-4 py-2">Quality Managers</td>
                    <td className="px-4 py-2 text-center">3</td>
                    <td className="px-4 py-2 text-right">$378,000 - $474,000</td>
                  </tr>
                  <tr className="border-t border-b bg-blue-50">
                    <td className="px-4 py-2">Quality Systems Lead</td>
                    <td className="px-4 py-2 text-center">1</td>
                    <td className="px-4 py-2 text-right">$90,000 - $105,000</td>
                  </tr>
                  <tr className="border-t border-b bg-blue-50">
                    <td className="px-4 py-2">Lab Manager</td>
                    <td className="px-4 py-2 text-center">1</td>
                    <td className="px-4 py-2 text-right">$95,000 - $120,000</td>
                  </tr>
                  <tr className="border-t border-b font-bold bg-blue-100">
                    <td className="px-4 py-2" colSpan="2">Leadership Subtotal</td>
                    <td className="px-4 py-2 text-center">6</td>
                    <td className="px-4 py-2 text-right">$713,000 - $879,000</td>
                  </tr>
                  
                  {/* Specialists */}
                  <tr className="border-t border-b bg-green-50">
                    <td className="px-4 py-2 font-bold" rowSpan="4">Specialists</td>
                    <td className="px-4 py-2">Senior Quality Specialists</td>
                    <td className="px-4 py-2 text-center">6</td>
                    <td className="px-4 py-2 text-right">$540,000 - $660,000</td>
                  </tr>
                  <tr className="border-t border-b bg-green-50">
                    <td className="px-4 py-2">Quality Specialists</td>
                    <td className="px-4 py-2 text-center">8</td>
                    <td className="px-4 py-2 text-right">$560,000 - $680,000</td>
                  </tr>
                  <tr className="border-t border-b bg-green-50">
                    <td className="px-4 py-2">Quality Specialists, Complaints</td>
                    <td className="px-4 py-2 text-center">6</td>
                    <td className="px-4 py-2 text-right">$420,000 - $510,000</td>
                  </tr>
                  <tr className="border-t border-b bg-green-50">
                    <td className="px-4 py-2">Senior Lab Technicians</td>
                    <td className="px-4 py-2 text-center">2</td>
                    <td className="px-4 py-2 text-right">$150,000 - $180,000</td>
                  </tr>
                  <tr className="border-t border-b font-bold bg-green-100">
                    <td className="px-4 py-2" colSpan="2">Specialists Subtotal</td>
                    <td className="px-4 py-2 text-center">22</td>
                    <td className="px-4 py-2 text-right">$1,670,000 - $2,030,000</td>
                  </tr>
                  
                  {/* Associates */}
                  <tr className="border-t border-b bg-yellow-50">
                    <td className="px-4 py-2 font-bold" rowSpan="4">Associates</td>
                    <td className="px-4 py-2">Associate QA Specialists (Day)</td>
                    <td className="px-4 py-2 text-center">6</td>
                    <td className="px-4 py-2 text-right">$330,000 - $420,000</td>
                  </tr>
                  <tr className="border-t border-b bg-yellow-50">
                    <td className="px-4 py-2">Associate QA Specialists (Night)</td>
                    <td className="px-4 py-2 text-center">3</td>
                    <td className="px-4 py-2 text-right">$165,000 - $210,000</td>
                  </tr>
                  <tr className="border-t border-b bg-yellow-50">
                    <td className="px-4 py-2">Lab Technicians</td>
                    <td className="px-4 py-2 text-center">4</td>
                    <td className="px-4 py-2 text-right">$220,000 - $280,000</td>
                  </tr>
                  <tr className="border-t border-b bg-yellow-50">
                    <td className="px-4 py-2">Associate Lab Technicians</td>
                    <td className="px-4 py-2 text-center">2</td>
                    <td className="px-4 py-2 text-right">$90,000 - $110,000</td>
                  </tr>
                  <tr className="border-t border-b font-bold bg-yellow-100">
                    <td className="px-4 py-2" colSpan="2">Associates Subtotal</td>
                    <td className="px-4 py-2 text-center">15</td>
                    <td className="px-4 py-2 text-right">$805,000 - $1,020,000</td>
                  </tr>
                  
                  {/* Total */}
                  <tr className="border-t border-b font-bold bg-gray-200">
                    <td className="px-4 py-2" colSpan="2">Total Budget</td>
                    <td className="px-4 py-2 text-center">43</td>
                    <td className="px-4 py-2 text-right">$3,188,000 - $3,929,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 