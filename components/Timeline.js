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
      <div className="timeline-phases">
        {timeline.map((phase, index) => (
          <div key={index} className="timeline-phase">
            <div 
                className="editable-text phase-title"
                data-edit-id={`timeline-${index}-phase`}
                contentEditable={isUserAdmin}
                suppressContentEditableWarning={true}
                onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                onClick={() => isUserAdmin && handleTextClick(`timeline-${index}-phase`, phase.phase)}
                onBlur={() => handleTextBlur(`timeline-${index}-phase`)}
                onKeyDown={(e) => handleKeyDown(e, `timeline-${index}-phase`)}
                onInput={handleTextChange}
             >
                {editingId === `timeline-${index}-phase` ? editText : phase.phase}
             </div>
            <div 
                className="editable-text phase-timeframe"
                data-edit-id={`timeline-${index}-timeframe`}
                contentEditable={isUserAdmin}
                suppressContentEditableWarning={true}
                 onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                onClick={() => isUserAdmin && handleTextClick(`timeline-${index}-timeframe`, phase.timeframe)}
                onBlur={() => handleTextBlur(`timeline-${index}-timeframe`)}
                onKeyDown={(e) => handleKeyDown(e, `timeline-${index}-timeframe`)}
                onInput={handleTextChange}
            >
                 {editingId === `timeline-${index}-timeframe` ? editText : phase.timeframe}
            </div>
            <ul className="timeline-activities">
              {phase.activities && phase.activities.map((activity, actIndex) => (
                <li 
                    key={actIndex}
                    className="editable-text"
                    data-edit-id={`timeline-${index}-activity-${actIndex}`}
                    contentEditable={isUserAdmin}
                    suppressContentEditableWarning={true}
                    onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                    onClick={() => isUserAdmin && handleTextClick(`timeline-${index}-activity-${actIndex}`, activity)}
                    onBlur={() => handleTextBlur(`timeline-${index}-activity-${actIndex}`)}
                    onKeyDown={(e) => handleKeyDown(e, `timeline-${index}-activity-${actIndex}`)}
                     onInput={handleTextChange}
                >
                     {editingId === `timeline-${index}-activity-${actIndex}` ? editText : activity}
                 </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline; 