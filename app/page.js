'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronUp, UserCircle, Users, Clipboard, ClipboardCheck, AlertCircle,
         BarChart, Calendar, DollarSign, Home, Beaker, UserPlus, XCircle, Move, Save, Trash2 } from 'lucide-react';
import { getDbInstance } from './firebase/config';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc, addDoc, writeBatch, 
         arrayUnion, arrayRemove } from 'firebase/firestore';
import { roles, timelineData, colors, timelineInitialData, initialBudgetData } from '../lib/data';
import AuthSection from '../components/AuthSection';
import WorkloadAnalysis from '../components/WorkloadAnalysis';
import { useAuth } from '../lib/hooks/useAuth';
import { useInlineEditing } from '../lib/hooks/useInlineEditing';
import PresentationView from '../components/PresentationView';
import ConfirmActionModal from '../components/ConfirmActionModal';

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
  const [factories, setFactories] = useState([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState('');
  const [factoryRoles, setFactoryRoles] = useState({});
  const [personnel, setPersonnel] = useState([]);
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [budgetData, setBudgetData] = useState({});
  const [timeline, setTimeline] = useState([]);
  const [sharedRolesData, setSharedRolesData] = useState({}); // State for shared roles
  const [allRolesData, setAllRolesData] = useState({}); // State for all roles across factories
  const [loadingPresentationData, setLoadingPresentationData] = useState(false); // Loading state for presentation
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Modal state
  const [confirmModalProps, setConfirmModalProps] = useState({}); // Props for modal (message, onConfirm)

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
  // --- REFACTORED: Effect 1 - Load Factories on Auth Ready ---
  useEffect(() => {
    if (!loadingAuth && user) {
      console.log("Auth resolved, loading factories...");
      loadFactories();
    } else if (!loadingAuth && !user) {
       // Clear all state if user logs out or isn't logged in
       console.log("Auth resolved, no user. Clearing state.");
       setFactories([]);
       setSelectedFactoryId('');
       setPersonnel([]);
       setFactoryRoles({});
       setSharedRolesData({});
       setAllRolesData({});
       setTimeline([]);
       setBudgetData({});
       setInitialDataLoaded(false);
       setLoadingPresentationData(false);
       setError(null);
    }
  }, [loadingAuth, user, loadFactories]); // Depends only on auth state and loadFactories callback

  // --- REFACTORED: Effect 2 - Process Factories Once Loaded ---
  useEffect(() => {
    if (factories.length > 0) {
        console.log("Factories loaded, processing...");

        // Set default selected factory ID (if not already set by user interaction)
        if (!selectedFactoryId) {
            const nonShared = factories.filter(f => f.id !== '_shared');
            if (nonShared.length > 0) {
                setSelectedFactoryId(nonShared[0].id);
                console.log("Default factory selected:", nonShared[0].id);
            } else {
                 console.log("No non-shared factories found, no default selection.");
                 setSelectedFactoryId(''); // Ensure it's cleared if only _shared exists
            }
        }

        // Load global personnel data 
        console.log("Loading global personnel data...");
        loadPersonnel().then(loadedPersonnel => {
            setPersonnel(loadedPersonnel || []);
            console.log("Global personnel loaded.");
        }).catch(err => {
             console.error("Error loading personnel:", err);
             setError(prev => prev ? prev + "\nFailed to load personnel." : "Failed to load personnel.");
        });

        // Load shared roles data
        console.log("Loading shared roles data...");
        loadRoles('_shared').then(loadedSharedRoles => {
            setSharedRolesData(loadedSharedRoles || {});
            console.log("Shared roles loaded.");
        }).catch(err => {
            console.error("Error loading shared roles:", err);
            setError(prev => prev ? prev + "\nFailed to load shared roles." : "Failed to load shared roles.");
        });

        // Load all roles data for presentation view
        console.log("Loading all roles data for presentation...");
        setLoadingPresentationData(true);
        const allRolePromises = factories.map(f => loadRoles(f.id));
        Promise.all(allRolePromises).then(rolesArrays => {
            const combinedRoles = {};
            factories.forEach((factory, index) => {
                combinedRoles[factory.id] = rolesArrays[index] || {};
            });
            setAllRolesData(combinedRoles);
            console.log("All roles data loaded successfully.");
        }).catch(err => {
            console.error("Error loading all roles data:", err);
            setError(prev => prev ? prev + "\nFailed to load roles for overview." : "Failed to load roles for overview.");
            setAllRolesData({}); 
        }).finally(() => {
            setLoadingPresentationData(false);
        });

    } else {
        // If factories array becomes empty (e.g., after deleting last one), clear related state
        // This might be redundant if handled by the first effect on logout/no user
        // but can be kept for robustness
        setSelectedFactoryId('');
        setPersonnel([]);
        setFactoryRoles({});
        setSharedRolesData({});
        setAllRolesData({});
        setTimeline([]);
        setBudgetData({});
        setInitialDataLoaded(false);
    }
    // This effect runs when the factories list changes
  }, [factories, loadPersonnel, loadRoles]); // Removed selectedFactoryId setter logic dep, runs when factories list itself changes

  // --- REFACTORED: Effect 3 - Load Data for Selected Factory ---
  useEffect(() => {
      // Only run if a valid, non-shared factory is selected
      if (selectedFactoryId && selectedFactoryId !== '_shared') {
          console.log(`Selected factory changed to: ${selectedFactoryId}. Loading its data...`);
          setError(null); // Clear errors from previous selection
          setInitialDataLoaded(false); // Reset loading flag for factory-specific data

          const loadFactoryData = async () => {
              try {
                  const [loadedRoles, loadedTimeline, loadedBudget] = await Promise.all([
                      loadRoles(selectedFactoryId),
                      loadTimeline(selectedFactoryId),
                      loadBudget(selectedFactoryId)
                  ]);
                  setFactoryRoles(loadedRoles || {});
                  setTimeline(loadedTimeline || []);
                  setBudgetData(loadedBudget || {});
                  setInitialDataLoaded(true); // Factory data loaded
                   console.log(`Data loaded successfully for factory: ${selectedFactoryId}`);
              } catch (err) {
                   console.error(`Error loading data for factory ${selectedFactoryId}:`, err);
                   setError(`Failed to load data for factory ${factories.find(f=>f.id===selectedFactoryId)?.name || selectedFactoryId}. Error: ${err.message}`);
                   // Clear potentially stale data
                   setFactoryRoles({});
                   setTimeline([]);
                   setBudgetData({});
                   setInitialDataLoaded(false); // Indicate loading failed
              }
          };
          loadFactoryData();
          
      } else {
            // If no factory selected (or _shared somehow selected), clear factory-specific state
            console.log("No valid factory selected or selection cleared. Clearing factory-specific state.");
            setFactoryRoles({});
            setTimeline([]);
            setBudgetData({});
            setInitialDataLoaded(true); // Consider it 'loaded' in the sense that no data is expected
      }
      // This effect runs when the selectedFactoryId changes
  }, [selectedFactoryId, loadRoles, loadTimeline, loadBudget]); // Only depends on the selected ID and load functions

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

  const loadTimeline = useCallback(async (factoryId) => {
    if (!factoryId) return [];
    const db = getDbInstance();
    if (!db) {
        console.error("Load Timeline: DB not available");
        setError(prev => prev ? prev + "\nDB connection lost." : "DB connection lost.");
        return [];
    }
    try {
        const docRef = doc(db, 'factories', factoryId, 'timeline', 'current');
        const docSnap = await getDoc(docRef);
        let loadedTimeline = [];
        if (docSnap.exists()) {
          const data = docSnap.data();
          loadedTimeline = data && Array.isArray(data.phases) ? data.phases : timelineInitialData;
        } else {
          loadedTimeline = timelineInitialData;
          await setDoc(docRef, { phases: timelineInitialData });
          console.log("Timeline document created for factory", factoryId);
        }
        console.log("Timeline loaded for factory", factoryId, ":", loadedTimeline.length, "phases");
        return loadedTimeline;
    } catch (err) {
        console.error("Error loading timeline for factory", factoryId, ":", err);
        setError(prev => prev ? prev + "\nFailed to load timeline for " + factoryId + "." : "Failed to load timeline for " + factoryId + ".");
        return timelineInitialData;
    }
  }, [setError]);

  const loadBudget = useCallback(async (factoryId) => {
     if (!factoryId) return {};
     const db = getDbInstance();
     if (!db) {
        console.error("Load Budget: DB not available");
        setError(prev => prev ? prev + "\nDB connection lost." : "DB connection lost.");
        return {};
     }
     try {
        const docRef = doc(db, 'factories', factoryId, 'budget', 'current');
        const docSnap = await getDoc(docRef);
        let loadedBudget = {};
        if (docSnap.exists()) {
          const data = docSnap.data();
          loadedBudget = data && typeof data.factories === 'object' && data.factories !== null ? data.factories : initialBudgetData;
        } else {
          loadedBudget = initialBudgetData;
          await setDoc(docRef, { factories: initialBudgetData });
          console.log("Budget document created for factory", factoryId);
        }
        console.log("Budget loaded for factory", factoryId, ":", Object.keys(loadedBudget).length, "factories");
        return loadedBudget;
    } catch (err) {
        console.error("Error loading budget for factory", factoryId, ":", err);
        setError(prev => prev ? prev + "\nFailed to load budget for " + factoryId + "." : "Failed to load budget for " + factoryId + ".");
        return initialBudgetData;
    }
  }, [setError]);

  const loadFactories = useCallback(async () => {
      const db = getDbInstance();
      if (!db) {
          console.error("Load Factories: DB not available");
          setError("DB connection lost. Cannot load factories.");
          return [];
      }
      try {
          const querySnapshot = await getDocs(collection(db, 'factories'));
          const loadedFactories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log("Factories loaded:", loadedFactories.length);
          if (loadedFactories.length > 0) {
              setFactories(loadedFactories);
              // Set default selection, excluding '_shared' if possible
              const nonSharedFactories = loadedFactories.filter(f => f.id !== '_shared');
              if (!selectedFactoryId && nonSharedFactories.length > 0) {
                  setSelectedFactoryId(nonSharedFactories[0].id);
                  console.log("Default factory set:", nonSharedFactories[0].id);
              } else if (!selectedFactoryId && loadedFactories.length > 0) {
                   // If only '_shared' exists, don't select anything by default
                   setSelectedFactoryId(''); 
                   console.log("Only shared factory found, no default selection.");
              }
          } else {
               setFactories([]);
               setSelectedFactoryId('');
               console.log("No factories found.");
               setError("No focus factories found. Please configure factories in the database.");
          }
          return loadedFactories;
      } catch (err) {
          console.error("Error loading factories:", err);
          setError(prev => (prev ? prev + "\nFailed to load factories." : "Failed to load factories."));
          setFactories([]);
          setSelectedFactoryId('');
          return [];
      }
  }, [setError, selectedFactoryId]);

  const loadRoles = useCallback(async (factoryId) => {
      if (!factoryId) {
          console.log("loadRoles skipped: no factoryId provided.");
          return {};
      }
      const db = getDbInstance();
      if (!db) {
          console.error("Load Roles: DB not available");
          setError(prev => prev ? prev + "\nDB connection lost." : "DB connection lost.");
          return {};
      }
      try {
          const rolesRef = collection(db, 'factories', factoryId, 'roles');
          const querySnapshot = await getDocs(rolesRef);
          const loadedRoles = {};
          querySnapshot.forEach(doc => {
              loadedRoles[doc.id] = { id: doc.id, ...doc.data() };
          });
          console.log(`Roles loaded for factory ${factoryId}:`, Object.keys(loadedRoles).length);
           if (Object.keys(loadedRoles).length === 0) {
               console.warn(`No roles found for factory ${factoryId}. Consider adding default roles.`);
           }
          return loadedRoles;
      } catch (err) {
          console.error(`Error loading roles for factory ${factoryId}:`, err);
          setError(prev => prev ? prev + "\nFailed to load roles for factory " + factoryId + "." : "Failed to load roles for factory " + factoryId + ".");
          return {};
      }
  }, [setError]);

  // --- NEW: Add Factory ---
  const addFactory = useCallback(async () => {
      const db = getDbInstance();
      if (!isUserAdmin || !db) {
          setError("Permission denied or database error. Cannot add factory.");
          return;
      }
      setError(null);

      const factoryBaseName = "New Focus Factory";
      let newFactoryName = factoryBaseName;
      let counter = 1;
      // Simple check to avoid immediate name collision (more robust check might involve querying)
      while (factories.some(f => f.name === newFactoryName)) {
          newFactoryName = `${factoryBaseName} ${++counter}`;
      }

      const newFactoryData = {
          name: newFactoryName,
          description: "", // Add a default description field if desired
          createdAt: new Date()
          // Add any other default fields for a new factory here
      };

      try {
          const docRef = await addDoc(collection(db, 'factories'), newFactoryData);
          console.log("New factory added with ID:", docRef.id);
          const addedFactory = { id: docRef.id, ...newFactoryData };

          // Refresh factory list and select the new one
          setFactories(prev => [...prev, addedFactory]);
          setSelectedFactoryId(docRef.id);

          // Optionally, seed initial data (roles, timeline, budget) for the new factory
          // Example: Seed initial budget
          const initialBudget = initialBudgetData; // Use imported initial data
          const budgetDocRef = doc(db, 'factories', docRef.id, 'budget', 'current');
          await setDoc(budgetDocRef, { factories: initialBudget, createdAt: new Date() }); // Assuming budget structure key is 'factories'
          console.log(`Initial budget seeded for factory ${docRef.id}`);

          // Example: Seed initial timeline
          const initialTimeline = timelineInitialData; // Use imported initial data
          const timelineDocRef = doc(db, 'factories', docRef.id, 'timeline', 'current');
          await setDoc(timelineDocRef, { phases: initialTimeline, createdAt: new Date() });
          console.log(`Initial timeline seeded for factory ${docRef.id}`);

          // Example: Seed initial roles (might copy from lib/data or have a minimal default)
          // This is more complex as lib/data roles include JSX icons
          // A simpler approach might be to create one default role or leave it empty
          // const rolesRef = collection(db, 'factories', docRef.id, 'roles');
          // await addDoc(rolesRef, { title: "Default Role", responsibilities: [], createdAt: new Date() });
          // console.log(`Initial role seeded for factory ${docRef.id}`);
          // For now, let's not seed roles automatically, requires manual setup or separate seeding script

          // Manually trigger load for the new factory's data if needed, though selection change should handle it.
          // loadRoles(docRef.id).then(setFactoryRoles);
          // loadTimeline(docRef.id).then(setTimeline);
          // loadBudget(docRef.id).then(setBudgetData);

      } catch (err) {
          console.error("Error adding factory:", err);
          setError("Failed to add new factory to the database.");
      }
  }, [isUserAdmin, setError, setFactories, setSelectedFactoryId, factories, initialBudgetData, timelineInitialData]); // Added dependencies

  // --- NEW: Delete Factory (Uses Modal) ---
  const deleteFactory = useCallback(async () => {
      if (!isUserAdmin || !selectedFactoryId) {
          setError("Permission denied or no factory selected.");
          return;
      }
      const factoryToDelete = factories.find(f => f.id === selectedFactoryId);
      if (!factoryToDelete) {
          setError("Cannot delete: Selected factory not found.");
          return;
      }

      // Set props for the modal and open it
      setConfirmModalProps({
          title: "Delete Factory?",
          message: `Are you sure you want to permanently delete the factory "${factoryToDelete.name || selectedFactoryId}"? This cannot be undone. (Note: Sub-data like roles/timeline/budget won't be automatically deleted.)`,
          onConfirm: async () => {
              setIsConfirmModalOpen(false); // Close modal first
              const db = getDbInstance();
              if (!db) {
                  setError("Database connection error.");
                  return;
              }
              setError(null);
              try {
                  await deleteDoc(doc(db, 'factories', selectedFactoryId));
                  console.log("Deleted factory with ID:", selectedFactoryId);
                  const remainingFactories = factories.filter(f => f.id !== selectedFactoryId);
                  setFactories(remainingFactories);
                  const nextSelectedId = remainingFactories.length > 0 ? remainingFactories[0].id : '';
                  setSelectedFactoryId(nextSelectedId);
                  if (!nextSelectedId) { // Clear data if no factory left
                    setFactoryRoles({});
                    setTimeline([]);
                    setBudgetData({});
                  }
              } catch (err) { 
                  console.error("Error deleting factory:", err);
                  setError(`Failed to delete factory ${factoryToDelete.name || selectedFactoryId}. Error: ${err.message}`);
              }
          }
      });
      setIsConfirmModalOpen(true);

  }, [isUserAdmin, selectedFactoryId, factories, setError, setFactories, setSelectedFactoryId]);

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
    const previousRole = draggedPerson.assignedRoleKey;
    const previousFactory = draggedPerson.assignedFactoryId;

    if (!personId) {
        setError("Cannot assign role: Invalid person data.");
        console.error("handleDropOnRole: Missing personId in draggedPerson", draggedPerson);
        return;
    }

    // Determine if the target role is shared or belongs to the selected factory
    const isSharedRole = sharedRolesData && sharedRolesData[roleKey];
    const targetFactoryId = isSharedRole ? '_shared' : selectedFactoryId;

    // Check if a valid factory context exists (either selected or it's a shared role drop)
    if (!targetFactoryId) {
        setError("Cannot assign role: No target factory context (selected or shared).");
        return;
    }

    // Prevent drop if it's the same role in the same factory (or shared context)
    if (previousRole === roleKey && previousFactory === targetFactoryId) return;

    // Optimistic update locally
    setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRoleKey: roleKey, assignedFactoryId: targetFactoryId } : p));

    try {
      if (!db) throw new Error("Database connection lost during update.");
      // Update the personnel document with the new factory (or _shared) and role
      await updateDoc(doc(db, 'personnel', personId), {
        assignedRoleKey: roleKey,
        assignedFactoryId: targetFactoryId, // Use targetFactoryId
        updatedAt: new Date()
      });
      console.log(`Assigned ${personId} to ${roleKey} in factory ${targetFactoryId}`);
    } catch (err) {
      setError('Failed to assign role. Reverting change.');
      console.error('Error updating assignment:', err);
      setPersonnel(prev => prev.map(p => p.id === personId ? { ...p, assignedRoleKey: previousRole, assignedFactoryId: previousFactory } : p));
    }
    setDraggedPerson(null);
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

  // --- MODIFIED: Wrap getOriginalText in useCallback ---
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

  // --- MODIFIED: Wrap updateLocalState in useCallback ---
  const updateLocalState = useCallback((id, newValue) => {
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

                if (field === 'phase') newTimeline[phaseIndex].phase = newValue;
                else if (field === 'timeframe') newTimeline[phaseIndex].timeframe = newValue;
                else if (field === 'activity') {
                    if (parts.length < 4) return prev;
                    const activityIndex = parseInt(parts[3], 10);
                    if (!Array.isArray(newTimeline[phaseIndex].activities) || isNaN(activityIndex) || activityIndex < 0 || activityIndex >= newTimeline[phaseIndex].activities.length) return prev;
                    newTimeline[phaseIndex].activities[activityIndex] = newValue;
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
                    newBudgetData[factoryId].name = newValue;
                } else if (categoryKey === 'productionVolume') {
                    const numValue = Number(newValue);
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
                         const numValue = Number(newValue);
                         currentRole[roleField] = isNaN(numValue) ? 0 : numValue;
                    } else {
                         currentRole[roleField] = newValue;
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
                       const numValue = Number(newValue);
                       currentItem[opExField] = isNaN(numValue) ? 0 : numValue;
                    } else {
                       currentItem[opExField] = newValue;
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
                        let updatedValue = newValue;
                        if (field === 'skills' && typeof newValue === 'string') {
                           updatedValue = newValue.split(',').map(s => s.trim()).filter(Boolean);
                        } else if (field === 'experience') {
                           const numValue = Number(newValue);
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

  // --- MODIFIED: Update Firestore Data (Handles Array Updates for Roles) ---
  const updateFirestoreData = useCallback(async (id, value) => {
    const db = getDbInstance();
    if (!id || typeof id !== 'string' || !db || !selectedFactoryId) {
        if (!db) setError("Database error. Cannot save changes.");
        else setError("Invalid data reference or factory selection. Cannot save changes.");
        return false;
    }

    const parts = id.split('-');
    if (parts.length < 3) {
        setError("Invalid data structure for saving (ID format).");
        console.error("Invalid ID format for updateFirestoreData:", id);
        return false;
    }
    const type = parts[0];
    const docId = parts[1]; // Role Key or Person ID
    const field = parts[2]; // Top-level field or category

    try {
        let docRef;
        let updatePayload = {};

        if (type === 'personnel') {
            // Handle personnel updates (as before)
            docRef = doc(db, 'personnel', docId);
            let updateValue = value;
            if (field === 'skills' && typeof value === 'string') {
                updateValue = value.split(',').map(s => s.trim()).filter(Boolean);
            } else if (field === 'experience') {
                const numValue = Number(value);
                updateValue = isNaN(numValue) ? 0 : numValue;
            }
            updatePayload = { [field]: updateValue, updatedAt: new Date() };
            await updateDoc(docRef, updatePayload);
            console.log(`Updated personnel ${docId} field ${field}`);

        } else if (type === 'role') {
            // Handle role updates
            docRef = doc(db, 'factories', selectedFactoryId, 'roles', docId);

            if (field === 'title') { // Simple field update
                 updatePayload = { title: value, updatedAt: new Date() };
                 await updateDoc(docRef, updatePayload);
                 console.log(`Updated role ${docId} field title`);

            } else if (field === 'responsibility') { // Basic responsibility item update
                 if (parts.length < 4) throw new Error('Invalid role responsibility ID');
                 const index = parseInt(parts[3], 10);
                 if (isNaN(index)) throw new Error('Invalid index in role responsibility ID');

                 // Need to fetch current array, modify, and update the whole array
                 const roleSnap = await getDoc(docRef);
                 if (!roleSnap.exists()) throw new Error('Role not found for update');
                 const currentData = roleSnap.data();
                 const currentResponsibilities = Array.isArray(currentData.responsibilities) ? [...currentData.responsibilities] : [];
                 if (index >= 0 && index < currentResponsibilities.length) {
                     currentResponsibilities[index] = value; // Update the item at index
                     updatePayload = { responsibilities: currentResponsibilities, updatedAt: new Date() };
                     await updateDoc(docRef, updatePayload);
                     console.log(`Updated role ${docId} responsibility at index ${index}`);
                 } else {
                     throw new Error(`Invalid index ${index} for responsibilities array`);
                 }

            } else if (field === 'detailedResponsibility') { // Detailed responsibility item update
                 if (parts.length < 5) throw new Error('Invalid role detailed responsibility ID');
                 const category = parts[3];
                 const index = parseInt(parts[4], 10);
                 if (isNaN(index) || !category) throw new Error('Invalid category/index in role detailed responsibility ID');

                 const roleSnap = await getDoc(docRef);
                 if (!roleSnap.exists()) throw new Error('Role not found for update');
                 const currentData = roleSnap.data();
                 const currentDetailed = currentData.detailedResponsibilities ? JSON.parse(JSON.stringify(currentData.detailedResponsibilities)) : {};
                 
                 if (currentDetailed[category] && Array.isArray(currentDetailed[category]) && index >= 0 && index < currentDetailed[category].length) {
                     currentDetailed[category][index] = value; // Update item at index
                     // Use dot notation for updating nested map fields
                     updatePayload[`detailedResponsibilities.${category}`] = currentDetailed[category]; 
                     updatePayload.updatedAt = new Date();
                     await updateDoc(docRef, updatePayload); 
                     console.log(`Updated role ${docId} detailed responsibility in category ${category} at index ${index}`);
                 } else {
                    throw new Error(`Invalid category ${category} or index ${index} for detailed responsibilities array`);
                 }
            } else {
                 // Handle other simple role fields if needed (e.g., salary, department)
                 // updatePayload = { [field]: value, updatedAt: new Date() }; 
                 // await updateDoc(docRef, updatePayload);
                 // console.log(`Updated role ${docId} field ${field}`);
                 console.warn(`Unhandled role field update for: ${field}`);
                 return false; // Indicate unhandled update
            }
        } 
        // Add handling for timeline, budget if they use this same update function
        // else if (type === 'timeline') { ... }
        // else if (type === 'budget') { ... }
        
        else {
            console.warn("updateFirestoreData: Unrecognized type:", type);
            setError(`Cannot save changes for unknown data type: ${type}`);
            return false;
        }

        return true; // Indicate success

    } catch (error) {
        console.error(`Error updating Firestore for id ${id}:`, error);
        setError(`Failed to save changes for ${id}. Details: ${error.message}`);
        return false;
    }
  }, [setError, selectedFactoryId]); // Added selectedFactoryId dependency

  // --- NEW: Add Responsibility ---
  const addResponsibility = useCallback(async (roleId, type, category = null) => {
      const db = getDbInstance();
      if (!isUserAdmin || !db || !selectedFactoryId || !roleId) {
          setError("Permission denied, missing IDs, or database error. Cannot add responsibility.");
          return;
      }
      setError(null);

      const newItemText = "New responsibility item"; // Default text
      let updatePayload = {};
      let updateFieldPath = '';

      try {
          const roleDocRef = doc(db, 'factories', selectedFactoryId, 'roles', roleId);

          if (type === 'basic') {
              updateFieldPath = 'responsibilities';
              updatePayload[updateFieldPath] = arrayUnion(newItemText);
          } else if (type === 'detailed' && category) {
              updateFieldPath = `detailedResponsibilities.${category}`;
              // Need to ensure the category array exists first, or handle differently
              // Using arrayUnion might create the field if it doesn't exist, but behavior might vary.
              // Safer: Fetch, check/create category array, then update.
              const roleSnap = await getDoc(roleDocRef);
              if (!roleSnap.exists()) throw new Error('Role not found');
              const currentData = roleSnap.data();
              const currentDetailed = currentData.detailedResponsibilities || {};
              const currentCategoryArray = Array.isArray(currentDetailed[category]) ? currentDetailed[category] : [];
              
              updatePayload[updateFieldPath] = [...currentCategoryArray, newItemText]; // Overwrite with new array including added item
              
          } else {
              throw new Error('Invalid type or missing category for addResponsibility');
          }

          updatePayload.updatedAt = new Date();
          await updateDoc(roleDocRef, updatePayload); 
          console.log(`Added responsibility to role ${roleId}, field ${updateFieldPath}`);

          // Update local state
          setFactoryRoles(prev => {
              const updatedRoles = { ...prev };
              if (!updatedRoles[roleId]) return prev; // Safety check

              if (type === 'basic') {
                  const currentResponsibilities = Array.isArray(updatedRoles[roleId].responsibilities) ? updatedRoles[roleId].responsibilities : [];
                  updatedRoles[roleId] = { ...updatedRoles[roleId], responsibilities: [...currentResponsibilities, newItemText] };
              } else if (type === 'detailed' && category) {
                   const currentDetailed = updatedRoles[roleId].detailedResponsibilities || {};
                   const currentCategoryArray = Array.isArray(currentDetailed[category]) ? currentDetailed[category] : [];
                   updatedRoles[roleId] = { 
                       ...updatedRoles[roleId],
                       detailedResponsibilities: {
                           ...currentDetailed,
                           [category]: [...currentCategoryArray, newItemText]
                       } 
                   };
              }
              return updatedRoles;
          });

      } catch (err) {
          console.error("Error adding responsibility:", err);
          setError(`Failed to add responsibility. Error: ${err.message}`);
      }
  }, [isUserAdmin, selectedFactoryId, setError, setFactoryRoles]); // Removed firebase.firestore.FieldValue

  // --- NEW: Delete Responsibility ---
  const deleteResponsibility = useCallback(async (roleId, type, category = null, itemToRemove) => {
      const db = getDbInstance();
      if (!isUserAdmin || !db || !selectedFactoryId || !roleId || itemToRemove === undefined) {
          setError("Permission denied, missing IDs/item, or database error. Cannot delete responsibility.");
          return;
      }
      setError(null);

      let updatePayload = {};
      let updateFieldPath = '';

      try {
          const roleDocRef = doc(db, 'factories', selectedFactoryId, 'roles', roleId);

          if (type === 'basic') {
              updateFieldPath = 'responsibilities';
              updatePayload[updateFieldPath] = arrayRemove(itemToRemove);
          } else if (type === 'detailed' && category) {
              updateFieldPath = `detailedResponsibilities.${category}`;
              // arrayRemove works on nested fields
              updatePayload[updateFieldPath] = arrayRemove(itemToRemove);
          } else {
              throw new Error('Invalid type or missing category for deleteResponsibility');
          }

          updatePayload.updatedAt = new Date();
          await updateDoc(roleDocRef, updatePayload);
          console.log(`Removed responsibility from role ${roleId}, field ${updateFieldPath}`);

          // Update local state
          setFactoryRoles(prev => {
              const updatedRoles = { ...prev };
              if (!updatedRoles[roleId]) return prev;

              if (type === 'basic') {
                  const currentResponsibilities = Array.isArray(updatedRoles[roleId].responsibilities) ? updatedRoles[roleId].responsibilities : [];
                  updatedRoles[roleId] = { ...updatedRoles[roleId], responsibilities: currentResponsibilities.filter(item => item !== itemToRemove) };
              } else if (type === 'detailed' && category) {
                  const currentDetailed = updatedRoles[roleId].detailedResponsibilities || {};
                  const currentCategoryArray = Array.isArray(currentDetailed[category]) ? currentDetailed[category] : [];
                   updatedRoles[roleId] = { 
                       ...updatedRoles[roleId],
                       detailedResponsibilities: {
                           ...currentDetailed,
                           [category]: currentCategoryArray.filter(item => item !== itemToRemove)
                       } 
                   };
              }
              return updatedRoles;
          });

      } catch (err) {
          console.error("Error deleting responsibility:", err);
          setError(`Failed to delete responsibility. Error: ${err.message}`);
      }
  }, [isUserAdmin, selectedFactoryId, setError, setFactoryRoles]); // Removed firebase.firestore.FieldValue

  // --- NEW: Add Personnel ---
  const addPersonnel = useCallback(async () => {
      const db = getDbInstance();
      if (!isUserAdmin || !db) {
          setError("Permission denied or database error. Cannot add personnel.");
          return;
      }
      setError(null);

      const newPersonData = {
          name: "New Person",
          experience: 0, // Default experience
          skills: [],
          notes: "",
          assignedFactoryId: null, // Not assigned initially
          assignedRoleKey: null,   // Not assigned initially
          createdAt: new Date(),
          updatedAt: new Date()
      };

      try {
          const docRef = await addDoc(collection(db, 'personnel'), newPersonData);
          console.log("New personnel added with ID:", docRef.id);

          // Update local state optimistically
          setPersonnel(prev => [...prev, { id: docRef.id, ...newPersonData }]);

      } catch (err) {
          console.error("Error adding personnel:", err);
          setError("Failed to add new personnel to the database.");
      }
  }, [isUserAdmin, setError, setPersonnel]);

  // --- NEW: Delete Personnel (Uses Modal) ---
  const deletePersonnel = useCallback(async (personId) => {
    if (!isUserAdmin || !personId) {
      setError("Permission denied or invalid ID. Cannot delete personnel.");
      return;
    }
    const personToDelete = personnel.find(p => p.id === personId);
    if (!personToDelete) {
      setError("Cannot delete: Person not found.");
      return;
    }

    // Set props for the modal and open it
    setConfirmModalProps({
        title: "Delete Person?",
        message: `Are you sure you want to permanently delete "${personToDelete.name || personId}"? This cannot be undone.`,
        onConfirm: async () => {
            setIsConfirmModalOpen(false); // Close modal
            const db = getDbInstance();
            if (!db) {
                 setError("Database connection error.");
                 return;
            }
             setError(null);
            try {
                await deleteDoc(doc(db, 'personnel', personId));
                console.log("Deleted personnel with ID:", personId);
                setPersonnel(prev => prev.filter(p => p.id !== personId));
            } catch (err) {
                console.error("Error deleting personnel:", err);
                setError(`Failed to delete ${personToDelete.name || personId}. Error: ${err.message}`);
            }
        }
    });
    setIsConfirmModalOpen(true);

  }, [isUserAdmin, personnel, setError, setPersonnel]);

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

  // --- NEW: Add Role --- 
  const addRole = useCallback(async () => {
    const db = getDbInstance();
    if (!isUserAdmin || !db || !selectedFactoryId) {
      setError("Permission denied, no factory selected, or database error. Cannot add role.");
      return;
    }
    setError(null);

    // Generate a unique key/ID for the new role (using Firestore\'s auto-ID)
    const newRoleData = {
        title: "New Role",
        responsibilities: [],
        detailedResponsibilities: {},
        kpis: [],
        skills: [],
        nextRoles: [],
        color: colors.gray, // Default color
        salary: "",
        department: "",
        createdAt: new Date()
        // Add icon handling later if needed
    };

    try {
        const rolesCollectionRef = collection(db, 'factories', selectedFactoryId, 'roles');
        const docRef = await addDoc(rolesCollectionRef, newRoleData);
        console.log("New role added with ID:", docRef.id);

        // Update local state optimistically
        setFactoryRoles(prev => ({
            ...prev,
            [docRef.id]: { id: docRef.id, ...newRoleData } 
        }));

    } catch (err) {
        console.error("Error adding role:", err);
        setError(`Failed to add new role to factory ${selectedFactoryId}.`);
    }
  }, [isUserAdmin, selectedFactoryId, setError, setFactoryRoles, colors.gray]);

  // --- NEW: Delete Role (Uses Modal) --- 
  const deleteRole = useCallback(async (roleIdToDelete) => {
    if (!isUserAdmin || !selectedFactoryId || !roleIdToDelete) {
      setError("Permission denied or invalid data. Cannot delete role.");
      return;
    }
    const assignedPersonnelCount = personnel.filter(p => p.assignedFactoryId === selectedFactoryId && p.assignedRoleKey === roleIdToDelete).length;
    if (assignedPersonnelCount > 0) {
      setError(`Cannot delete role: ${assignedPersonnelCount} personnel still assigned. Please reassign them first.`);
      return;
    }
    const roleToDelete = factoryRoles[roleIdToDelete];
    if (!roleToDelete) {
      setError("Cannot delete: Role not found.");
      return;
    }

    // Set props for the modal and open it
    setConfirmModalProps({
        title: "Delete Role?",
        message: `Are you sure you want to permanently delete the role "${roleToDelete.title || roleIdToDelete}"? This cannot be undone.`,
        onConfirm: async () => {
            setIsConfirmModalOpen(false); // Close modal
            const db = getDbInstance();
            if (!db) {
                 setError("Database connection error.");
                 return;
            }
            setError(null);
            try {
                await deleteDoc(doc(db, 'factories', selectedFactoryId, 'roles', roleIdToDelete));
                console.log("Deleted role with ID:", roleIdToDelete, "from factory", selectedFactoryId);
                setFactoryRoles(prev => {
                    const newState = { ...prev };
                    delete newState[roleIdToDelete];
                    return newState;
                });
            } catch (err) {
                console.error("Error deleting role:", err);
                setError(`Failed to delete role ${roleToDelete.title || roleIdToDelete}. Error: ${err.message}`);
            }
        }
    });
    setIsConfirmModalOpen(true);

  }, [isUserAdmin, selectedFactoryId, personnel, factoryRoles, setError, setFactoryRoles]);

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
                          roles={factoryRoles} 
                          personnel={personnel.filter(p => p.assignedFactoryId === selectedFactoryId && p.assignedRoleKey)}
                          isUserAdmin={isUserAdmin}
                          allRoles={factoryRoles} 
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
                          addRole={addRole}
                          deleteRole={deleteRole}
                          // --- Pass Responsibility Handlers ---
                          addResponsibility={addResponsibility}
                          deleteResponsibility={deleteResponsibility}
                          // --- Pass Shared Data ---
                          sharedRolesData={sharedRolesData}
                          sharedPersonnel={personnel.filter(p => p.assignedFactoryId === '_shared')}
               />
             </div>
             <AvailablePersonnel
                        personnel={personnel.filter(p => !p.assignedRoleKey)}
                        setPersonnel={setPersonnel} 
                        setError={setError}         
                        roles={factoryRoles}             
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
                 roles={factoryRoles} 
                 personnel={personnel} 
                 isUserAdmin={isUserAdmin}
             />
          ) : <div className="loading-container">Loading analysis data...</div>;
        case 'presentation':
          // Show loading state while fetching all roles (now might be tied to initial load)
          if (loadingPresentationData) {
              return <div className="loading-container">Loading overview data...</div>;
          }
          // Show error if loading failed for overview roles
          if (error && (error.includes("Failed to load roles for overview") || error.includes("Failed to load shared roles"))) {
              return (
                  <div className="error-banner" style={{ margin: '20px' }}>
                      <AlertCircle size={18} style={{ marginRight: '8px' }} />
                      {error} // Show the specific error related to overview data load
                  </div>
              );
          }
          // Render view if data is ready (even if empty)
          return (
              <PresentationView 
                  factories={factories} // Pass all factories (incl. _shared)
                  allPersonnel={personnel}
                  allRolesData={allRolesData}
              />
          );
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
            <button 
              className={`tab-button ${activeTab === 'presentation' ? 'active' : ''}`}
              onClick={() => setActiveTab('presentation')}
            >
              <Home size={18} /> Overview
            </button>
          </nav>
      )}

      <main className={`main-content ${!user ? 'logged-out' : ''}`}>
         {/* Render Factory Selector only if logged in and factories exist */}
        {user && (
            <div className="factory-selector-container" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', padding: '10px', background: '#f9f9f9', borderRadius: '5px' }}>
                <label htmlFor="factorySelect" style={{ marginRight: '10px'}}>Select Focus Factory: </label>
                <select
                    id="factorySelect"
                    value={selectedFactoryId}
                    onChange={(e) => {
                        console.log("Factory selected:", e.target.value);
                        setSelectedFactoryId(e.target.value);
                    }}
                    disabled={factories.length === 0} // Disable if no factories
                    style={{ flexGrow: 1, marginRight: '10px' }}
                >
                    {factories.length === 0 && <option>No Factories Available</option>}
                    {/* Filter out '_shared' factory from dropdown */}
                    {factories.filter(f => f.id !== '_shared').map(factory => (
                        <option key={factory.id} value={factory.id}>
                            {factory.name || factory.id}
                        </option>
                    ))}
                    {/* Indicate if only shared exists */}
                    {factories.length > 0 && factories.every(f => f.id === '_shared') && (
                        <option disabled>Configure Non-Shared Factories</option>
                    )}
                </select>
                 {/* --- Add Factory Button --- */}
                {isUserAdmin && (
                    <button
                        onClick={addFactory}
                        className="button-primary button-small" // Add styles as needed
                        title="Add a new focus factory"
                        style={{ whiteSpace: 'nowrap', marginRight: '10px' }} // Added margin
                    >
                        + Add Factory
                    </button>
                )}
                 {/* --- Delete Factory Button --- */}
                {isUserAdmin && selectedFactoryId && factories.length > 0 && (
                     <button
                         onClick={deleteFactory}
                         className="button-danger button-small" // Add styles as needed
                         title={`Delete the selected factory (${factories.find(f=>f.id===selectedFactoryId)?.name || selectedFactoryId})`}
                         style={{ whiteSpace: 'nowrap' }}
                     >
                         <Trash2 size={14} style={{ marginRight: '4px' }} /> Delete Factory
                     </button>
                )}
            </div>
        )}
         {renderContent()}
      </main>

      {/* --- Render Confirmation Modal (use renamed component) --- */}
      <ConfirmActionModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmModalProps.onConfirm} // Pass the specific confirm action
        title={confirmModalProps.title}
        message={confirmModalProps.message}
      />

    </div>
  );
}