import React from 'react';
import { ChevronDown, ChevronUp, XCircle, Trash2, PlusCircle } from 'lucide-react';

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
  allRoles,
  deleteRole,
  addResponsibility,
  deleteResponsibility
}) => {

  // Add check for essential roleData prop
  if (!roleData) {
    return <div className="role-card role-card-error">Error: Role data missing for key {roleKey}</div>;
  }

  // Ensure personnel is an array before filtering
  const assigned = Array.isArray(personnel) ? personnel.filter(p => p.assignedRoleKey === roleKey) : [];
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

  // --- EDITABLE ROLE TITLE ---
  const roleTitleId = `role-${roleKey}-title`;
  const isEditingRoleTitle = editingId === roleTitleId;

  return (
    <div key={roleKey} className={`role-card role-card-${roleKey}`} style={cardStyle}>
      <div className="role-header" style={headerStyle}>
        <div className="role-header-title">
          {/* Display icon if available */}
          {roleData.icon && <span className="role-icon">{roleData.icon}</span>}
          <div
            className="editable-text role-title"
            data-edit-id={roleTitleId}
            contentEditable={isUserAdmin}
            suppressContentEditableWarning={true}
            onMouseDown={(e) => { if (!isUserAdmin) e.preventDefault(); }}
            onClick={() => isUserAdmin && handleTextClick(roleTitleId, roleData.title || '')}
            onBlur={() => handleTextBlur(roleTitleId)}
            onKeyDown={(e) => handleKeyDown(e, roleTitleId)}
            onInput={handleTextChange}
            style={{ cursor: isUserAdmin ? 'text' : 'default' }} // Indicate editability
          >
            {isEditingRoleTitle ? editText : (roleData.title || 'Unnamed Role')}
          </div>
          <span className="role-headcount">({headcount})</span> {/* Display headcount next to title */}
        </div>
        <span onClick={() => toggleRole(roleKey)} style={{ cursor: 'pointer' }} title={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </span>
        {isUserAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteRole(roleKey);
            }}
            className="button-icon button-danger"
            title="Delete this role"
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
          >
            <Trash2 size={14} />
          </button>
        )}
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
              {Object.entries(roleData.detailedResponsibilities).map(([category, details]) => {
                const categoryId = `role-${roleKey}-responsibilityCategory-${category}`;
                const isEditingCategory = editingId === categoryId;
                return (
                  <div key={category} className="responsibility-category">
                    <h5>{category}</h5>
                    {Array.isArray(details) && (
                      <ul>
                        {details.map((detail, index) => {
                          const detailId = `role-${roleKey}-detailedResponsibility-${category}-${index}`;
                          const isEditingDetail = editingId === detailId;
                          return (
                            <li
                              key={`${category}-${index}`}
                              className="responsibility-item-container"
                              style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}
                            >
                              <div
                                className="editable-text responsibility-item"
                                data-edit-id={detailId}
                                contentEditable={isUserAdmin}
                                suppressContentEditableWarning={true}
                                onMouseDown={(e) => { if (!isUserAdmin) e.preventDefault(); }}
                                onClick={() => isUserAdmin && handleTextClick(detailId, detail)}
                                onBlur={() => handleTextBlur(detailId)}
                                onKeyDown={(e) => handleKeyDown(e, detailId)}
                                onInput={handleTextChange}
                              >
                                {isEditingDetail ? editText : detail}
                              </div>
                              {isUserAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteResponsibility(roleKey, 'detailed', category, detail);
                                  }}
                                  className="button-icon-danger button-tiny"
                                  title="Delete responsibility"
                                  style={{ marginLeft: '8px' }}
                                >
                                  <XCircle size={12} />
                                </button>
                              )}
                            </li>
                          );
                        })}
                        {isUserAdmin && (
                          <li style={{ listStyle: 'none', marginTop: '5px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addResponsibility(roleKey, 'detailed', category);
                              }}
                              className="button-secondary button-tiny"
                              title="Add responsibility to this category"
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              <PlusCircle size={12} style={{ marginRight: '4px' }} /> Add Item
                            </button>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Fallback to basic responsibilities - Make these editable too
            <>
                <h4>Responsibilities:</h4>
                {Array.isArray(roleData.responsibilities) && roleData.responsibilities.length > 0 ? (
                  <ul>
                    {roleData.responsibilities.map((resp, index) => {
                      const respId = `role-${roleKey}-responsibility-${index}`;
                      const isEditingResp = editingId === respId;
                      return (
                        <li
                          key={index}
                          className="responsibility-item-container"
                          style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}
                        >
                          <div
                            className="editable-text responsibility-item"
                            data-edit-id={respId}
                            contentEditable={isUserAdmin}
                            suppressContentEditableWarning={true}
                            onMouseDown={(e) => { if (!isUserAdmin) e.preventDefault(); }}
                            onClick={() => isUserAdmin && handleTextClick(respId, resp)}
                            onBlur={() => handleTextBlur(respId)}
                            onKeyDown={(e) => handleKeyDown(e, respId)}
                            onInput={handleTextChange}
                          >
                            {isEditingResp ? editText : resp}
                          </div>
                          {isUserAdmin && (
                            <button
                              onClick={(e) => { 
                                e.stopPropagation();
                                deleteResponsibility(roleKey, 'basic', null, resp);
                              }}
                              className="button-icon-danger button-tiny"
                              title="Delete responsibility"
                              style={{ marginLeft: '8px' }}
                            >
                              <XCircle size={12} />
                            </button>
                          )}
                        </li>
                      );
                    })}
                    {isUserAdmin && (
                      <li style={{ listStyle: 'none', marginTop: '5px' }}>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            addResponsibility(roleKey, 'basic');
                          }}
                          className="button-secondary button-tiny"
                          title="Add new responsibility"
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <PlusCircle size={12} style={{ marginRight: '4px' }} /> Add Item
                        </button>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p>No responsibilities defined.</p>
                )}
                 {/* Button to add the *first* responsibility (only shown if list is empty) */}
                 {isUserAdmin && (!Array.isArray(roleData.responsibilities) || roleData.responsibilities.length === 0) && (
                      <button
                          onClick={() => addResponsibility(roleKey, 'basic')}
                          className="button-secondary button-tiny"
                          title="Add first responsibility"
                          style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}
                      >
                          <PlusCircle size={12} style={{ marginRight: '4px' }} /> Add Responsibility
                      </button>
                 )}
            </>
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
              // Add checks for person validity
              if (!person || !person.id) return null; 

              const isEditingName = editingId === `personnel-${person.id}-name`;
              const isEditingSkills = editingId === `personnel-${person.id}-skills`;
              const isEditingNotes = editingId === `personnel-${person.id}-notes`;

              // Prepare skills string for display/editing
              const skillsString = Array.isArray(person.skills) ? person.skills.join(', ') : '';

              return (
                <div 
                  key={person.id} 
                  className={`assigned-person ${isUserAdmin ? 'draggable' : ''}`}
                  draggable={isUserAdmin}
                  onDragStart={(e) => handleDragStart(e, person)}
                  onDragEnd={handleDragEnd}
                  // Add a wrapper for better layout if needed, or apply styling directly
                  style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}
                >
                  <div className="assigned-person-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    {/* Name - Editable */}
                    <div
                      data-edit-id={`personnel-${person.id}-name`}
                      className="editable-text personnel-name"
                      contentEditable={isUserAdmin}
                      suppressContentEditableWarning={true}
                      onMouseDown={(e) => { if (!isUserAdmin) e.preventDefault(); }}
                      onClick={() => isUserAdmin && handleTextClick(`personnel-${person.id}-name`, person.name)}
                      onBlur={() => handleTextBlur(`personnel-${person.id}-name`)}
                      onKeyDown={(e) => handleKeyDown(e, `personnel-${person.id}-name`)}
                      onInput={handleTextChange}
                      style={{ fontWeight: 'bold' }} // Make name stand out
                    >
                      {isEditingName ? editText : (person.name || 'Unnamed')}
                    </div>
                    {isUserAdmin && (
                      <button
                        onClick={() => {
                          // Check if unassignPerson is a function before calling
                          if (typeof unassignPerson === 'function') {
                            unassignPerson(person.id); // Pass person ID to unassign
                          } else {
                            console.error("unassignPerson handler is not available in RoleCard");
                          }
                        }}
                        className="unassign-button"
                        title="Unassign Role"
                        style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer' }}
                      >
                        <XCircle size={14} color="#dc3545" />
                      </button>
                    )}
                  </div>

                  {/* Skills - Editable */}
                  <div className="personnel-detail">
                    <span className="detail-label" style={{ fontWeight: '500' }}>Skills:</span>
                    <div
                      data-edit-id={`personnel-${person.id}-skills`}
                      className="editable-text personnel-skills"
                      contentEditable={isUserAdmin}
                      suppressContentEditableWarning={true}
                      onMouseDown={(e) => { if (!isUserAdmin) e.preventDefault(); }}
                      onClick={() => isUserAdmin && handleTextClick(`personnel-${person.id}-skills`, skillsString)}
                      onBlur={() => handleTextBlur(`personnel-${person.id}-skills`)}
                      onKeyDown={(e) => handleKeyDown(e, `personnel-${person.id}-skills`)}
                      onInput={handleTextChange}
                      title={isUserAdmin ? "Edit Skills (comma-separated)" : ""}
                      style={{ marginLeft: '5px' }} // Indent slightly
                    >
                      {isEditingSkills ? editText : (skillsString || "-")}
                    </div>
                  </div>

                  {/* Notes - Editable */}
                  <div className="personnel-detail">
                    <span className="detail-label" style={{ fontWeight: '500' }}>Notes:</span>
                    <div
                      data-edit-id={`personnel-${person.id}-notes`}
                      className="editable-text personnel-notes"
                      contentEditable={isUserAdmin}
                      suppressContentEditableWarning={true}
                      onMouseDown={(e) => { if (!isUserAdmin) e.preventDefault(); }}
                      onClick={() => isUserAdmin && handleTextClick(`personnel-${person.id}-notes`, person.notes)}
                      onBlur={() => handleTextBlur(`personnel-${person.id}-notes`)}
                      onKeyDown={(e) => handleKeyDown(e, `personnel-${person.id}-notes`)}
                      onInput={handleTextChange}
                      title={isUserAdmin ? "Edit Notes" : ""}
                      style={{ 
                          marginLeft: '5px', 
                          whiteSpace: 'pre-wrap', // Allow newlines
                          minHeight: '30px',     // Ensure space
                          padding: '2px 4px',   // Some padding
                          border: isEditingNotes ? '1px solid #ccc' : 'none' // Visual cue when editing
                      }} 
                    >
                      {isEditingNotes ? editText : (person.notes || "-")}
                    </div>
                  </div>
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