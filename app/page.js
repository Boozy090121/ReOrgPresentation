'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronUp, UserCircle, Users, Clipboard, ClipboardCheck, AlertCircle,
         BarChart, Calendar, DollarSign, Home, Beaker, UserPlus, XCircle, Move, Save, Trash2 } from 'lucide-react';
import { getDbInstance } from './firebase/config';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc, addDoc, writeBatch } from 'firebase/firestore';
import { roles, timelineData, colors, timelineInitialData, initialBudgetData } from '../lib/data';
import Timeline from '../components/Timeline';
import Budget from '../components/Budget';
import AuthSection from '../components/AuthSection';
import WorkloadAnalysis from '../components/WorkloadAnalysis';
import { useAuth } from '../lib/hooks/useAuth';
import { useInlineEditing } from '../lib/hooks/useInlineEditing';

// Dynamically import components relying heavily on client-side logic/DOM
const OrgStructure = dynamic(() => import('../components/OrgStructure'), {
  ssr: false,
  loading: () => <div className="loading-container">Loading Structure...</div>
});

const AvailablePersonnel = dynamic(() => import('../components/AvailablePersonnel'), {
  ssr: false,
  loading: () => <div className="loading-container">Loading Personnel...</div>
});

// Consider dynamic import for RoleCard if OrgStructure still fails, as it's nested
const RoleCard = dynamic(() => import('../components/RoleCard'), {
  ssr: false, 
  loading: () => <div className="loading-container">Loading Role...</div>
});

// Dynamically import Timeline and Budget as they use inline editing context
const Timeline = dynamic(() => import('../components/Timeline'), {
  ssr: false, 
  loading: () => <div className="loading-container">Loading Timeline...</div>
});

const Budget = dynamic(() => import('../components/Budget'), {
  ssr: false, 
  loading: () => <div className="loading-container">Loading Budget...</div>
});

