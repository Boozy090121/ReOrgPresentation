'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
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
import { useIsClient } from '../lib/hooks/useIsClient';

// --- DIAGNOSTIC: Revert to Static Imports ---
import OrgStructure from '../components/OrgStructure';
import AvailablePersonnel from '../components/AvailablePersonnel';
import RoleCard from '../components/RoleCard'; // Consider if this still causes issues
import Timeline from '../components/Timeline';
import Budget from '../components/Budget';
// ConfirmActionModal already imported statically

// Main Dashboard component
export default function Dashboard() {
  // --- DIAGNOSTIC: Use hardcoded initial state, disable loading effects ---
  const [activeTab, setActiveTab] = useState('structure');
  const [factories, setFactories] = useState([{id: 'temp1', name: 'Temp Factory'}]); // Hardcoded
  const [selectedFactoryId, setSelectedFactoryId] = useState('temp1'); // Hardcoded
  const [factoryRoles, setFactoryRoles] = useState({}); // Empty
  const [personnel, setPersonnel] = useState([]); // Empty
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(true); // Assume loaded
  const [error, setError] = useState(null);
  const [budgetData, setBudgetData] = useState({}); // Empty
  const [timeline, setTimeline] = useState([]); // Empty
  const [sharedRolesData, setSharedRolesData] = useState({}); // Empty
  const [allRolesData, setAllRolesData] = useState({}); // Empty
  const [loadingPresentationData, setLoadingPresentationData] = useState(false); // Assume not loading
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({});

  // Use the Auth hook (Keep for basic user check)
  const { user, isUserAdmin, loadingAuth, signOut } = useAuth();
  const isClient = useIsClient(); // Use the hook

  // --- Keep useInlineEditing commented out ---
  const initialEditingState = {
      editingId: null,
      editText: '',
      handleTextClick: () => { console.warn("Edit attempted before client mount (diagnostic)"); },
      handleTextChange: () => { console.warn("Edit attempted before client mount (diagnostic)"); },
      handleTextBlur: () => { console.warn("Edit attempted before client mount (diagnostic)"); },
      handleKeyDown: () => { console.warn("Edit attempted before client mount (diagnostic)"); }
  };

  const editingLogic = initialEditingState; // No conditional logic needed when commented out

  // Destructure from the conditionally assigned logic
  const {
    editingId,
    editText,
    handleTextClick,
    handleTextChange,
    handleTextBlur,
    handleKeyDown,
  } = editingLogic;
  // --------------------------------------------------------

  // --- DIAGNOSTIC: Comment out all data loading useEffects ---
  /*
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

  useEffect(() => {
    if (factories.length > 0) {
        console.log("Factories loaded, processing...");

        if (!selectedFactoryId) {
            const nonShared = factories.filter(f => f.id !== '_shared');
            if (nonShared.length > 0) {
                setSelectedFactoryId(nonShared[0].id);
                console.log("Default factory selected:", nonShared[0].id);
            } else {
                 console.log("No non-shared factories found, no default selection.");
                 setSelectedFactoryId('');
            }
        }

        console.log("Loading global personnel data...");
        loadPersonnel().then(loadedPersonnel => {
            setPersonnel(loadedPersonnel || []);
            console.log("Global personnel loaded.");
        }).catch(err => {
             console.error("Error loading personnel:", err);
             setError(prev => prev ? prev + "\\nFailed to load personnel." : "Failed to load personnel.");
        });

        console.log("Loading shared roles data...");
        loadRoles('_shared').then(loadedSharedRoles => {
            setSharedRolesData(loadedSharedRoles || {});
            console.log("Shared roles loaded.");
        }).catch(err => {
            console.error("Error loading shared roles:", err);
            setError(prev => prev ? prev + "\\nFailed to load shared roles." : "Failed to load shared roles.");
        });

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
            setError(prev => prev ? prev + "\\nFailed to load roles for overview." : "Failed to load roles for overview.");
            setAllRolesData({});
        }).finally(() => {
            setLoadingPresentationData(false);
        });

    } else {
        setSelectedFactoryId('');
        setPersonnel([]);
        setFactoryRoles({});
        setSharedRolesData({});
        setAllRolesData({});
        setTimeline([]);
        setBudgetData({});
        setInitialDataLoaded(false);
    }
  }, [factories, loadPersonnel, loadRoles]);

  useEffect(() => {
      if (selectedFactoryId && selectedFactoryId !== '_shared') {
          console.log(`Selected factory changed to: ${selectedFactoryId}. Loading its data...`);
          setError(null);
          setInitialDataLoaded(false);

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
                  setInitialDataLoaded(true);
                   console.log(`Data loaded successfully for factory: ${selectedFactoryId}`);
              } catch (err) {
                   console.error(`Error loading data for factory ${selectedFactoryId}:`, err);
                   setError(`Failed to load data for factory ${factories.find(f=>f.id===selectedFactoryId)?.name || selectedFactoryId}. Error: ${err.message}`);
                   setFactoryRoles({});
                   setTimeline([]);
                   setBudgetData({});
                   setInitialDataLoaded(false);
              }
          };
          loadFactoryData();

      } else {
            console.log("No valid factory selected or selection cleared. Clearing factory-specific state.");
            setFactoryRoles({});
            setTimeline([]);
            setBudgetData({});
            setInitialDataLoaded(true);
      }
  }, [selectedFactoryId, loadRoles, loadTimeline, loadBudget]);
  */
  // ----------------------------------------------------------

  // --- DIAGNOSTIC: Comment out all Firestore interaction callbacks ---
  /*
  const loadPersonnel = useCallback(async () => {
    // ... implementation ...
  }, [setError]);

  const loadTimeline = useCallback(async (factoryId) => {
    // ... implementation ...
  }, [setError]);

  const loadBudget = useCallback(async (factoryId) => {
    // ... implementation ...
  }, [setError]);

  const loadFactories = useCallback(async () => {
    // ... implementation ...
  }, [setError, selectedFactoryId]);

  const loadRoles = useCallback(async (factoryId) => {
    // ... implementation ...
  }, [setError]);

  const addFactory = useCallback(async () => {
    // ... implementation ...
  }, [isUserAdmin, setError, setFactories, setSelectedFactoryId, factories, initialBudgetData, timelineInitialData]);

  const deleteFactory = useCallback(async () => {
    // ... implementation ...
  }, [isUserAdmin, selectedFactoryId, factories, setError, setFactories, setSelectedFactoryId]);

  const handleDropOnRole = async (roleKey) => {
    // ... implementation ...
  };

  const handleDropOnAvailable = async () => {
    // ... implementation ...
  };

  // --- MODIFIED: Wrap getOriginalText in useCallback ---
  const getOriginalText = useCallback((id) => {
    // ... implementation ...
  }, [personnel, factoryRoles, timeline, budgetData]);

  // --- MODIFIED: Wrap updateLocalState in useCallback ---
  const updateLocalState = useCallback((id, newValue) => {
    // ... implementation ...
  }, [setError]);

  // --- MODIFIED: Update Firestore Data (Handles Array Updates for Roles) ---
  const updateFirestoreData = useCallback(async (id, value) => {
    // ... implementation ...
  }, [setError, selectedFactoryId]);

  // --- NEW: Add Responsibility ---
  const addResponsibility = useCallback(async (roleId, type, category = null) => {
    // ... implementation ...
  }, [isUserAdmin, selectedFactoryId, setError, setFactoryRoles]);

  // --- NEW: Delete Responsibility ---
  const deleteResponsibility = useCallback(async (roleId, type, category = null, itemToRemove) => {
    // ... implementation ...
  }, [isUserAdmin, selectedFactoryId, setError, setFactoryRoles]);

  // --- NEW: Add Personnel ---
  const addPersonnel = useCallback(async () => {
    // ... implementation ...
  }, [isUserAdmin, setError, setPersonnel]);

  // --- NEW: Delete Personnel (Uses Modal) ---
  const deletePersonnel = useCallback(async (personId) => {
    // ... implementation ...
  }, [isUserAdmin, personnel, setError, setPersonnel]);

  const saveTimelineChanges = useCallback(async () => {
    // ... implementation ...
  }, [isUserAdmin, timeline, setError]);

  const saveBudgetChanges = useCallback(async () => {
    // ... implementation ...
  }, [isUserAdmin, budgetData, setError]);

  // --- NEW: Add Role ---
  const addRole = useCallback(async () => {
    // ... implementation ...
  }, [isUserAdmin, selectedFactoryId, setError, setFactoryRoles, colors.gray]);

  // --- NEW: Delete Role (Uses Modal) ---
  const deleteRole = useCallback(async (roleIdToDelete) => {
    // ... implementation ...
  }, [isUserAdmin, selectedFactoryId, personnel, factoryRoles, setError, setFactoryRoles]);
  */
  // --------------------------------------------------------------

  // --- Provide dummy handlers where needed to prevent crashes ---
  const dummyAsyncHandler = useCallback(async (...args) => { console.warn("Action disabled (diagnostic)", args); return false; }, []);
  const dummyHandler = useCallback((...args) => { console.warn("Action disabled (diagnostic)", args); }, []);
  const dummySetter = useCallback(() => { console.warn("Setter disabled (diagnostic)"); }, []);

  const loadFactories = dummyAsyncHandler; // Needed by commented-out effect
  const loadPersonnel = dummyAsyncHandler; // Needed by commented-out effect
  const loadRoles = dummyAsyncHandler; // Needed by commented-out effect
  const loadTimeline = dummyAsyncHandler; // Needed by commented-out effect
  const loadBudget = dummyAsyncHandler; // Needed by commented-out effect

  const handleDropOnRole = dummyAsyncHandler;
  const handleDropOnAvailable = dummyAsyncHandler;
  const addRole = dummyAsyncHandler;
  const deleteRole = dummyAsyncHandler;
  const addResponsibility = dummyAsyncHandler;
  const deleteResponsibility = dummyAsyncHandler;
  const addPersonnel = dummyAsyncHandler;
  const deletePersonnel = dummyAsyncHandler;
  const saveTimelineChanges = dummyAsyncHandler;
  const saveBudgetChanges = dummyAsyncHandler;
  const addFactory = dummyAsyncHandler;
  const deleteFactory = dummyAsyncHandler;
  const handleDragStart = dummyHandler;
  const handleDragEnd = dummyHandler;
  const handleDragOver = (e) => { e.preventDefault(); }; // Need preventDefault for drop
  const handleDragEnter = dummyHandler;
  const handleDragLeave = dummyHandler;
  const handleDragEnterAvailable = dummyHandler;
  const handleDragLeaveAvailable = dummyHandler;
  const getOriginalText = useCallback(() => '', []); // Return empty string for inline editing
  const updateLocalState = dummyHandler;
  const updateFirestoreData = dummyAsyncHandler;


  const renderContent = () => {
    // Keep basic loading/auth checks
    if (loadingAuth) {
        return <div className="loading-container">Authenticating...</div>;
    }
    // Removed initialDataLoaded check as we assume true now

    // Removed DB check

    // Error check remains useful
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

    // --- DIAGNOSTIC: Return simple placeholder, comment out switch ---
    return <div>Build Test Placeholder</div>;
    {/* 
    // Original switch statement commented out for build diagnostic
    switch (activeTab) {
       case 'structure':
         return (
           <div className="structure-tab">
             <div className="hierarchy-column">
               <OrgStructure 
                          roles={factoryRoles} // Empty
                          personnel={personnel.filter(p => p.assignedFactoryId === selectedFactoryId && p.assignedRoleKey)} // Empty
                          isUserAdmin={isUserAdmin}
                          allRoles={factoryRoles} // Empty
                          handleDropOnRole={handleDropOnRole} // Dummy
                          handleDragEnter={handleDragEnter} // Dummy
                          handleDragLeave={handleDragLeave} // Dummy
                          handleDragStart={handleDragStart} // Dummy
                          handleDragEnd={handleDragEnd} // Dummy
                          editingId={editingId} // null
                          editText={editText} // Empty string
                          handleTextClick={handleTextClick} // Dummy
                          handleTextBlur={handleTextBlur} // Dummy
                          handleKeyDown={handleKeyDown} // Dummy
                          handleTextChange={handleTextChange} // Dummy
                          unassignPerson={handleDropOnAvailable} // Dummy
                          addRole={addRole} // Dummy
                          deleteRole={deleteRole} // Dummy
                          addResponsibility={addResponsibility} // Dummy
                          deleteResponsibility={deleteResponsibility} // Dummy
                          sharedRolesData={sharedRolesData} // Empty
                          sharedPersonnel={personnel.filter(p => p.assignedFactoryId === '_shared')} // Empty
               />
             </div>
             <AvailablePersonnel
                        personnel={personnel.filter(p => !p.assignedRoleKey)} // Empty
                        setPersonnel={dummySetter} // Dummy setter
                        setError={setError}
                        roles={factoryRoles} // Empty
                        isUserAdmin={isUserAdmin}
                        handleDragStart={handleDragStart} // Dummy
                        handleDragEnd={handleDragEnd} // Dummy
                        handleDragOver={handleDragOver} // Dummy (with preventDefault)
                        handleDropOnAvailable={handleDropOnAvailable} // Dummy
                        handleDragEnterAvailable={handleDragEnterAvailable} // Dummy
                        handleDragLeaveAvailable={handleDragLeaveAvailable} // Dummy
                        editingId={editingId} // null
                        editText={editText} // Empty string
                        handleTextClick={handleTextClick} // Dummy
                        handleTextBlur={handleTextBlur} // Dummy
                        handleKeyDown={handleKeyDown} // Dummy
                        handleTextChange={handleTextChange} // Dummy
                        addPersonnel={addPersonnel} // Dummy
                        deletePersonnel={deletePersonnel} // Dummy
             />
          </div>
         );
       case 'timeline':
         return (
           <Timeline 
              timeline={timeline} // Empty
              isUserAdmin={isUserAdmin}
              editingId={editingId}
              editText={editText}
              handleTextClick={handleTextClick}
              handleTextBlur={handleTextBlur}
              handleKeyDown={handleKeyDown}
              handleTextChange={handleTextChange}
              saveTimelineChanges={saveTimelineChanges} // Dummy
           />
         ) ;
       case 'budget':
          return (
             <Budget 
                 budgetData={budgetData} // Empty
                 isUserAdmin={isUserAdmin}
                 editingId={editingId}
                 editText={editText}
                 handleTextClick={handleTextClick}
                 handleTextBlur={handleTextBlur}
                 handleKeyDown={handleKeyDown}
                 handleTextChange={handleTextChange}
                 saveBudgetChanges={saveBudgetChanges} // Dummy
              />
          ) ;
        case 'analysis':
          // Ensure roles is defined for the check, even if empty
          const rolesForAnalysis = factoryRoles || {}; 
          return (
             <WorkloadAnalysis 
                 roles={rolesForAnalysis} // Empty or {}
                 personnel={personnel} // Empty
                 isUserAdmin={isUserAdmin}
             />
          ) ;
        case 'presentation':
          // Removed loading/error checks specific to this tab's data
          return (
              <PresentationView 
                  factories={factories} // Hardcoded
                  allPersonnel={personnel} // Empty
                  allRolesData={allRolesData} // Empty
              />
          );
       default:
         return <div className="tab-content">Select a tab</div>; 
    }
    */}
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