import React, { useState } from 'react';
import { UserPlus, Trash2, Download, Edit2, Save } from 'lucide-react'; // Added Edit2, Save
import { db } from '../app/firebase/config'; // Assuming db is exported from here
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore'; // Keep Firestore imports if needed *within component* (e.g., maybe not needed now)
import { downloadCSV } from '../lib/utils'; // Import download utility

const AvailablePersonnel = ({
  personnel,
  setPersonnel, // May not be needed if handled by page
  isUserAdmin,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDropOnAvailable,
  handleDragEnterAvailable,
  handleDragLeaveAvailable,
  setError,
  roles,
  // Editing props from page.js
  handleTextClick,
  handleTextBlur,
  handleKeyDown,
  editText,
  editingId,
  handleTextChange,
  // Data modification props from page.js
  addPersonnel, 
  deletePersonnel
}) => {
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);

  // Ensure personnel is an array before filtering
  const available = Array.isArray(personnel) ? personnel.filter(p => !p.assignedRole) : [];

  // Remove internal addNewPerson, use prop
  // const addNewPerson = async () => { ... };

  // Internal handler to trigger the addPersonnel prop from page.js
  const handleAddPersonClick = () => {
    // We can just call the prop directly, no need for name state here
    // If we wanted a modal for name entry *before* calling page add, keep modal logic
    // For simplicity now, let's assume the page adds 'New Teammate'
     if (addPersonnel) {
       addPersonnel(); // Call the function passed from app/page.js
     } else {
       console.error("[AvailablePersonnel] addPersonnel prop is missing!");
       setError("Error: Cannot add person.");
     }
    // setShowAddPersonModal(true); // If keeping modal, trigger it here
  };

  // Remove internal removePerson, use prop
  // const removePerson = (personId) => { ... };

  // Internal handler to set state for the confirmation modal
  const handleDeletePersonClick = (person) => {
    if (!isUserAdmin || !person) return;
    setPersonToDelete(person);
    setShowDeleteConfirmModal(true);
  };

  // Remove internal confirmDeletePerson, use prop
  // const confirmDeletePerson = async () => { ... };

  // Internal handler to call the deletePersonnel prop from page.js
  const handleConfirmDelete = () => {
    if (!personToDelete || !isUserAdmin) return;
    if (deletePersonnel) {
      deletePersonnel(personToDelete.id); // Call the function passed from app/page.js
    } else {
      console.error("[AvailablePersonnel] deletePersonnel prop is missing!");
      setError("Error: Cannot delete person.");
    }
    setShowDeleteConfirmModal(false);
    setPersonToDelete(null);
  };

  const handleExportPersonnel = () => {
    // Ensure personnel is an array
    if (!Array.isArray(personnel)) {
        console.error("Cannot export, personnel data is not an array.");
        setError("Cannot export personnel data.");
        return;
    }
    const formattedData = formatPersonnelForCsv(personnel, roles); // Needs roles prop
    
    // Define headers including new fields
    const headers = ['ID', 'Name', 'Experience', 'Skills', 'Notes', 'Assigned Role Key', 'Assigned Role Title'];
    
    // Map data to match headers
    const csvData = formattedData.map(row => ({
        ID: row.id,
        Name: row.name,
        Experience: row.experience, // Add experience
        Skills: Array.isArray(row.skills) ? row.skills.join('; ') : '', // Join skills array for CSV
        Notes: row.notes, // Add notes
        'Assigned Role Key': row.assignedRoleKey,
        'Assigned Role Title': row.assignedRoleTitle
    }));

    const csvString = arrayToCsv(csvData); // Use helper from utils
    downloadCSV(csvString, 'personnel_assignments.csv');
  };

  return (
    <div className="personnel-column"> 
      {/* Modal logic can remain, but action buttons call handlers above */}
       {showAddPersonModal && isUserAdmin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Person</h3>
            {/* If adding name here, keep input and state */}
            <input 
              type="text"
              value={newPersonName} 
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder="Enter name (optional)" 
            />
            <div className="modal-actions">
              <button onClick={() => setShowAddPersonModal(false)} className="button secondary-button">Cancel</button>
              {/* Adjust add logic if name is needed */}
              <button onClick={handleAddPersonClick} className="button primary-button">Add Person</button> 
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && personToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to permanently delete <strong>{personToDelete.name}</strong>?</p>
            <div className="modal-actions">
              <button 
                onClick={() => { setShowDeleteConfirmModal(false); setPersonToDelete(null); }}
                className="button secondary-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete} // Call internal handler which calls prop
                className="button primary-button delete-confirm-button"
                style={{ backgroundColor: 'var(--pci-red)', borderColor: 'var(--pci-red)' }}
              >
                Delete Person
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="personnel-list drop-zone" 
        onDragOver={handleDragOver}
        onDrop={handleDropOnAvailable}
        onDragEnter={handleDragEnterAvailable}
        onDragLeave={handleDragLeaveAvailable}
      >
        <div className="personnel-list-header">
          <h3>Available Personnel</h3>
          <div className="header-actions">
             {isUserAdmin && (
               <button onClick={handleAddPersonClick} className="add-person-button" title="Add New Person">
                 <UserPlus size={18} /> Add
               </button>
             )}
             <button onClick={handleExportPersonnel} className="export-button" title="Export Personnel List">
               <Download size={18} /> Export
             </button>
          </div>
        </div>
        <div className="personnel-cards">
          {available.map((person) => {
            // Ensure person object is valid before rendering
            if (!person || !person.id) return null; 
            const isEditingName = editingId === `personnel-${person.id}-name`;
            const isEditingSkills = editingId === `personnel-${person.id}-skills`;
            const isEditingNotes = editingId === `personnel-${person.id}-notes`;

            // Prepare skills string for display/editing
            const skillsString = Array.isArray(person.skills) ? person.skills.join(', ') : '';

            return (
              <div
                key={person.id}
                className={`personnel-card available-person-card ${isUserAdmin ? 'draggable' : ''}`}
                draggable={isUserAdmin}
                onDragStart={(e) => handleDragStart(e, person)}
                onDragEnd={handleDragEnd}
              >
                <div className="personnel-card-main-info">
                   {/* Name - Editable */}
                   <div
                     data-edit-id={`personnel-${person.id}-name`}
                     className="editable-text personnel-name"
                     contentEditable={isUserAdmin}
                     suppressContentEditableWarning={true}
                     onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                     onClick={() => isUserAdmin && handleTextClick(`personnel-${person.id}-name`, person.name)}
                     onBlur={() => handleTextBlur(`personnel-${person.id}-name`)}
                     onKeyDown={(e) => handleKeyDown(e, `personnel-${person.id}-name`)}
                     onInput={handleTextChange}
                   >
                     {isEditingName ? editText : (person.name || 'Unnamed')}
                   </div>
                   {isUserAdmin && (
                     <button
                       onClick={() => handleDeletePersonClick(person)} // Use internal handler
                       className="delete-person-button"
                       title="Delete Person Permanently"
                     >
                       <Trash2 size={14} />
                     </button>
                   )}
                </div>

                {/* Skills - Editable */}
                <div className="personnel-detail">
                  <span className="detail-label">Skills:</span>
                  <div
                     data-edit-id={`personnel-${person.id}-skills`}
                     className="editable-text personnel-skills"
                     contentEditable={isUserAdmin}
                     suppressContentEditableWarning={true}
                     onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                     onClick={() => isUserAdmin && handleTextClick(`personnel-${person.id}-skills`, skillsString)}
                     onBlur={() => handleTextBlur(`personnel-${person.id}-skills`)}
                     onKeyDown={(e) => handleKeyDown(e, `personnel-${person.id}-skills`)}
                     onInput={handleTextChange} // Use the shared handler
                     title={isUserAdmin ? "Edit Skills (comma-separated)" : ""}
                   >
                     {isEditingSkills ? editText : (skillsString || "-")} 
                   </div>
                </div>

                {/* Notes - Editable */}
                <div className="personnel-detail">
                   <span className="detail-label">Notes:</span>
                   <div
                     data-edit-id={`personnel-${person.id}-notes`}
                     className="editable-text personnel-notes"
                     contentEditable={isUserAdmin}
                     suppressContentEditableWarning={true}
                     onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                     onClick={() => isUserAdmin && handleTextClick(`personnel-${person.id}-notes`, person.notes)}
                     onBlur={() => handleTextBlur(`personnel-${person.id}-notes`)}
                     onKeyDown={(e) => handleKeyDown(e, `personnel-${person.id}-notes`)}
                     onInput={handleTextChange} // Use the shared handler
                     title={isUserAdmin ? "Edit Notes" : ""}
                     style={{ minHeight: '40px', whiteSpace: 'pre-wrap' }} // Allow multiple lines
                   >
                     {isEditingNotes ? editText : (person.notes || "-")}
                   </div>
                </div>
              </div>
            );
          })}
          {available.length === 0 && (
            <p className="empty-list-message">All personnel assigned or no personnel added.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function (can be moved to utils if reused)
const arrayToCsv = (data) => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));
  for (const row of data) {
    const values = headers.map(header => {
      // Ensure value is treated as string, handle null/undefined
      const val = row[header] === null || typeof row[header] === 'undefined' ? '' : row[header];
      const escaped = ('' + val).replace(/"/g, '\"\"'); // Escape double quotes
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
};

// Helper to flatten personnel data for CSV
const formatPersonnelForCsv = (personnel, roles) => {
  // Add check for personnel being an array
  if (!Array.isArray(personnel)) return [];
  // Ensure roles is an object before accessing
  const rolesLookup = roles && typeof roles === 'object' ? roles : {};

  return personnel.map(p => {
    // Ensure p is an object
    if (!p || typeof p !== 'object') return {}; 
    const assignedRole = rolesLookup[p.assignedRole];
    return {
      id: p.id || '',
      name: p.name || '',
      experience: p.experience ?? 0, // Default experience to 0 if null/undefined
      skills: Array.isArray(p.skills) ? p.skills.join('; ') : '', // Join with semicolon for CSV clarity
      notes: p.notes || '',
      assignedRoleKey: p.assignedRole || 'Unassigned',
      assignedRoleTitle: assignedRole ? (assignedRole.title || p.assignedRole) : (p.assignedRole || 'Unassigned'),
      // Add other fields like createdAt if needed
    };
  });
};

export default AvailablePersonnel; 