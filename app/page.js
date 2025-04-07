'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { ChevronDown, ChevronUp, UserCircle, Users, Clipboard, ClipboardCheck, AlertCircle,
         BarChart, Calendar, DollarSign, Home, Beaker, UserPlus, XCircle, Move, Save, Trash2 } from 'lucide-react';
import { db } from './firebase/config'; // Keep db import if needed for data loading
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc, addDoc, writeBatch } from 'firebase/firestore';
import { roles as importedRoles, timelineInitialData, initialBudgetData } from '../lib/data'; // Import static data
import RoleCard from '../components/RoleCard'; // Import RoleCard component
import OrgStructure from '../components/OrgStructure'; // Import OrgStructure
import AvailablePersonnel from '../components/AvailablePersonnel'; // Import AvailablePersonnel
import Timeline from '../components/Timeline'; // Import Timeline
import Budget from '../components/Budget'; // Import Budget
import AuthSection from '../components/AuthSection'; // Import AuthSection
import WorkloadAnalysis from '../components/WorkloadAnalysis'; // Import WorkloadAnalysis
import { useAuth } from '../lib/hooks/useAuth'; // Import useAuth hook

// Main Dashboard component
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('structure');
  const [personnel, setPersonnel] = useState([]);
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [budgetData, setBudgetData] = useState({});
  const [timeline, setTimeline] = useState([]);

  // Use the Auth hook
  const { user, isUserAdmin, loadingAuth, signOut } = useAuth();

  // Data Loading Effect (depends on user authentication)
  useEffect(() => {
    // Only load data if auth is resolved and user is logged in
    if (!loadingAuth && user && !initialDataLoaded) {
      const loadAllData = async () => {
        setError(null);
        console.log("Loading all data...");
        try {
          // Refetch or load initial data here
          // Example: Assuming load functions return data
           const [loadedPersonnel, loadedTimelineData, loadedBudget] = await Promise.all([
              loadPersonnel(),
              loadTimeline(), 
              loadBudget()    
          ]);
          setPersonnel(loadedPersonnel);
          setTimeline(loadedTimelineData);
          setBudgetData(loadedBudget);
          setInitialDataLoaded(true);
          console.log("Data loading complete.");
        } catch (err) {
          console.error("Error loading data:", err);
          setError("Failed to load application data. Please refresh.");
        }
      };
      loadAllData();
    } else if (!user) {
      // Reset state if user logs out
      setPersonnel([]);
      setTimeline([]);
      setBudgetData({});
      setInitialDataLoaded(false);
      setError(null);
    }
  // Depend on auth state and user status
  }, [loadingAuth, user, initialDataLoaded]);
  
  // Data loading functions (loadPersonnel, loadTimeline, loadBudget) - Keep for now
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
  }, [setError]);

  const loadTimeline = useCallback(async () => {
    try {
        const docRef = doc(db, 'timeline', 'current');
        const docSnap = await getDoc(docRef);
        let loadedTimeline = [];
        if (docSnap.exists()) {
          loadedTimeline = docSnap.data().phases || [];
        } else {
          loadedTimeline = timelineInitialData;
          await setDoc(docRef, { phases: timelineInitialData });
          console.log("Timeline document created.");
        }
        console.log("Timeline loaded:", loadedTimeline.length, "phases");
        return loadedTimeline;
    } catch (err) {
        console.error("Error loading timeline:", err);
        setError(prev => prev ? prev + "\nFailed to load timeline." : "Failed to load timeline.");
        return [];
    }
  }, [setError]);

  const loadBudget = useCallback(async () => {
     try {
        const docRef = doc(db, 'budget', 'current');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBudgetData(docSnap.data().factories || {});
        } else {
          const { initialBudgetData } = importedRoles;
          await setDoc(docRef, { factories: initialBudgetData });
          setBudgetData(initialBudgetData);
          console.log("Budget document created with initial factory data.");
        }
        console.log("Budget loaded:", Object.keys(budgetData).length, "factories");
    } catch (err) {
        console.error("Error loading budget:", err);
        setError(prev => prev ? prev + "\nFailed to load budget." : "Failed to load budget.");
    }
  }, []);

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
            const factoryId = parts[1];
            const costType = parts[2];
            const category = parts[3];
            const roleIndex = parseInt(parts[4]);
            const field = parts[5];
            
            if (!budgetData || !budgetData[factoryId]) return '';

            if (costType === 'personnelCosts') {
                 if (!budgetData[factoryId].personnelCosts || !budgetData[factoryId].personnelCosts[category] || !budgetData[factoryId].personnelCosts[category].roles?.[roleIndex]) return '';
                 if (field === 'title') return budgetData[factoryId].personnelCosts[category].roles[roleIndex].title;
                 if (field === 'count') return (budgetData[factoryId].personnelCosts[category].roles[roleIndex].count ?? '').toString();
                 if (field === 'costRange') return budgetData[factoryId].personnelCosts[category].roles[roleIndex].costRange;
            } else if (costType === 'operationalExpenses') {
                 const opExIndex = parseInt(category);
                 if (!budgetData[factoryId].operationalExpenses?.[opExIndex]) return '';
                 if (field === 'category') return budgetData[factoryId].operationalExpenses[opExIndex].category;
                 if (field === 'amount') return (budgetData[factoryId].operationalExpenses[opExIndex].amount ?? '').toString();
            } else if (costType === 'productionVolume') {
                 return (budgetData[factoryId].productionVolume ?? '').toString();
            }
        }
    } catch (err) {
        console.error("Error in getOriginalText:", err, "ID:", id);
    }
    return '';
  }, [personnel, timeline, budgetData]);

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
            const factoryId = parts[1];
            const costType = parts[2];
            const categoryOrIndex = parts[3];
            const roleIndexOrNA = parseInt(parts[4]);
            const field = parts[5];

            setBudgetData(prev => {
                const updated = JSON.parse(JSON.stringify(prev));
                if (!updated || !updated[factoryId]) return prev;

                if (costType === 'personnelCosts') {
                    const category = categoryOrIndex;
                    const roleIndex = roleIndexOrNA;
                    if (!updated[factoryId].personnelCosts?.[category]?.roles?.[roleIndex]) return prev;

                    if (field === 'title') updated[factoryId].personnelCosts[category].roles[roleIndex].title = newText;
                    else if (field === 'count') updated[factoryId].personnelCosts[category].roles[roleIndex].count = parseInt(newText) || 0;
                    else if (field === 'costRange') updated[factoryId].personnelCosts[category].roles[roleIndex].costRange = newText;
                    
                } else if (costType === 'operationalExpenses') {
                    const opExIndex = parseInt(categoryOrIndex);
                    if (!updated[factoryId].operationalExpenses?.[opExIndex]) return prev;

                    if (field === 'category') updated[factoryId].operationalExpenses[opExIndex].category = newText;
                    else if (field === 'amount') updated[factoryId].operationalExpenses[opExIndex].amount = parseInt(newText) || 0;
                
                } else if (costType === 'productionVolume') {
                    updated[factoryId].productionVolume = parseInt(newText) || 0;
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
            setBudgetData(currentSummary => {
                budgetToSave = currentSummary;
                return currentSummary;
            });
             if (budgetToSave) {
                await updateDoc(doc(db, 'budget', 'current'), { factories: budgetToSave });
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

  if (loadingAuth) {
    return (
      <div className="dashboard-container loading-overlay">
        <div className="loading-spinner">Authenticating...</div>
      </div>
    );
  }

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
        <AuthSection user={user} isUserAdmin={isUserAdmin} handleLogout={signOut} />
      </div>

      {user ? (
        <>
          <div className="tab-navigation">
            <button className={`tab-button ${activeTab === 'structure' ? 'active' : ''}`} onClick={() => setActiveTab('structure')}>Organization Structure</button>
            <button className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Implementation Timeline</button>
            <button className={`tab-button ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>Budget Analysis</button>
            <button className={`tab-button ${activeTab === 'workload' ? 'active' : ''}`} onClick={() => setActiveTab('workload')}>Workload Analysis</button>
          </div>

          <div className="tab-content">
            {activeTab === 'structure' && (
              <div className="structure-tab-content">
                <OrgStructure
                  roles={roles}
                  personnel={personnel}
                  isUserAdmin={isUserAdmin}
                  allRoles={roles}
                  handleDragOver={handleDragOver}
                  handleDropOnRole={handleDropOnRole}
                  handleDragEnter={handleDragEnter}
                  handleDragLeave={handleDragLeave}
                  handleDragStart={handleDragStart}
                  handleDragEnd={handleDragEnd}
                  handleTextClick={handleTextClick}
                  handleTextBlur={handleTextBlur}
                  handleKeyDown={handleKeyDown}
                  editText={editText}
                  editingId={editingId}
                  setError={setError}
                  handleTextChange={handleTextChange}
                />
                <AvailablePersonnel
                  personnel={personnel}
                  setPersonnel={setPersonnel}
                  isUserAdmin={isUserAdmin}
                  roles={roles}
                  setError={setError}
                  handleDragStart={handleDragStart}
                  handleDragEnd={handleDragEnd}
                  handleDragOver={handleDragOver}
                  handleDropOnAvailable={handleDropOnAvailable}
                  handleDragEnterAvailable={handleDragEnterAvailable}
                  handleDragLeaveAvailable={handleDragLeaveAvailable}
                />
              </div>
            )}

            {activeTab === 'timeline' && (
              <Timeline
                timeline={timeline}
                setTimeline={setTimeline}
                isUserAdmin={isUserAdmin}
                editingId={editingId}
                editText={editText}
                handleTextClick={handleTextClick}
                handleTextBlur={handleTextBlur}
                handleKeyDown={handleKeyDown}
                handleTextChange={handleTextChange}
              />
            )}

            {activeTab === 'budget' && (
              <Budget
                budgetData={budgetData}
                isUserAdmin={isUserAdmin}
                editingId={editingId}
                editText={editText}
                handleTextClick={handleTextClick}
                handleTextBlur={handleTextBlur}
                handleKeyDown={handleKeyDown}
                handleTextChange={handleTextChange}
              />
            )}

            {activeTab === 'workload' && (
              <WorkloadAnalysis 
                personnel={personnel} 
                roles={roles}
              />
            )}

          </div>
        </>
      ) : (
        <div className="login-prompt">
          <h2>Welcome to the PCI Quality Organization Dashboard</h2>
          <p>Please log in as an admin to view and manage the organization.</p>
          <AuthSection user={user} isUserAdmin={isUserAdmin} handleLogout={signOut} />
        </div>
      )}
    </div>
  );
}