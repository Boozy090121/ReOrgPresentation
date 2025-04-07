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
    <div className="hierarchy-column"> {/* Re-add the column wrapper */}
      <div className="hierarchy-level director-level">
        {renderRoleCard('director', roles.director)}
      </div>

      {/* Connector (Optional Visual) */}
      <div className="connector-line-vertical"></div>

      <div className="hierarchy-level reports-level">
        <div className="systems-lead-container">
          {renderRoleCard('systemsLead', roles.systemsLead)}
        </div>
        <div className="managers-container">
          {/* Render 3 Manager sections */}
          {[1, 2, 3].map(managerIndex => {
            // Create unique keys for managers if needed for state, using roleKey for drop target
            const managerRoleKey = `qualityManager`; // Keep the role key consistent for drop logic
            const uniqueManagerDisplayKey = `qualityManager-${managerIndex}`;

            return (
              <div key={uniqueManagerDisplayKey} className="manager-section">
                {renderRoleCard(managerRoleKey, roles.qualityManager)} {/* Pass the drop target roleKey */} 

                {/* Visually Nest Team Members Under Manager */}
                {expandedRoles[managerRoleKey] && ( // Check expansion based on the shared roleKey
                  <div className="team-members">
                    {renderRoleCard('seniorSpecialist', roles.seniorSpecialist)}
                    {renderRoleCard('qualitySpecialist', roles.qualitySpecialist)}
                    {renderRoleCard('complaintsSpecialist', roles.complaintsSpecialist)}
                    {renderRoleCard('associateSpecialist', roles.associateSpecialist)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Connector (Optional Visual) */}
      {/* <div className="connector-line-vertical"></div> */}

      <div className="hierarchy-level offshift-level">
        {renderRoleCard('offshiftAssociate', roles.offshiftAssociate)}
      </div>

      {/* Add Lab Group Separately or integrate if structure is different */} 
      <div className="hierarchy-level lab-group-level">
        <h3>Functional Testing Group</h3>
        {renderRoleCard('labManager', roles.labManager)}
        <div className="lab-team">
          {renderRoleCard('seniorLabTechnician', roles.seniorLabTechnician)}
          {renderRoleCard('labTechnician', roles.labTechnician)}
          {renderRoleCard('associateLabTechnician', roles.associateLabTechnician)}
        </div>
      </div>

    </div>
  );
};

export default OrgStructure; 