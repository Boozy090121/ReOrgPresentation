'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { ChevronDown, ChevronUp, UserCircle, Users, Clipboard, ClipboardCheck, AlertCircle,
         BarChart, Calendar, DollarSign, Home, Beaker, UserPlus, XCircle, Move, Save, Trash2 } from 'lucide-react';
import { db } from './firebase/config'; // Keep db import if needed for data loading
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc, addDoc, writeBatch } from 'firebase/firestore';
import { roles, timelineData, colors, timelineInitialData, initialBudgetData } from '../lib/data'; // Import roles directly
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
    console.log("Data loading effect triggered. LoadingAuth:", loadingAuth, "User:", !!user);
    // Only load data if auth is resolved and user is logged in
    if (!loadingAuth && user) {
      console.log("Auth resolved, user logged in. Starting data load...");
      const loadAllData = async () => {
        setError(null);
        setInitialDataLoaded(false); // Ensure loading state is true initially
        console.log("loadAllData called...");
        try {
           // Check if db is available before loading
           if (!db) {
               console.error("loadAllData: DB not available!");
               throw new Error("Database connection not available.");
           }
          // Refetch or load initial data here
           console.log("Loading personnel...");
           const loadedPersonnel = await loadPersonnel();
           console.log("Loading timeline...");
           const loadedTimelineData = await loadTimeline();
           console.log("Loading budget...");
           const loadedBudget = await loadBudget();

          // Ensure data is set correctly, even if some loads returned defaults
          console.log("Setting state with loaded data...");
          setPersonnel(loadedPersonnel || []);
          setTimeline(loadedTimelineData || []);
          setBudgetData(loadedBudget || {});
          setInitialDataLoaded(true);
          console.log("Data loading complete. initialDataLoaded set to true.");
        } catch (err) {
          console.error("Error within loadAllData:", err);
          setError(`Failed to load application data: ${err.message}. Please try refreshing.`);
          setInitialDataLoaded(false); // Explicitly set to false on error
        }
      };
      loadAllData();
    } else if (!loadingAuth && !user) {
      // Reset state if user logs out (or was never logged in after auth resolved)
      console.log("Auth resolved, user not logged in. Resetting state.");
      setPersonnel([]);
      setTimeline([]);
      setBudgetData({});
      setInitialDataLoaded(false); // Ensure loaded is false if no user
      setError(null);
    } else {
      console.log("Auth not yet resolved (loadingAuth is true).");
       // Optionally reset state here too if needed while auth is loading
       // setInitialDataLoaded(false);
    }
  // Depend ONLY on auth state and user status
  }, [loadingAuth, user]); // <<< FIXED Dependency Array
  
  // Data loading functions (loadPersonnel, loadTimeline, loadBudget) - Keep for now
  const loadPersonnel = useCallback(async () => {
    // Check db at the start of the function
    if (!db) {
        console.error("Load Personnel: DB not available");
        setError(prev => prev ? prev + "\nDB connection lost." : "DB connection lost.");
        return []; // Return empty array on DB error
    }
    try {
        const querySnapshot = await getDocs(collection(db, 'personnel'));
        const loadedPersonnel = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Personnel loaded:", loadedPersonnel.length);
        return loadedPersonnel; // Return the data
    } catch (err) {
        console.error("Error loading personnel:", err);
        setError(prev => prev ? prev + "\nFailed to load personnel." : "Failed to load personnel.");
        return []; // Return empty array on fetch error
    }
  }, [setError]);

  const loadTimeline = useCallback(async () => {
    if (!db) {
        console.error("Load Timeline: DB not available");
        setError(prev => prev ? prev + "\nDB connection lost." : "DB connection lost.");
        return []; // Return empty array
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
          if (db) { // Check db again before writing
              await setDoc(docRef, { phases: timelineInitialData });
              console.log("Timeline document created.");
          } else {
              console.error("Timeline creation failed: DB not available");
              setError(prev => prev ? prev + "\nFailed to create timeline." : "Failed to create timeline.");
              // Still return initial data if creation fails?
          }
        }
        console.log("Timeline loaded:", loadedTimeline.length, "phases");
        return loadedTimeline;
    } catch (err) {
        console.error("Error loading timeline:", err);
        setError(prev => prev ? prev + "\nFailed to load timeline." : "Failed to load timeline.");
        return timelineInitialData; // Return initial data on error
    }
  }, [setError]);

  const loadBudget = useCallback(async () => {
     if (!db) {
        console.error("Load Budget: DB not available");
        setError(prev => prev ? prev + "\nDB connection lost." : "DB connection lost.");
        return {}; // Return empty object
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
           if (db) { // Check db again before writing
              await setDoc(docRef, { factories: initialBudgetData });
              console.log("Budget document created with initial factory data.");
           } else {
               console.error("Budget creation failed: DB not available");
               setError(prev => prev ? prev + "\nFailed to create budget." : "Failed to create budget.");
               // Still return initial data if creation fails?
           }
        }
        console.log("Budget loaded:", Object.keys(loadedBudget).length, "factories");
        return loadedBudget;
    } catch (err) {
        console.error("Error loading budget:", err);
        setError(prev => prev ? prev + "\nFailed to load budget." : "Failed to load budget.");
        return initialBudgetData; // Return initial data on error
    }
  }, [setError]);

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
    // Add db check and draggedPerson check
    if (!draggedPerson || !isUserAdmin || !db) {
        if (!db) setError("Database error. Cannot assign role.");
        if (!draggedPerson) setError("Drag error. Please try again.");
        return;
    }
    setError(null);
    const personId = draggedPerson.id;
    const previousRole = draggedPerson.assignedRole;

    // Check if personId is valid before proceeding
    if (!personId) {
        setError("Cannot assign role: Invalid person data.");
        console.error("handleDropOnRole: Missing personId in draggedPerson", draggedPerson);
        return;
    }

    if (previousRole === roleKey) return; // No change needed

    // Optimistic UI update
    setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRole: roleKey } : p));

    try {
      // Ensure db is still available (might not be necessary due to initial check, but safe)
      if (!db) throw new Error("Database connection lost during update.");
      await updateDoc(doc(db, 'personnel', personId), {
        assignedRole: roleKey,
        updatedAt: new Date()
      });
      console.log(`Assigned ${personId} to ${roleKey}`);
    } catch (err) {
      setError('Failed to assign role. Reverting change.');
      console.error('Error updating assignment:', err);
      // Revert optimistic update
      setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRole: previousRole } : p));
    }
  };

  const handleDropOnAvailable = async () => {
     // Add db check and draggedPerson check
    if (!draggedPerson || !draggedPerson.assignedRole || !isUserAdmin || !db) {
        if (!db) setError("Database error. Cannot unassign role.");
        if (!draggedPerson) setError("Drag error. Please try again.");
        // Don't set error if just assignedRole is missing, means they are already available
        return;
    }
    setError(null);
    const personId = draggedPerson.id;
    const previousRole = draggedPerson.assignedRole;

    // Check personId
    if (!personId) {
        setError("Cannot unassign role: Invalid person data.");
         console.error("handleDropOnAvailable: Missing personId in draggedPerson", draggedPerson);
        return;
    }

    // Optimistic UI update
    setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRole: null } : p));

    try {
      // Ensure db is still available
      if (!db) throw new Error("Database connection lost during update.");
      await updateDoc(doc(db, 'personnel', personId), {
        assignedRole: null,
        updatedAt: new Date()
      });
       console.log(`Unassigned ${personId}`);
    } catch (err) {
      setError('Failed to unassign role. Reverting change.');
      console.error('Error updating assignment to null:', err);
       // Revert optimistic update
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
    if (!isUserAdmin || !id) return; // Add id check
    setEditingId(id);
    // Ensure currentText is a string or number before setting
    setEditText(typeof currentText === 'string' || typeof currentText === 'number' ? String(currentText) : '');
    // Request animation frame for focus
    requestAnimationFrame(() => {
        // Use try-catch for querySelector just in case ID format is bad
        try {
            const element = document.querySelector(`[data-edit-id="${id}"]`);
            if (element) {
                element.focus();
            } else {
                 console.warn(`Element with data-edit-id="${id}" not found for focus.`);
            }
        } catch (e) {
             console.error(`Error selecting element for focus with id="${id}":`, e);
        }
    });
  };

  const handleTextChange = (e) => {
    // Check if e and e.target exist
    if (e && e.target) {
      // Use textContent, ensure it's treated as a string
      setEditText(e.target.textContent !== null && e.target.textContent !== undefined ? String(e.target.textContent) : '');
    } else {
        console.warn("handleTextChange called without valid event target.");
    }
  };

  const handleTextBlur = async (id) => {
    // Add check for isUserAdmin and if the blurred element matches the one being edited
    if (!isUserAdmin || editingId !== id) {
         // If editingId is null but id is passed, maybe log a warning? 
         // This can happen if blur occurs programmatically after reset.
         // console.log(`handleTextBlur called for ${id} while not editing or not admin.`);
         return;
    }

    const originalText = getOriginalText(id);
    // Ensure editText and originalText are strings for comparison
    const trimmedEditText = typeof editText === 'string' ? editText.trim() : '';
    const trimmedOriginalText = typeof originalText === 'string' ? originalText.trim() : '';
    
    // Reset editing state *before* async operations
    const currentlyEditingId = editingId; // Capture id before resetting state
    setEditingId(null);
    setEditText(''); 

    // Check if text actually changed 
    if (trimmedEditText === trimmedOriginalText) {
        console.log("No change detected for:", currentlyEditingId);
        // Ensure the visual element reverts if edit text was different only by whitespace
         requestAnimationFrame(() => {
             try {
                 const element = document.querySelector(`[data-edit-id="${currentlyEditingId}"]`);
                 if (element) element.textContent = originalText;
             } catch (e) { console.error("Error reverting text content:", e); }
         });
        return; // No *meaningful* change, no need to save
    }

    setError(null); // Clear previous errors before attempting save

    // Optimistically update local state first using the robust function
    updateLocalState(currentlyEditingId, trimmedEditText); // Use trimmed value for consistency

    // Then, attempt to update Firestore using the robust function
    const success = await updateFirestoreData(currentlyEditingId, trimmedEditText); 

    if (!success) {
        // Revert local state if Firestore update failed
        console.warn("Firestore update failed, reverting local state for:", currentlyEditingId);
        // Use originalText (untrimmed) for revert to be precise
        updateLocalState(currentlyEditingId, originalText);
        // Visually revert the field as well
         requestAnimationFrame(() => {
             try {
                 const element = document.querySelector(`[data-edit-id="${currentlyEditingId}"]`);
                 if (element) element.textContent = originalText;
             } catch (e) { console.error("Error reverting text content:", e); }
         });
        // Error state should have been set within updateFirestoreData
    } else {
        console.log("Successfully saved changes for:", currentlyEditingId);
        // Optionally confirm save by ensuring visual matches saved state (trimmed)
         requestAnimationFrame(() => {
             try {
                 const element = document.querySelector(`[data-edit-id="${currentlyEditingId}"]`);
                 if (element) element.textContent = trimmedEditText;
             } catch (e) { console.error("Error confirming text content:", e); }
         });
    }
  };

  const handleKeyDown = (e, id) => {
    // Check if e exists and has key property
    if (!e || !e.key || !id) return;

    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent newline in contentEditable
      // Ensure the target element exists before blurring
      if (e.target && typeof e.target.blur === 'function') {
        e.target.blur(); // Trigger blur, which calls handleTextBlur
      } else {
          handleTextBlur(id); // Fallback if target isn't available/blurrable
      }
    } else if (e.key === 'Escape') {
      // Store original text before resetting state
      const originalText = getOriginalText(id); 
      setEditingId(null); // Cancel editing on Escape
      setEditText('');
      // Revert visual change immediately using original text
       requestAnimationFrame(() => {
           try {
                const element = document.querySelector(`[data-edit-id="${id}"]`);
                if (element) element.textContent = originalText;
           } catch (err) { console.error("Error reverting text on Escape:", err); }
       });
    }
  };

  const getOriginalText = useCallback((id) => {
    // Basic validation of id
    if (!id || typeof id !== 'string') {
        console.warn("getOriginalText called with invalid id:", id);
        return '';
    }
    
    const parts = id.split('-');
    if (parts.length < 3) { // Minimum parts needed (e.g., type-id-field)
         console.warn("getOriginalText: Invalid ID format", id);
         return '';
    }
    const type = parts[0];

    try {
        if (type === 'timeline') {
            if (parts.length < 3) return ''; // Need at least type-index-field
            const phaseIndex = parseInt(parts[1], 10);
            const field = parts[2]; // 'phase' or 'timeframe' or 'activity'
            
            // Check timeline array, phaseIndex validity, and field name
            if (!Array.isArray(timeline) || isNaN(phaseIndex) || phaseIndex < 0 || phaseIndex >= timeline.length || !field) {
                console.warn(`getOriginalText(timeline): Invalid index or data for id ${id}`);
                return '';
            }
            const phase = timeline[phaseIndex];
            // Check if phase object exists
            if (!phase) {
                 console.warn(`getOriginalText(timeline): Phase at index ${phaseIndex} is missing for id ${id}`);
                 return '';
            }

            if (field === 'phase') return String(phase.phase ?? '');
            if (field === 'timeframe') return String(phase.timeframe ?? '');
            if (field === 'activity') {
                if (parts.length < 4) return ''; // Need type-index-activity-index
                const activityIndex = parseInt(parts[3], 10);
                // Check activities array and activityIndex validity
                if (!Array.isArray(phase.activities) || isNaN(activityIndex) || activityIndex < 0 || activityIndex >= phase.activities.length) {
                     console.warn(`getOriginalText(timeline): Invalid activity index or data for id ${id}`);
                     return '';
                }
                // Return activity, ensure it's a string
                return String(phase.activities[activityIndex] ?? '');
            }
        } else if (type === 'budget') {
            if (parts.length < 3) return ''; // Need type-factoryId-field
            const factoryId = parts[1];
            const categoryKey = parts[2]; // 'personnelCosts' or 'operationalExpenses' or 'productionVolume' or 'factoryName'
            
            // Check budgetData, factoryId validity
            if (!budgetData || typeof budgetData !== 'object' || !factoryId || !budgetData[factoryId]) {
                console.warn(`getOriginalText(budget): Invalid factoryId or budgetData for id ${id}`);
                return '';
            }
            const factory = budgetData[factoryId];
            if (!factory) return ''; // Should be caught above, but safe check

            if (categoryKey === 'factoryName') return String(factory.name ?? '');
            if (categoryKey === 'productionVolume') return String(factory.productionVolume ?? '');

            if (categoryKey === 'personnelCosts') {
                 if (parts.length < 6) return ''; // type-factory-personnelCosts-category-index-field
                 const personnelCategoryKey = parts[3];
                 const roleIndex = parseInt(parts[4], 10);
                 const roleField = parts[5];

                 // Check personnelCosts object, specific category, roles array, roleIndex validity, roleField name
                 if (!factory.personnelCosts || typeof factory.personnelCosts !== 'object' || 
                     !factory.personnelCosts[personnelCategoryKey] || 
                     !Array.isArray(factory.personnelCosts[personnelCategoryKey].roles) ||
                     isNaN(roleIndex) || roleIndex < 0 || roleIndex >= factory.personnelCosts[personnelCategoryKey].roles.length ||
                     !roleField) {
                         console.warn(`getOriginalText(budget): Invalid personnel cost path for id ${id}`);
                         return '';
                     }
                 
                 const role = factory.personnelCosts[personnelCategoryKey].roles[roleIndex];
                 // Check role object exists
                 if (!role) {
                      console.warn(`getOriginalText(budget): Role at index ${roleIndex} missing for id ${id}`);
                      return '';
                 }
                 // Access role field safely, convert null/undefined to empty string
                 return String(role[roleField] ?? ''); 

            } else if (categoryKey === 'operationalExpenses') {
                 if (parts.length < 5) return ''; // type-factory-operationalExpenses-index-field
                 const opExIndex = parseInt(parts[3], 10);
                 const opExField = parts[4];
                  // Check operationalExpenses array, opExIndex validity, opExField name
                  if (!Array.isArray(factory.operationalExpenses) || 
                      isNaN(opExIndex) || opExIndex < 0 || opExIndex >= factory.operationalExpenses.length || 
                      !opExField) {
                          console.warn(`getOriginalText(budget): Invalid operational expense path for id ${id}`);
                          return '';
                      }
                  const item = factory.operationalExpenses[opExIndex];
                  // Check item object exists
                  if (!item) {
                      console.warn(`getOriginalText(budget): OpEx item at index ${opExIndex} missing for id ${id}`);
                      return '';
                  }
                  // Access item field safely, convert null/undefined to empty string
                  return String(item[opExField] ?? '');
            }
        } else if (type === 'personnel') {
            if (parts.length < 3) return ''; // type-personId-field
            const personId = parts[1];
            const field = parts[2];
            // Check personnel array and field name
            if (!Array.isArray(personnel) || !personId || !field) {
                 console.warn(`getOriginalText(personnel): Invalid id format or data for id ${id}`);
                 return '';
            }
            const person = personnel.find(p => p && p.id === personId); // Add check for p itself
            // Check person object was found
            if (!person) {
                 console.warn(`getOriginalText(personnel): Person with id ${personId} not found.`);
                 return '';
            }
            // Access field safely, convert null/undefined to empty string
            return String(person[field] ?? '');
        }
    } catch (error) {
        // Catch potential errors during parsing or access
        console.error("Error in getOriginalText for id:", id, error);
        return '';
    }
    
    // Default return if id format or type not recognized
    console.warn("getOriginalText: Unrecognized ID format or type:", id);
    return '';
  }, [personnel, timeline, budgetData]);

  const updateLocalState = useCallback((id, value) => {
    // Basic validation of id
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
                // Add check for prev being an array
                if (!Array.isArray(prev)) return prev;
                const newTimeline = JSON.parse(JSON.stringify(prev)); // Deep copy
                if (parts.length < 3) return prev;
                const phaseIndex = parseInt(parts[1], 10);
                const field = parts[2];
                
                // Validate index and field
                if (isNaN(phaseIndex) || phaseIndex < 0 || phaseIndex >= newTimeline.length || !field || !newTimeline[phaseIndex]) return prev;

                if (field === 'phase') newTimeline[phaseIndex].phase = value;
                else if (field === 'timeframe') newTimeline[phaseIndex].timeframe = value;
                else if (field === 'activity') {
                    if (parts.length < 4) return prev;
                    const activityIndex = parseInt(parts[3], 10);
                    // Validate activities array and index
                    if (!Array.isArray(newTimeline[phaseIndex].activities) || isNaN(activityIndex) || activityIndex < 0 || activityIndex >= newTimeline[phaseIndex].activities.length) return prev;
                    newTimeline[phaseIndex].activities[activityIndex] = value;
                }
                return newTimeline;
            });
        } else if (type === 'budget') {
            setBudgetData(prev => {
                // Add check for prev being an object
                if (!prev || typeof prev !== 'object') return prev;
                const newBudgetData = JSON.parse(JSON.stringify(prev));
                if (parts.length < 3) return prev;
                const factoryId = parts[1];
                const categoryKey = parts[2];
                
                // Validate factoryId and existence
                if (!factoryId || !newBudgetData[factoryId]) return prev;

                if (categoryKey === 'factoryName') {
                    newBudgetData[factoryId].name = value;
                } else if (categoryKey === 'productionVolume') {
                    // Attempt to convert to number, default to 0 if invalid
                    const numValue = Number(value);
                    newBudgetData[factoryId].productionVolume = isNaN(numValue) ? 0 : numValue;
                } else if (categoryKey === 'personnelCosts') {
                     if (parts.length < 6) return prev;
                    const personnelCategoryKey = parts[3];
                    const roleIndex = parseInt(parts[4], 10);
                    const roleField = parts[5];
                    // Validate path
                    if (!newBudgetData[factoryId].personnelCosts || typeof newBudgetData[factoryId].personnelCosts !== 'object' || 
                        !newBudgetData[factoryId].personnelCosts[personnelCategoryKey] || 
                        !Array.isArray(newBudgetData[factoryId].personnelCosts[personnelCategoryKey].roles) ||
                        isNaN(roleIndex) || roleIndex < 0 || roleIndex >= newBudgetData[factoryId].personnelCosts[personnelCategoryKey].roles.length ||
                        !roleField || !newBudgetData[factoryId].personnelCosts[personnelCategoryKey].roles[roleIndex]) return prev;
                    
                    const currentRole = newBudgetData[factoryId].personnelCosts[personnelCategoryKey].roles[roleIndex];
                    // Handle numeric fields like 'count'
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
                    // Validate path
                    if (!Array.isArray(newBudgetData[factoryId].operationalExpenses) || 
                        isNaN(opExIndex) || opExIndex < 0 || opExIndex >= newBudgetData[factoryId].operationalExpenses.length || 
                        !opExField || !newBudgetData[factoryId].operationalExpenses[opExIndex]) return prev;

                    const currentItem = newBudgetData[factoryId].operationalExpenses[opExIndex];
                    // Handle numeric fields like 'amount'
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
                // Check prev is array
                 if (!Array.isArray(prev)) return prev;
                if (parts.length < 3) return prev;
                const personId = parts[1];
                const field = parts[2];
                if (!personId || !field) return prev; // No id or field specified
                
                const newPersonnel = prev.map(p => {
                    // Check p exists and has id
                    if (p && p.id === personId) {
                        return { ...p, [field]: value };
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
  }, [personnel, timeline, budgetData]);

  // Helper to update Firestore
  const updateFirestoreData = useCallback(async (id, value) => {
    // Add db check and id validation
    if (!id || typeof id !== 'string' || !db) {
        if (!db) setError("Database error. Cannot save changes.");
        else setError("Invalid data reference. Cannot save changes.");
        return false; // Indicate failure
    }

    const parts = id.split('-'); // Ensure parenthesis is correct here!
    if (parts.length < 3) {
        setError("Invalid data structure for saving.");
        return false;
    }
    const type = parts[0];

    try {
        if (type === 'timeline') {
            // Direct update for timeline fields
            const phaseIndex = parseInt(parts[1], 10);
            const field = parts[2];
            let activityIndex = null;
            if (field === 'activity') {
                if (parts.length < 4) throw new Error('Invalid timeline activity ID');
                activityIndex = parseInt(parts[3], 10);
            }

            // Validate indices
            if (isNaN(phaseIndex) || phaseIndex < 0 || (activityIndex !== null && (isNaN(activityIndex) || activityIndex < 0))) {
                 throw new Error('Invalid index in timeline ID');
            }

            // Construct the field path for Firestore update
            let fieldPath;
            if (activityIndex !== null) {
                 // Ensure the activities array exists and the index is valid (fetch might be needed for full safety)
                 // For simplicity, we assume the structure exists based on local state used for editing
                 fieldPath = `phases.${phaseIndex}.activities.${activityIndex}`;
            } else {
                 fieldPath = `phases.${phaseIndex}.${field}`;
            }

            const timelineDocRef = doc(db, 'timeline', 'current');
            await updateDoc(timelineDocRef, { [fieldPath]: value, updatedAt: new Date() });
            console.log(`Updated timeline field: ${fieldPath}`);
            return true;

        } else if (type === 'budget') {
             // Direct update for budget fields
             const factoryId = parts[1];
             const categoryKey = parts[2];

             if (!factoryId) throw new Error('Missing factoryId in budget ID');

             let fieldPath = `factories.${factoryId}`;
             let updateValue = value; // Default to the passed value

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
                if (roleField === 'count') { // Handle numeric conversion
                    const numValue = Number(value);
                    updateValue = isNaN(numValue) ? 0 : numValue;
                }
            } else if (categoryKey === 'operationalExpenses') {
                if (parts.length < 5) throw new Error('Invalid budget operationalExpenses ID');
                const opExIndex = parseInt(parts[3], 10);
                const opExField = parts[4];
                 if (isNaN(opExIndex) || opExIndex < 0 || !opExField) throw new Error('Invalid index/field in budget operationalExpenses ID');
                fieldPath += `.operationalExpenses.${opExIndex}.${opExField}`;
                 if (opExField === 'amount') { // Handle numeric conversion
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
            if (field === 'experience') {
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
  // Ensure db and setError are the main dependencies now
  }, [db, setError]);

  // Function to add a new person
  const addPersonnel = useCallback(async () => {
    if (!isUserAdmin || !db) {
      setError("Permission denied or database connection error. Cannot add personnel.");
      return;
    }
    setError(null);
    const newPerson = {
      name: 'New Teammate',
      experience: 0,
      assignedRole: null, // Start as unassigned
      skills: [], // Default empty skills array
      notes: '', // Default empty notes
      createdAt: new Date(),
      updatedAt: new Date()
    };
    try {
      const docRef = await addDoc(collection(db, 'personnel'), newPerson);
      console.log("New person added with ID:", docRef.id);
      // Update local state optimistically
      setPersonnel(prev => [...prev, { id: docRef.id, ...newPerson }]);
    } catch (err) {
      console.error("Error adding personnel:", err);
      setError("Failed to add new personnel to the database.");
    }
  }, [db, isUserAdmin, setError, setPersonnel]);

  // Function to delete a person
  const deletePersonnel = useCallback(async (personId) => {
    if (!isUserAdmin || !db || !personId) {
      setError("Permission denied, invalid ID, or database connection error. Cannot delete personnel.");
      return;
    }
    // Optional: Add a confirmation dialog here in a real app
    // if (!window.confirm(`Are you sure you want to delete person ${personId}?`)) {
    //   return;
    // }
    setError(null);
    try {
      await deleteDoc(doc(db, 'personnel', personId));
      console.log("Deleted person with ID:", personId);
      // Update local state
      setPersonnel(prev => prev.filter(p => p.id !== personId));
    } catch (err) {
      console.error("Error deleting personnel:", err);
      setError(`Failed to delete personnel ${personId} from the database.`);
    }
  }, [db, isUserAdmin, setError, setPersonnel]);

  // Render helpers or main render logic
  const renderContent = () => {
    // Handle Auth Loading State FIRST
    if (loadingAuth) {
      return <div className="loading-container">Authenticating... Please wait.</div>;
    }
    
    // Handle No User State (After Auth Check)
    if (!user) {
      return <AuthSection />; // Show login/signup
    }
    
    // Handle Data Loading Error State (If user is logged in but data failed)
    // Check for error *before* checking initialDataLoaded
    if (error) {
        // Display error prominently
        return (
          <div className="error-container">
            <AlertCircle size={48} color="#dc3545" />
            <h2>Application Error</h2>
            <p>{error}</p>
            {/* Simple refresh button */} 
            <button onClick={() => window.location.reload()} className="button-primary">
               Refresh Page
            </button>
             {/* Optionally add a sign-out button here too */} 
             <button onClick={signOut} className="button-secondary" style={{marginLeft: '10px'}}>
                Sign Out
             </button>
          </div>
        );
    }
    
    // Handle Initial Data Loading State (after auth is resolved and no error)
    if (!initialDataLoaded) {
        // Added check for !error here to prevent showing loading when error occurred
        return <div className="loading-container">Loading application data...</div>;
    }
    
    // If authenticated, no error, and data loaded, render tabs
    switch (activeTab) {
       case 'structure':
         // Add checks here specific to this tab's data needs
         return (roles && Array.isArray(personnel)) ? (
           <div className="tab-content structure-tab">
             {/* Add wrapper div for OrgStructure */}
             <div className="hierarchy-column">
               <OrgStructure
                          roles={roles} // Using imported static roles for now
                          personnel={personnel}
                          isUserAdmin={isUserAdmin}
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
                          unassignPerson={handleDropOnAvailable}
                          handleTextChange={handleTextChange}
                          allRoles={roles} // Pass allRoles if OrgStructure needs it
               />
             </div>
             <AvailablePersonnel
                        personnel={personnel}
                        setPersonnel={setPersonnel} // Pass setPersonnel
                        setError={setError}         // Pass setError
                        roles={roles}             // Pass roles
                        isUserAdmin={isUserAdmin}
                        handleDragStart={handleDragStart}
                        handleDragEnd={handleDragEnd}
                        handleDragOver={handleDragOver}
                        handleDropOnAvailable={handleDropOnAvailable}
                        handleDragEnterAvailable={handleDragEnterAvailable}
                        handleDragLeaveAvailable={handleDragLeaveAvailable}
                        addPersonnel={addPersonnel}
                        deletePersonnel={deletePersonnel}
                        handleTextClick={handleTextClick}
                        handleTextBlur={handleTextBlur}
                        handleKeyDown={handleKeyDown}
                        editText={editText}
                        editingId={editingId}
                        handleTextChange={handleTextChange}
             />
          </div>
         ) : <div className="loading-container">Loading structure components...</div>;
       case 'timeline':
         // Check timeline data before rendering
         return Array.isArray(timeline) ? (
           <Timeline 
              timeline={timeline} 
              isUserAdmin={isUserAdmin}
              handleTextClick={handleTextClick}
              handleTextBlur={handleTextBlur}
              handleKeyDown={handleKeyDown}
              editText={editText}
              editingId={editingId}
              handleTextChange={handleTextChange}
              saveTimelineChanges={saveTimelineChanges}
           />
         ) : <div className="loading-container">Loading timeline...</div>;
       case 'budget':
          // Check budgetData before rendering
          // Ensure it's an object, potentially check if it has keys?
          return (budgetData && typeof budgetData === 'object') ? (
             <Budget 
                 budgetData={budgetData} 
                 isUserAdmin={isUserAdmin}
                 handleTextClick={handleTextClick}
                 handleTextBlur={handleTextBlur}
                 handleKeyDown={handleKeyDown}
                 editText={editText}
                 editingId={editingId}
                 handleTextChange={handleTextChange}
                 saveBudgetChanges={saveBudgetChanges}
              />
          ) : <div className="loading-container">Loading budget...</div>;
        case 'analysis':
          // Check roles and personnel for workload analysis
          return (roles && Array.isArray(personnel)) ? (
             <WorkloadAnalysis 
                 roles={roles} // Using imported static roles
                 personnel={personnel} 
                 isUserAdmin={isUserAdmin}
             />
          ) : <div className="loading-container">Loading analysis data...</div>;
       default:
         return <div className="tab-content">Select a tab</div>; // Default content
    }
  };

  return (
    <div className="dashboard-container">
      <Head>
        <title>ReOrg Dashboard</title>
        <meta name="description" content="Organizational Restructuring Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Render AuthSection permanently at the top/header if user is logged in */}
      {/* Check user *before* rendering AuthSection with minimal prop */}
      {user && <AuthSection minimal={true} signOutAction={signOut} userEmail={user.email || 'User'}/>}
      
      {/* Only show tabs if user is logged in */}
      {user && (
          <nav className="sidebar">
            {/* Tab Buttons */}
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
         {renderContent()} { /* Call the function to render content */}
      </main>
    </div>
  );
}