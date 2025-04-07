import React from 'react';

const Timeline = ({
  timeline, // State passed from parent
  // setTimeline, // Setter passed from parent - needed if editing modifies state directly here
  isUserAdmin,
  editingId,
  editText,
  handleTextClick,
  handleTextBlur,
  handleKeyDown,
  handleTextChange
}) => {

  // If timeline data is empty or not yet loaded, show a message or loading state
  if (!timeline || timeline.length === 0) {
    return <div className="timeline-container">Loading timeline or no data available...</div>;
  }

  return (
    <div className="timeline-container">
      <h2>Implementation Timeline</h2>
      {timeline.map((phase, index) => (
         <div key={phase.id || index} className="timeline-phase">
            {/* Ensure phase.phase exists before rendering */}
            {phase.phase && (
              <h3
                 data-edit-id={`timeline-${index}-phase`}
                 className="editable-text timeline-title"
                 contentEditable={isUserAdmin}
                 suppressContentEditableWarning={true}
                 onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                 onClick={() => isUserAdmin && handleTextClick(`timeline-${index}-phase`, phase.phase)}
                 onBlur={() => handleTextBlur(`timeline-${index}-phase`)}
                 onKeyDown={(e) => handleKeyDown(e, `timeline-${index}-phase`)}
                 onInput={handleTextChange}
               >
                 {editingId === `timeline-${index}-phase` ? editText : phase.phase}
              </h3>
            )}
            {/* Ensure phase.timeframe exists before rendering */}
             {phase.timeframe && (
               <p
                 data-edit-id={`timeline-${index}-timeframe`}
                 className="editable-text timeline-timeframe"
                 contentEditable={isUserAdmin}
                 suppressContentEditableWarning={true}
                 onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                 onClick={() => isUserAdmin && handleTextClick(`timeline-${index}-timeframe`, phase.timeframe)}
                 onBlur={() => handleTextBlur(`timeline-${index}-timeframe`)}
                 onKeyDown={(e) => handleKeyDown(e, `timeline-${index}-timeframe`)}
                 onInput={handleTextChange}
               >
                 {editingId === `timeline-${index}-timeframe` ? editText : phase.timeframe}
               </p>
             )}
            {/* Ensure phase.activities exists and is an array */}
            {Array.isArray(phase.activities) && (
              <ul>
                {phase.activities.map((activity, activityIndex) => (
                  <li
                     key={activityIndex}
                     data-edit-id={`timeline-${index}-activity-${activityIndex}`}
                     className="editable-text timeline-activity"
                     contentEditable={isUserAdmin}
                     suppressContentEditableWarning={true}
                     onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                     onClick={() => isUserAdmin && handleTextClick(`timeline-${index}-activity-${activityIndex}`, activity)}
                     onBlur={() => handleTextBlur(`timeline-${index}-activity-${activityIndex}`)}
                     onKeyDown={(e) => handleKeyDown(e, `timeline-${index}-activity-${activityIndex}`)}
                     onInput={handleTextChange}
                   >
                     {editingId === `timeline-${index}-activity-${activityIndex}` ? editText : activity}
                  </li>
                ))}
              </ul>
            )}
         </div>
      ))}
    </div>
  );
};

export default Timeline; 