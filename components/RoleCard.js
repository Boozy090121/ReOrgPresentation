import React from 'react';
import { ChevronDown, ChevronUp, XCircle } from 'lucide-react';

const RoleCard = ({
  roleKey,
  roleData,
  personnel,
  isUserAdmin,
  expandedRoles,
  toggleRole,
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
  allRoles
}) => {

  // Add check for essential roleData prop
  if (!roleData) {
    return <div className="role-card role-card-error">Error: Role data missing</div>;
  }

  // Ensure personnel is an array before filtering
  const assigned = Array.isArray(personnel) ? personnel.filter(p => p.assignedRole === roleKey) : [];
  const cardStyle = {
    borderLeft: `5px solid ${roleData.color || '#ccc'}`, // Use roleData.color for border
  };
  const headerStyle = {
      backgroundColor: roleData.color ? `${roleData.color}20` : '#f0f0f0', // Lighter background using color
  };

  // Calculate headcount
  const headcount = assigned.length;
  // Check expandedRoles before access
  const isExpanded = expandedRoles && expandedRoles[roleKey];

  return (
    <div key={roleKey} className={`role-card role-card-${roleKey}`} style={cardStyle}>
      <div className="role-header" onClick={() => toggleRole(roleKey)} style={headerStyle}>
        <div className="role-header-title">
          {roleData.icon}
          <h3>{roleData.title || 'Unknown Role'} ({headcount})</h3> {/* Display headcount */}
        </div>
        <span>{isExpanded ? <ChevronUp /> : <ChevronDown />}</span>
      </div>
      {isExpanded && (
        <div
          className="role-content drop-zone"
          onDragOver={handleDragOver}
          onDrop={() => handleDropOnRole(roleKey)}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
          <h4>Detailed Responsibilities:</h4>
          {roleData.detailedResponsibilities ? (
            <div className="detailed-responsibilities">
              {Object.entries(roleData.detailedResponsibilities).map(([category, details]) => (
                <div key={category} className="responsibility-category">
                  <h5>{category}</h5>
                  {Array.isArray(details) && (
                    <ul>
                      {details.map((detail, index) => <li key={index}>{detail}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Fallback to basic responsibilities if detailed are missing
            <ul>{Array.isArray(roleData.responsibilities) && roleData.responsibilities.map((resp, index) => <li key={index}>{resp}</li>)}</ul>
          )}
          <div className="role-details">
            <p><strong>Salary:</strong> {roleData.salary || 'N/A'}</p>
            <p><strong>Department:</strong> {roleData.department || 'N/A'}</p>
          </div>

          {/* KPIs Section */}
          {Array.isArray(roleData.kpis) && roleData.kpis.length > 0 && (
            <div className="kpis-section">
              <h4>Key Performance Indicators (KPIs):</h4>
              <ul>
                {roleData.kpis.map((kpi, index) => <li key={index}>{kpi}</li>)}
              </ul>
            </div>
          )}

          {/* Skills Section */}
          {Array.isArray(roleData.skills) && roleData.skills.length > 0 && (
            <div className="skills-section">
              <h4>Required Skills:</h4>
              <ul>
                {roleData.skills.map((skill, index) => <li key={index}>{skill}</li>)}
              </ul>
            </div>
          )}

          {/* Career Progression Section */}
          {Array.isArray(roleData.nextRoles) && roleData.nextRoles.length > 0 && allRoles && (
            <div className="progression-section">
              <h4>Possible Next Roles:</h4>
              <ul>
                {roleData.nextRoles.map((nextRoleKey) => {
                  const nextRole = allRoles[nextRoleKey];
                  return nextRole ? <li key={nextRoleKey}>{nextRole.title || nextRoleKey}</li> : null;
                })}
              </ul>
            </div>
          )}

          <div className="assigned-personnel">
            <h4>Assigned Personnel:</h4>
            {assigned.map(person => {
              if (!person) return null;
              return (
                <div key={person.id} className="assigned-person draggable"
                  draggable={isUserAdmin}
                  onDragStart={(e) => handleDragStart(e, person)}
                  onDragEnd={handleDragEnd}
                >
                  <div
                    data-edit-id={`person-${person.id}`}
                    className="editable-text personnel-name"
                    contentEditable={isUserAdmin}
                    suppressContentEditableWarning={true}
                    onMouseDown={(e) => { if (!isUserAdmin) e.preventDefault(); }}
                    onClick={() => isUserAdmin && handleTextClick(`person-${person.id}`, person.name)}
                    onBlur={() => handleTextBlur(`person-${person.id}`)}
                    onKeyDown={(e) => handleKeyDown(e, `person-${person.id}`)}
                    onInput={handleTextChange}
                  >
                    {editingId === `person-${person.id}` ? editText : person.name}
                  </div>
                  {isUserAdmin && (
                    <button
                      onClick={() => unassignPerson(person.id)} // Ensure unassignPerson prop is passed correctly
                      className="unassign-button"
                      title="Unassign Role"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              );
            })}
            {assigned.length === 0 && (
              <p className="empty-list-message">Drag available personnel here.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleCard; 