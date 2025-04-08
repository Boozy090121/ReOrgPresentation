import React, { useState } from 'react';
import RoleCard from './RoleCard'; // Adjusted path
import { PlusCircle } from 'lucide-react'; // Import PlusCircle icon

const OrgStructure = ({
  roles,
  personnel,
  isUserAdmin,
  allRoles,
  handleDragOver,
  handleDropOnRole,
  handleDragEnter,
  handleDragLeave,
  handleDragStart,
  handleDragEnd,
  handleTextClick,
  handleTextBlur,
  handleKeyDown,
  editText,
  editingId,
  unassignPerson,
  handleTextChange,
  addRole, // New prop for adding roles
  deleteRole, // New prop for deleting roles
  addResponsibility,
  deleteResponsibility,
  sharedRolesData, // New prop: Data for shared roles (from '_shared' factory)
  sharedPersonnel // New prop: Personnel assigned to shared roles
}) => {

  const [expandedRoles, setExpandedRoles] = useState({});

  // Initial check for roles data
  if (!roles) { // Check for selected factory roles
    return <div className="org-structure-container">Loading organizational structure...</div>;
  }

  const toggleRole = (roleId) => {
    setExpandedRoles(prev => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  // Helper function to render a role card with all necessary props
  const renderRoleCard = (roleKey, roleData, personnelList, isShared = false) => {
    if (!roleData) return null;

    // --- DIAGNOSTIC: Comment out RoleCard rendering ---
    return <div key={roleKey} style={{ border: '1px dashed #ccc', padding: '10px', margin: '5px 0' }}>Role Placeholder: {roleData?.title || roleKey}</div>;
    /*
    const assignedPersonnel = Array.isArray(personnelList) ? personnelList.filter(p => p.assignedRoleKey === roleKey) : [];
    return (
      <RoleCard
        key={roleKey}
        roleKey={roleKey}
        roleData={roleData}
        personnel={assignedPersonnel} // Pass only personnel assigned to this specific role
        isUserAdmin={isUserAdmin}
        expandedRoles={expandedRoles}
        toggleRole={toggleRole}
        handleDragOver={handleDragOver}
        handleDropOnRole={handleDropOnRole} // page.js handler needs to check if roleKey belongs to _shared
        handleDragEnter={handleDragEnter}
        handleDragLeave={handleDragLeave}
        handleDragStart={handleDragStart} // Allow dragging *from* shared roles
        handleDragEnd={handleDragEnd}
        handleTextClick={handleTextClick}
        handleTextBlur={handleTextBlur}
        handleKeyDown={handleKeyDown}
        editText={editText}
        editingId={editingId}
        unassignPerson={unassignPerson}
        handleTextChange={handleTextChange}
        allRoles={isShared ? sharedRolesData : allRoles}
        deleteRole={isShared ? null : deleteRole} // Only allow deleting non-shared roles from this view
        addResponsibility={addResponsibility} // Assuming responsibilities are edited the same way
        deleteResponsibility={deleteResponsibility}
      />
    );
    */
  };

  return (
    <div className="org-structure-container">
      <div className="org-structure-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Focus Factory Structure</h2>
        {/* --- Add Role Button --- */}
        {isUserAdmin && (
          <button
            onClick={addRole}
            className="button-primary button-small"
            title="Add a new role to this factory"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <PlusCircle size={16} style={{ marginRight: '4px' }} /> Add Role
          </button>
        )}
      </div>
      <div className="roles-list">
        {Object.keys(roles).length > 0 ? (
          Object.entries(roles).map(([roleKey, roleData]) => {
            // Render role card using helper, pass factory-specific personnel
            return renderRoleCard(roleKey, roleData, personnel, false);
          })
        ) : (
          <p className="info-message">No roles defined for this factory yet. Click "Add Role" to start building the structure.</p>
        )}
      </div>

      {/* --- Shared Resources Section --- */}
      {sharedRolesData && Object.keys(sharedRolesData).length > 0 && (
        <div className="shared-resources-section" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #eee' }}>
          <h2>Shared Resources</h2>
          <div className="roles-list">
            {Object.entries(sharedRolesData).map(([roleKey, roleData]) => {
              // Render shared role card using helper, pass shared personnel
              return renderRoleCard(roleKey, roleData, sharedPersonnel, true);
            })}
          </div>
        </div>
      )}
      {/* Optional: Message if shared roles exist but no personnel assigned */}
      {sharedRolesData && Object.keys(sharedRolesData).length > 0 && (!sharedPersonnel || sharedPersonnel.length === 0) && (
        <p className="info-message" style={{ marginTop: '10px' }}>Drag personnel to assign them to shared roles.</p>
      )}
    </div>
  );
};

export default OrgStructure; 