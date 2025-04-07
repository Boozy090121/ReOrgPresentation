'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ChevronDown, ChevronUp, UserCircle, Users, Clipboard, ClipboardCheck, AlertCircle, 
         BarChart, Calendar, DollarSign, Home, Beaker, UserPlus, XCircle, Move, Save } from 'lucide-react';
import { db } from './firebase/config';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Main Dashboard component
export default function Home() {
  const [activeTab, setActiveTab] = useState('structure');
  const [expandedRoles, setExpandedRoles] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [personnel, setPersonnel] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load personnel from Firebase
  useEffect(() => {
    const loadPersonnel = async () => {
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
      </main>
    </div>
  );
} 