// Main Dashboard component
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('structure');
  const [personnel, setPersonnel] = useState([]);
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [budgetData, setBudgetData] = useState({});
  const [timeline, setTimeline] = useState([]);

  // Use the Auth hook
  const { user, isUserAdmin, loadingAuth, signOut } = useAuth();

  // Instantiate the inline editing hook
  const {
    editingId,
    editText,
    handleTextClick,
    handleTextChange,
    handleTextBlur,
    handleKeyDown,
  } = useInlineEditing(getOriginalText, updateFirestoreData, updateLocalState, setError);

  // Data Loading Effect (depends on user authentication)
  useEffect(() => {
    console.log("Data loading effect triggered. LoadingAuth:", loadingAuth, "User:", !!user);
    if (!loadingAuth) {
      console.log("Auth resolved. Starting data load (User:", user ? user.uid : 'none', ")");
      const loadAllData = async () => {
        setError(null);
        setInitialDataLoaded(false);
        console.log("loadAllData called...");
        try {
           const db = getDbInstance();
           if (!db) {
               console.error("Initial Load: DB not available!");
               setError("Database connection error on initial load. Please refresh.");
               setInitialDataLoaded(false);
               return;
           }
          console.log("Loading personnel...");
          const loadedPersonnel = await loadPersonnel();
          console.log("Loading timeline...");
          const loadedTimelineData = await loadTimeline();
          console.log("Loading budget...");
          const loadedBudget = await loadBudget();

          console.log("Setting state with loaded data...");
          setPersonnel(loadedPersonnel || []);
          setTimeline(loadedTimelineData || []);
          setBudgetData(loadedBudget || {});
          setInitialDataLoaded(true);
          console.log("Data loading complete. initialDataLoaded set to true.");
        } catch (err) {
          console.error("Error within loadAllData:", err);
          setError(`Failed to load application data: ${err.message}. Please try refreshing.`);
          setInitialDataLoaded(false);
        }
      };
      loadAllData();
    } else {
      console.log("Auth not yet resolved (loadingAuth is true).");
       setInitialDataLoaded(false);
       setPersonnel([]);
       setTimeline([]);
       setBudgetData({});
       setError(null);
    }
  }, [loadingAuth, user, loadPersonnel, loadTimeline, loadBudget]);
  
  // Data loading functions (loadPersonnel, loadTimeline, loadBudget) - Keep for now
  const loadPersonnel = useCallback(async () => {
    const db = getDbInstance();
    if (!db) {
        console.error("Load Personnel: DB not available");
        setError(prev => prev ? prev + "\nDB connection lost." : "DB connection lost.");
        return [];
    }
    try {
        const querySnapshot = await getDocs(collection(db, 'personnel'));
        const loadedPersonnel = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Personnel loaded:", loadedPersonnel.length);
        return loadedPersonnel;
    } catch (err) {
        console.error("Error loading personnel:", err);
        setError(prev => prev ? prev + "\nFailed to load personnel." : "Failed to load personnel.");
        return [];
    }
  }, [setError]);

  const loadTimeline = useCallback(async () => {
    const db = getDbInstance();
    if (!db) {
        console.error("Load Timeline: DB not available");
        setError(prev => prev ? prev + "\nDB connection lost." : "DB connection lost.");
        return [];
    }
    try {
        const docRef = doc(db, 'timeline', 'current');
        const docSnap = await getDoc(docRef);
        let loadedTimeline = [];
        if (docSnap.exists()) {
          const data = docSnap.data();
          loadedTimeline = data && Array.isArray(data.phases) ? data.phases : timelineInitialData;
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
        return timelineInitialData;
    }
  }, [setError]);

  const loadBudget = useCallback(async () => {
     const db = getDbInstance();
     if (!db) {
        console.error("Load Budget: DB not available");
        setError(prev => prev ? prev + "\nDB connection lost." : "DB connection lost.");
        return {};
     }
     try {
        const docRef = doc(db, 'budget', 'current');
        const docSnap = await getDoc(docRef);
        let loadedBudget = {};
        if (docSnap.exists()) {
          const data = docSnap.data();
          loadedBudget = data && typeof data.factories === 'object' && data.factories !== null ? data.factories : initialBudgetData;
        } else {
          loadedBudget = initialBudgetData;
          await setDoc(docRef, { factories: initialBudgetData });
          console.log("Budget document created with initial factory data.");
        }
        console.log("Budget loaded:", Object.keys(loadedBudget).length, "factories");
        return loadedBudget;
    } catch (err) {
        console.error("Error loading budget:", err);
        setError(prev => prev ? prev + "\nFailed to load budget." : "Failed to load budget.");
        return initialBudgetData;
    }
  }, [setError]);

  const handleDragStart = (e, person) => {
    if (!isUserAdmin) {
      e.preventDefault();
      return;
    }
    setDraggedPerson(person);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget) {
        e.currentTarget.classList.add('dragging');
    }
  };

  const handleDragEnd = (e) => {
    if (e.currentTarget) {
        e.currentTarget.classList.remove('dragging');
    }
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
    const db = getDbInstance();
    if (!draggedPerson || !isUserAdmin || !db) {
        if (!db) setError("Database error. Cannot assign role.");
        if (!draggedPerson) setError("Drag error. Please try again.");
        return;
    }
    setError(null);
    const personId = draggedPerson.id;
    const previousRole = draggedPerson.assignedRole;

    if (!personId) {
        setError("Cannot assign role: Invalid person data.");
        console.error("handleDropOnRole: Missing personId in draggedPerson", draggedPerson);
        return;
    }

    if (previousRole === roleKey) return;

    setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRole: roleKey } : p));

    try {
      if (!db) throw new Error("Database connection lost during update.");
      await updateDoc(doc(db, 'personnel', personId), {
        assignedRole: roleKey,
        updatedAt: new Date()
      });
      console.log(`Assigned ${personId} to ${roleKey}`);
    } catch (err) {
      setError('Failed to assign role. Reverting change.');
      console.error('Error updating assignment:', err);
      setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRole: previousRole } : p));
    }
  };

  const handleDropOnAvailable = async () => {
    const db = getDbInstance();
    if (!draggedPerson || !draggedPerson.assignedRole || !isUserAdmin || !db) {
        if (!db) setError("Database error. Cannot unassign role.");
        if (!draggedPerson) setError("Drag error. Please try again.");
        return;
    }
    setError(null);
    const personId = draggedPerson.id;
    const previousRole = draggedPerson.assignedRole;

    if (!personId) {
        setError("Cannot unassign role: Invalid person data.");
         console.error("handleDropOnAvailable: Missing personId in draggedPerson", draggedPerson);
        return;
    }

    setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRole: null } : p));

    try {
      if (!db) throw new Error("Database connection lost during update.");
      await updateDoc(doc(db, 'personnel', personId), {
        assignedRole: null,
        updatedAt: new Date()
      });
       console.log(`Unassigned ${personId}`);
    } catch (err) {
      setError('Failed to unassign role. Reverting change.');
      console.error('Error updating assignment to null:', err);
       setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRole: previousRole } : p));
    }
  };

  const handleDragEnter = (e) => {
    if (!isUserAdmin || !draggedPerson) return;
    e.preventDefault();
    if (e.currentTarget) {
        e.currentTarget.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e) => {
    if (!isUserAdmin) return;
    e.preventDefault();
    if (e.relatedTarget && e.currentTarget && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }
    if (e.currentTarget) {
        e.currentTarget.classList.remove('drag-over');
    }
  };

  const handleDragEnterAvailable = (e) => {
    if (!isUserAdmin || !draggedPerson) return;
    e.preventDefault();
    if (e.currentTarget) {
        e.currentTarget.classList.add('drag-over-available'); 
    }
  };

  const handleDragLeaveAvailable = (e) => {
    if (!isUserAdmin) return;
    e.preventDefault();
    if (e.relatedTarget && e.currentTarget && e.currentTarget.contains(e.relatedTarget)) {
      return; 
    }
     if (e.currentTarget) {
        e.currentTarget.classList.remove('drag-over-available');
    }
  };

  const getOriginalText = useCallback((id) => {
    if (!id || typeof id !== 'string') {
        console.warn("getOriginalText called with invalid id:", id);
        return '';
    }
    
    const parts = id.split('-');
    if (parts.length < 3) {
         console.warn("getOriginalText: Invalid ID format", id);
         return '';
    }
    const type = parts[0];

    try {
        if (type === 'timeline') {
            if (parts.length < 3) return '';
            const phaseIndex = parseInt(parts[1], 10);
            const field = parts[2];
            
            if (!Array.isArray(timeline) || isNaN(phaseIndex) || phaseIndex < 0 || phaseIndex >= timeline.length || !field) {
                console.warn(`getOriginalText(timeline): Invalid index or data for id ${id}`);
                return '';
            }
            const phase = timeline[phaseIndex];
            if (!phase) {
                 console.warn(`getOriginalText(timeline): Phase at index ${phaseIndex} is missing for id ${id}`);
                 return '';
            }

            if (field === 'phase') return String(phase.phase ?? '');
            if (field === 'timeframe') return String(phase.timeframe ?? '');
            if (field === 'activity') {
                if (parts.length < 4) return '';
                const activityIndex = parseInt(parts[3], 10);
                if (!Array.isArray(phase.activities) || isNaN(activityIndex) || activityIndex < 0 || activityIndex >= phase.activities.length) {
                     console.warn(`getOriginalText(timeline): Invalid activity index or data for id ${id}`);
                     return '';
                }
                return String(phase.activities[activityIndex] ?? '');
            }
        } else if (type === 'budget') {
            if (parts.length < 3) return '';
            const factoryId = parts[1];
            const categoryKey = parts[2];
            
            if (!budgetData || typeof budgetData !== 'object' || !factoryId || !budgetData[factoryId]) {
                console.warn(`getOriginalText(budget): Invalid factoryId or budgetData for id ${id}`);
                return '';
            }
            const factory = budgetData[factoryId];
            if (!factory) return '';

            if (categoryKey === 'factoryName') return String(factory.name ?? '');
            if (categoryKey === 'productionVolume') return String(factory.productionVolume ?? '');

            if (categoryKey === 'personnelCosts') {
                 if (parts.length < 6) return '';
                 const personnelCategoryKey = parts[3];
                 const roleIndex = parseInt(parts[4], 10);
                 const roleField = parts[5];

                 if (!factory.personnelCosts || typeof factory.personnelCosts !== 'object' || 
                     !factory.personnelCosts[personnelCategoryKey] || 
                     !Array.isArray(factory.personnelCosts[personnelCategoryKey].roles) ||
                     isNaN(roleIndex) || roleIndex < 0 || roleIndex >= factory.personnelCosts[personnelCategoryKey].roles.length ||
                     !roleField) {
                         console.warn(`getOriginalText(budget): Invalid personnel cost path for id ${id}`);
                         return '';
                     }
                 
                 const role = factory.personnelCosts[personnelCategoryKey].roles[roleIndex];
                 if (!role) {
                      console.warn(`getOriginalText(budget): Role at index ${roleIndex} missing for id ${id}`);
                      return '';
                 }
                 return String(role[roleField] ?? ''); 

            } else if (categoryKey === 'operationalExpenses') {
                 if (parts.length < 5) return '';
                 const opExIndex = parseInt(parts[3], 10);
                 const opExField = parts[4];
                  if (!Array.isArray(factory.operationalExpenses) || 
                      isNaN(opExIndex) || opExIndex < 0 || opExIndex >= factory.operationalExpenses.length || 
                      !opExField) {
                          console.warn(`getOriginalText(budget): Invalid operational expense path for id ${id}`);
                          return '';
                      }
                  const item = factory.operationalExpenses[opExIndex];
                  if (!item) {
                      console.warn(`getOriginalText(budget): OpEx item at index ${opExIndex} missing for id ${id}`);
                      return '';
                  }
                  return String(item[opExField] ?? '');
            }
        } else if (type === 'personnel') {
            if (parts.length < 3) return '';
            const personId = parts[1];
            const field = parts[2];
            if (!Array.isArray(personnel) || !personId || !field) {
                 console.warn(`getOriginalText(personnel): Invalid id format or data for id ${id}`);
                 return '';
            }
            const person = personnel.find(p => p && p.id === personId);
            if (!person) {
                 console.warn(`getOriginalText(personnel): Person with id ${personId} not found.`);
                 return '';
            }
            if (field === 'skills' && Array.isArray(person.skills)) {
                return person.skills.join(', ');
            }
            return String(person[field] ?? '');
        }
    } catch (error) {
        console.error("Error in getOriginalText for id:", id, error);
        return '';
    }
    
    console.warn("getOriginalText: Unrecognized ID format or type:", id);
    return '';
  }, [personnel, timeline, budgetData]);

  const updateLocalState = useCallback((id, value) => {
    if (!id || typeof id !== 'string') {
        console.warn("updateLocalState called with invalid id:", id);
        return;
    }

    const parts = id.split('-');
    if (parts.length < 3) {
         console.warn("updateLocalState: Invalid ID format", id);
         return;
    }
    const type = parts[0];

    try {
        if (type === 'timeline') {
            setTimeline(prev => {
                if (!Array.isArray(prev)) return prev;
                const newTimeline = JSON.parse(JSON.stringify(prev));
                if (parts.length < 3) return prev;
                const phaseIndex = parseInt(parts[1], 10);
                const field = parts[2];
                
                if (isNaN(phaseIndex) || phaseIndex < 0 || phaseIndex >= newTimeline.length || !field || !newTimeline[phaseIndex]) return prev;

                if (field === 'phase') newTimeline[phaseIndex].phase = value;
                else if (field === 'timeframe') newTimeline[phaseIndex].timeframe = value;
                else if (field === 'activity') {
                    if (parts.length < 4) return prev;
                    const activityIndex = parseInt(parts[3], 10);
                    if (!Array.isArray(newTimeline[phaseIndex].activities) || isNaN(activityIndex) || activityIndex < 0 || activityIndex >= newTimeline[phaseIndex].activities.length) return prev;
                    newTimeline[phaseIndex].activities[activityIndex] = value;
                }
                return newTimeline;
            });
        } else if (type === 'budget') {
            setBudgetData(prev => {
                if (!prev || typeof prev !== 'object') return prev;
                const newBudgetData = JSON.parse(JSON.stringify(prev));
                if (parts.length < 3) return prev;
                const factoryId = parts[1];
                const categoryKey = parts[2];
                
                if (!factoryId || !newBudgetData[factoryId]) return prev;

                if (categoryKey === 'factoryName') {
                    newBudgetData[factoryId].name = value;
                } else if (categoryKey === 'productionVolume') {
                    const numValue = Number(value);
                    newBudgetData[factoryId].productionVolume = isNaN(numValue) ? 0 : numValue;
                } else if (categoryKey === 'personnelCosts') {
                     if (parts.length < 6) return prev;
                    const personnelCategoryKey = parts[3];
                    const roleIndex = parseInt(parts[4], 10);
                    const roleField = parts[5];
                    if (!newBudgetData[factoryId].personnelCosts || typeof newBudgetData[factoryId].personnelCosts !== 'object' || 
                        !newBudgetData[factoryId].personnelCosts[personnelCategoryKey] || 
                        !Array.isArray(newBudgetData[factoryId].personnelCosts[personnelCategoryKey].roles) ||
                        isNaN(roleIndex) || roleIndex < 0 || roleIndex >= newBudgetData[factoryId].personnelCosts[personnelCategoryKey].roles.length ||
                        !roleField || !newBudgetData[factoryId].personnelCosts[personnelCategoryKey].roles[roleIndex]) return prev;
                    
                    const currentRole = newBudgetData[factoryId].personnelCosts[personnelCategoryKey].roles[roleIndex];
                    if (roleField === 'count') {
                         const numValue = Number(value);
                         currentRole[roleField] = isNaN(numValue) ? 0 : numValue;
                    } else {
                         currentRole[roleField] = value;
                    }

                } else if (categoryKey === 'operationalExpenses') {
                    if (parts.length < 5) return prev;
                    const opExIndex = parseInt(parts[3], 10);
                    const opExField = parts[4];
                    if (!Array.isArray(newBudgetData[factoryId].operationalExpenses) || 
                        isNaN(opExIndex) || opExIndex < 0 || opExIndex >= newBudgetData[factoryId].operationalExpenses.length || 
                        !opExField || !newBudgetData[factoryId].operationalExpenses[opExIndex]) return prev;

                    const currentItem = newBudgetData[factoryId].operationalExpenses[opExIndex];
                    if (opExField === 'amount') {
                       const numValue = Number(value);
                       currentItem[opExField] = isNaN(numValue) ? 0 : numValue;
                    } else {
                       currentItem[opExField] = value;
                    }
                }
                return newBudgetData;
            });
        } else if (type === 'personnel') {
            setPersonnel(prev => {
                if (!Array.isArray(prev)) return prev;
                if (parts.length < 3) return prev;
                const personId = parts[1];
                const field = parts[2];
                if (!personId || !field) return prev;
                
                const newPersonnel = prev.map(p => {
                    if (p && p.id === personId) {
                        let updatedValue = value;
                        if (field === 'skills' && typeof value === 'string') {
                           updatedValue = value.split(',').map(s => s.trim()).filter(Boolean);
                        } else if (field === 'experience') {
                           const numValue = Number(value);
                           updatedValue = isNaN(numValue) ? 0 : numValue;
                        }
                        return { ...p, [field]: updatedValue };
                    }
                    return p;
                });
                return newPersonnel;
            });
        }
    } catch (error) {
         console.error("Error in updateLocalState for id:", id, error);
         setError("Error updating data locally. Changes might not be saved.");
    }
  }, [setError]);

  const updateFirestoreData = useCallback(async (id, value) => {
    const db = getDbInstance();
    if (!id || typeof id !== 'string' || !db) {
        if (!db) setError("Database error. Cannot save changes.");
        else setError("Invalid data reference. Cannot save changes.");
        return false;
    }

    const parts = id.split('-');
    if (parts.length < 3) {
        setError("Invalid data structure for saving.");
        return false;
    }
    const type = parts[0];

    try {
        if (type === 'timeline') {
            const phaseIndex = parseInt(parts[1], 10);
            const field = parts[2];
            let activityIndex = null;
            if (field === 'activity') {
                if (parts.length < 4) throw new Error('Invalid timeline activity ID');
                activityIndex = parseInt(parts[3], 10);
            }

            if (isNaN(phaseIndex) || phaseIndex < 0 || (activityIndex !== null && (isNaN(activityIndex) || activityIndex < 0))) {
                 throw new Error('Invalid index in timeline ID');
            }

            let fieldPath;
            if (activityIndex !== null) {
                 fieldPath = `phases.${phaseIndex}.activities.${activityIndex}`;
            } else {
                 fieldPath = `phases.${phaseIndex}.${field}`;
            }

            const timelineDocRef = doc(db, 'timeline', 'current');
            await updateDoc(timelineDocRef, { [fieldPath]: value, updatedAt: new Date() });
            console.log(`Updated timeline field: ${fieldPath}`);
            return true;

        } else if (type === 'budget') {
             const factoryId = parts[1];
             const categoryKey = parts[2];

             if (!factoryId) throw new Error('Missing factoryId in budget ID');

             let fieldPath = `factories.${factoryId}`;
             let updateValue = value;

             if (categoryKey === 'factoryName') {
                fieldPath += '.name';
             } else if (categoryKey === 'productionVolume') {
                fieldPath += '.productionVolume';
                const numValue = Number(value);
                updateValue = isNaN(numValue) ? 0 : numValue;
             } else if (categoryKey === 'personnelCosts') {
                if (parts.length < 6) throw new Error('Invalid budget personnelCosts ID');
                const personnelCategoryKey = parts[3];
                const roleIndex = parseInt(parts[4], 10);
                const roleField = parts[5];
                if (isNaN(roleIndex) || roleIndex < 0 || !personnelCategoryKey || !roleField) throw new Error('Invalid index/field in budget personnelCosts ID');
                fieldPath += `.personnelCosts.${personnelCategoryKey}.roles.${roleIndex}.${roleField}`;
                if (roleField === 'count') {
                    const numValue = Number(value);
                    updateValue = isNaN(numValue) ? 0 : numValue;
                }
            } else if (categoryKey === 'operationalExpenses') {
                if (parts.length < 5) throw new Error('Invalid budget operationalExpenses ID');
                const opExIndex = parseInt(parts[3], 10);
                const opExField = parts[4];
                 if (isNaN(opExIndex) || opExIndex < 0 || !opExField) throw new Error('Invalid index/field in budget operationalExpenses ID');
                fieldPath += `.operationalExpenses.${opExIndex}.${opExField}`;
                 if (opExField === 'amount') {
                     const numValue = Number(value);
                     updateValue = isNaN(numValue) ? 0 : numValue;
                 }
             } else {
                throw new Error(`Unknown budget category key: ${categoryKey}`);
             }

             const budgetDocRef = doc(db, 'budget', 'current');
             await updateDoc(budgetDocRef, { [fieldPath]: updateValue, updatedAt: new Date() });
             console.log(`Updated budget field: ${fieldPath}`);
             return true;

        } else if (type === 'personnel') {
            const personId = parts[1];
            const field = parts[2];
            if (!personId || !field) {
                 setError("Invalid personnel data for saving.");
                 return false;
            }

            let updateValue = value;
            if (field === 'skills' && typeof value === 'string') {
                updateValue = value.split(',').map(s => s.trim()).filter(Boolean);
            } else if (field === 'experience') {
                const numValue = Number(value);
                updateValue = isNaN(numValue) ? 0 : numValue;
            }

            const updateData = { [field]: updateValue, updatedAt: new Date() };
            await updateDoc(doc(db, 'personnel', personId), updateData);
            console.log(`Updated personnel ${personId} field ${field}`);
            return true;
        }
         console.warn("updateFirestoreData: Unrecognized type:", type);
         setError(`Cannot save changes for unknown data type: ${type}`);
         return false;
    } catch (error) {
        console.error(`Error updating Firestore for id ${id}:`, error);
        setError(`Failed to save changes for ${id}. Details: ${error.message}`);
        return false;
    }
  }, [setError]);

  const addPersonnel = useCallback(async () => {
    const db = getDbInstance();
    if (!isUserAdmin || !db) {
      setError("Permission denied or database connection error. Cannot add personnel.");
      return;
    }
    setError(null);
    const newPerson = {
      name: 'New Teammate',
      experience: 0,
      assignedRole: null,
      skills: [],
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    try {
      const docRef = await addDoc(collection(db, 'personnel'), newPerson);
      console.log("New person added with ID:", docRef.id);
      const addedPersonData = { id: docRef.id, ...newPerson };
      setPersonnel(prev => [...prev, addedPersonData]);
    } catch (err) {
      console.error("Error adding personnel:", err);
      setError("Failed to add new personnel to the database.");
    }
  }, [isUserAdmin, setError, setPersonnel]);

  const deletePersonnel = useCallback(async (personId) => {
    const db = getDbInstance();
    if (!isUserAdmin || !db || !personId) {
      setError("Permission denied, invalid ID, or database connection error. Cannot delete personnel.");
      return;
    }
    setError(null);
    try {
      await deleteDoc(doc(db, 'personnel', personId));
      console.log("Deleted person with ID:", personId);
      setPersonnel(prev => prev.filter(p => p.id !== personId));
    } catch (err) {
      console.error("Error deleting personnel:", err);
      setError(`Failed to delete personnel ${personId} from the database.`);
    }
  }, [isUserAdmin, setError, setPersonnel]);

  const saveTimelineChanges = useCallback(async () => {
    const db = getDbInstance();
    if (!isUserAdmin || !db) {
      setError("Permission denied or database error. Cannot save timeline changes.");
      return false;
    }
    setError(null);
    try {
      const timelineDocRef = doc(db, 'timeline', 'current');
      await setDoc(timelineDocRef, { phases: timeline, updatedAt: new Date() }, { merge: true });
      console.log("Timeline changes saved successfully.");
      return true;
    } catch (err) {
      console.error("Error saving timeline changes:", err);
      setError("Failed to save timeline changes to the database.");
      return false;
    }
  }, [isUserAdmin, timeline, setError]);

  const saveBudgetChanges = useCallback(async () => {
    const db = getDbInstance();
    if (!isUserAdmin || !db) {
      setError("Permission denied or database error. Cannot save budget changes.");
      return false;
    }
    setError(null);
    try {
      const budgetDocRef = doc(db, 'budget', 'current');
      await setDoc(budgetDocRef, { factories: budgetData, updatedAt: new Date() }, { merge: true });
      console.log("Budget changes saved successfully.");
      return true;
    } catch (err) {
      console.error("Error saving budget changes:", err);
      setError("Failed to save budget changes to the database.");
      return false;
    }
  }, [isUserAdmin, budgetData, setError]);

  const renderContent = () => {
    if (loadingAuth) {
        return <div className="loading-container">Authenticating...</div>;
    } 

    if (!initialDataLoaded) {
         return <div className="loading-container">Loading data...</div>;
    }

    const db = getDbInstance();
    if (!db && ['structure', 'timeline', 'budget'].includes(activeTab)) {
        if (!error) {
             setError("Database connection lost.");
        } 
        return <div className="error-container"><AlertCircle /> Database connection lost. Please refresh.</div>;
    }

    if (error) {
        return (
           <div className="error-container">
             <AlertCircle size={48} color="#dc3545" />
             <h2>Application Error</h2>
             <p>{typeof error === 'string' ? error : 'An unknown error occurred.'}</p>
             <button onClick={() => window.location.reload()} className="button-primary">
                Refresh Page
             </button>
             {user && (
               <button onClick={signOut} className="button-secondary" style={{marginLeft: '10px'}}>
                  Sign Out
               </button>
             )}
           </div>
         );
    }

    switch (activeTab) {
       case 'structure':
         return Array.isArray(personnel) ? (
           <div className="structure-tab">
             <div className="hierarchy-column">
               <OrgStructure 
                          roles={roles} 
                          personnel={personnel}
                          isUserAdmin={isUserAdmin}
                          handleDropOnRole={handleDropOnRole}
                          handleDragEnter={handleDragEnter}
                          handleDragLeave={handleDragLeave}
                          handleDragStart={handleDragStart}
                          handleDragEnd={handleDragEnd}
                          editingId={editingId}
                          editText={editText}
                          handleTextClick={handleTextClick}
                          handleTextBlur={handleTextBlur}
                          handleKeyDown={handleKeyDown}
                          handleTextChange={handleTextChange}
                          unassignPerson={handleDropOnAvailable}
                          allRoles={roles} 
               />
             </div>
             <AvailablePersonnel
                        personnel={personnel}
                        setPersonnel={setPersonnel} 
                        setError={setError}         
                        roles={roles}             
                        isUserAdmin={isUserAdmin}
                        handleDragStart={handleDragStart}
                        handleDragEnd={handleDragEnd}
                        handleDragOver={handleDragOver}
                        handleDropOnAvailable={handleDropOnAvailable}
                        handleDragEnterAvailable={handleDragEnterAvailable}
                        handleDragLeaveAvailable={handleDragLeaveAvailable}
                        editingId={editingId}
                        editText={editText}
                        handleTextClick={handleTextClick}
                        handleTextBlur={handleTextBlur}
                        handleKeyDown={handleKeyDown}
                        handleTextChange={handleTextChange}
                        addPersonnel={addPersonnel}
                        deletePersonnel={deletePersonnel}
             />
          </div>
         ) : <div className="loading-container">Loading structure components...</div>;
       case 'timeline':
         return Array.isArray(timeline) ? (
           <Timeline 
              timeline={timeline} 
              isUserAdmin={isUserAdmin}
              editingId={editingId}
              editText={editText}
              handleTextClick={handleTextClick}
              handleTextBlur={handleTextBlur}
              handleKeyDown={handleKeyDown}
              handleTextChange={handleTextChange}
              saveTimelineChanges={saveTimelineChanges}
           />
         ) : <div className="loading-container">Loading timeline...</div>;
       case 'budget':
          return (budgetData && typeof budgetData === 'object') ? (
             <Budget 
                 budgetData={budgetData} 
                 isUserAdmin={isUserAdmin}
                 editingId={editingId}
                 editText={editText}
                 handleTextClick={handleTextClick}
                 handleTextBlur={handleTextBlur}
                 handleKeyDown={handleKeyDown}
                 handleTextChange={handleTextChange}
                 saveBudgetChanges={saveBudgetChanges}
              />
          ) : <div className="loading-container">Loading budget...</div>;
        case 'analysis':
          return (roles && Array.isArray(personnel)) ? (
             <WorkloadAnalysis 
                 roles={roles} 
                 personnel={personnel} 
                 isUserAdmin={isUserAdmin}
             />
          ) : <div className="loading-container">Loading analysis data...</div>;
       default:
         return <div className="tab-content">Select a tab</div>; 
    }
  };

  return (
    <div className="dashboard-container">
      <Head>
        <title>ReOrg Dashboard</title>
        <meta name="description" content="Organizational Restructuring Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {user && <AuthSection minimal={true} signOutAction={signOut} userEmail={user.email || 'User'}/>}
      
      {user && (
          <nav className="sidebar">
            <button 
              className={`tab-button ${activeTab === 'structure' ? 'active' : ''}`}
              onClick={() => setActiveTab('structure')}
            >
              <Users size={18} /> Structure
            </button>
            <button 
              className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              <Calendar size={18} /> Timeline
            </button>
            <button 
              className={`tab-button ${activeTab === 'budget' ? 'active' : ''}`}
              onClick={() => setActiveTab('budget')}
            >
              <DollarSign size={18} /> Budget
            </button>
            <button 
              className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              <BarChart size={18} /> Analysis
            </button>
          </nav>
      )}

      <main className={`main-content ${!user ? 'logged-out' : ''}`}>
         {renderContent()}
      </main>
    </div>
  );
}