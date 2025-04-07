import React, { useState } from 'react';
import RoleCard from './RoleCard'; // Adjusted path

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
  handleTextChange
}) => {

  const [expandedRoles, setExpandedRoles] = useState({});

  // Initial check for roles data
  if (!roles || Object.keys(roles).length === 0) {
    return <div className="org-structure-container">Loading organizational structure...</div>;
  }

  const toggleRole = (roleId) => {
    setExpandedRoles(prev => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  // Helper function to render a role card with all necessary props
  const renderRoleCard = (roleKey, roleData) => (
    <RoleCard
      key={roleKey} // Use unique key for each instance
      roleKey={roleKey}
      roleData={roleData}
      personnel={personnel}
      isUserAdmin={isUserAdmin}
      expandedRoles={expandedRoles}
      toggleRole={toggleRole}
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
      unassignPerson={unassignPerson}
      handleTextChange={handleTextChange}
      allRoles={allRoles}
    />
  );

  return (
    <div className="org-structure-container">
      <h2>Organizational Structure</h2>
      <div className="roles-list">
        {Object.entries(roles).map(([roleKey, roleData]) => {
          // Add check for roleData before rendering RoleCard
          if (!roleData) return null;
          return (
            <RoleCard
              key={roleKey}
              roleKey={roleKey}
              roleData={roleData}
              personnel={personnel}
              isUserAdmin={isUserAdmin}
              expandedRoles={expandedRoles}
              toggleRole={toggleRole}
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
              unassignPerson={unassignPerson}
              handleTextChange={handleTextChange}
              allRoles={allRoles}
            />
          );
        })}
      </div>
    </div>
  );
};

export default OrgStructure; 