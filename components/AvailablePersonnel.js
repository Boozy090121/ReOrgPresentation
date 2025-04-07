import React, { useState } from 'react';
import { UserPlus, Trash2, Download } from 'lucide-react'; // Import icons
import { db } from '../app/firebase/config'; // Assuming db is exported from here
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { downloadCSV } from '../lib/utils'; // Import download utility

const AvailablePersonnel = ({
  personnel,
  setPersonnel,
  isUserAdmin,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDropOnAvailable,
  handleDragEnterAvailable,
  handleDragLeaveAvailable,
  setError,
  roles,
}) => {
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);

  // Ensure personnel is an array before filtering
  const available = Array.isArray(personnel) ? personnel.filter(p => !p.assignedRole) : [];

  const addNewPerson = async () => {
    if (!newPersonName.trim() || !isUserAdmin) return;
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'personnel'), {
        name: newPersonName.trim(),
        assignedRole: null,
        createdAt: new Date()
      });
      setPersonnel(prev => [...prev, { id: docRef.id, name: newPersonName.trim(), assignedRole: null, createdAt: new Date() }]);
      setNewPersonName('');
      setShowAddPersonModal(false);
    } catch (err) {
      setError('Failed to add new person.');
      console.error('Error adding person:', err);
    }
  };

  const removePerson = (personId) => {
    if (!isUserAdmin) return;
    // Also check personnel array here before find
    const person = Array.isArray(personnel) ? personnel.find(p => p.id === personId) : null;
    if (!person) return;
    setPersonToDelete(person);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeletePerson = async () => {
    if (!personToDelete || !isUserAdmin) return;
    
    const personId = personToDelete.id;
    setShowDeleteConfirmModal(false);
    setPersonToDelete(null);
    setError(null);

    try {
      await deleteDoc(doc(db, 'personnel', personId));
      setPersonnel(prev => prev.filter(p => p.id !== personId));
    } catch (err) {
      setError('Failed to delete person.');
      console.error('Error deleting person:', err);
    }
  };

  const handleExportPersonnel = () => {
    const formattedData = formatPersonnelForCsv(personnel, roles); // Need roles prop
    const headers = ['ID', 'Name', 'Assigned Role Key', 'Assigned Role Title']; // Define desired headers/order
    
    // Simple way to reorder/select columns for CSV
    const csvData = formattedData.map(row => ({
        ID: row.id,
        Name: row.name,
        'Assigned Role Key': row.assignedRoleKey,
        'Assigned Role Title': row.assignedRoleTitle
    }));

    const csvString = arrayToCsv(csvData); // Use helper from utils
    downloadCSV(csvString, 'personnel_assignments.csv');
  };

  return (
    <div className="personnel-column"> {/* Re-add the column wrapper */}
      {showAddPersonModal && isUserAdmin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Person</h3>
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              className="modal-input"
              placeholder="Enter person's name"
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowAddPersonModal(false)} className="button secondary-button">Cancel</button>
              <button onClick={addNewPerson} className="button primary-button" disabled={!newPersonName.trim()}>Add Person</button>
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
                onClick={confirmDeletePerson} 
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
        className="personnel-list drop-zone" // Added drop-zone class
        onDragOver={handleDragOver}
        onDrop={handleDropOnAvailable}
        onDragEnter={handleDragEnterAvailable}
        onDragLeave={handleDragLeaveAvailable}
      >
        <div className="personnel-list-header">
          <h3>Available Personnel</h3>
          <div className="header-actions">
             {isUserAdmin && (
               <button onClick={() => setShowAddPersonModal(true)} className="add-person-button" title="Add New Person">
                 <UserPlus size={18} /> Add
               </button>
             )}
             <button onClick={handleExportPersonnel} className="export-button" title="Export Personnel List">
               <Download size={18} /> Export
             </button>
          </div>
        </div>
        <div className="personnel-cards">
          {available.map((person) => (
            <div
              key={person.id}
              className={`personnel-card draggable`} // Removed dragging class logic for now, relies on draggedPerson state not passed here
              draggable={isUserAdmin}
              onDragStart={(e) => handleDragStart(e, person)}
              onDragEnd={handleDragEnd}
            >
              {/* Basic display - no editing here for now */}
              <div className="personnel-name">{person.name}</div>

              {/* Placeholder for potential future inline editing:
               <div
                 data-edit-id={`person-${person.id}`}
                 className="editable-text personnel-name"
                 contentEditable={isUserAdmin}
                 suppressContentEditableWarning={true}
                 onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                 onClick={() => isUserAdmin && handleTextClick(`person-${person.id}`, person.name)} // Requires handleTextClick prop
                 onBlur={() => handleTextBlur(`person-${person.id}`)} // Requires handleTextBlur prop
                 onKeyDown={(e) => handleKeyDown(e, `person-${person.id}`)} // Requires handleKeyDown prop
                 onInput={handleTextChange} // Requires handleTextChange prop
               >
                 {editingId === `person-${person.id}` ? editText : person.name} // Requires editingId, editText props
               </div>
               */}

              {isUserAdmin && (
                <button
                  onClick={() => removePerson(person.id)}
                  className="delete-person-button"
                  title="Delete Person Permanently"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {available.length === 0 && (
            <p className="empty-list-message">All personnel assigned.</p>
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
      const escaped = ('' + row[header]).replace(/"/g, '\"\"');
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
  return personnel.map(p => ({
    id: p.id,
    name: p.name,
    assignedRoleKey: p.assignedRole || 'Unassigned',
    // Check if roles and the specific role exist
    assignedRoleTitle: p.assignedRole && roles && roles[p.assignedRole]
      ? roles[p.assignedRole].title
      : (p.assignedRole || 'Unassigned'),
    // Add other fields like createdAt if needed
  }));
};

export default AvailablePersonnel; 