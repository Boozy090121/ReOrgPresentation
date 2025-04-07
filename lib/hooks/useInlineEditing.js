import { useState, useCallback } from 'react';

/**
 * Custom hook to manage state and handlers for inline editing.
 * 
 * @param {Function} getOriginalText - Function to retrieve the original text based on an ID.
 * @param {Function} updateData - Function to call when saving data (e.g., updateFirestoreData).
 * @param {Function} updateLocal - Function to update local state optimistically.
 * @param {Function} setError - Function to set error messages.
 */
export function useInlineEditing(getOriginalText, updateData, updateLocal, setError) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleTextClick = useCallback((id, currentText) => {
    // Add id check
    if (!id) {
      console.warn("[useInlineEditing] handleTextClick called without id.");
      return; 
    }
    setEditingId(id);
    // Ensure currentText is a string or number before setting
    setEditText(typeof currentText === 'string' || typeof currentText === 'number' ? String(currentText) : '');
    
    // Request animation frame for focus
    requestAnimationFrame(() => {
      // Use try-catch for querySelector just in case ID format is bad
      try {
        const element = document.querySelector(`[data-edit-id="${id}"]`);
        if (element) {
          element.focus();
        } else {
          console.warn(`[useInlineEditing] Element with data-edit-id="${id}" not found for focus.`);
        }
      } catch (e) {
        console.error(`[useInlineEditing] Error selecting element for focus with id="${id}":`, e);
      }
    });
  }, []); // No dependencies needed here, relies on arguments

  const handleTextChange = useCallback((e) => {
    // Check if e and e.target exist
    if (e && e.target) {
      // Use textContent, ensure it's treated as a string
      // Prevent excessively long input if necessary (optional)
      const newText = e.target.textContent !== null && e.target.textContent !== undefined ? String(e.target.textContent) : '';
      setEditText(newText);
    } else {
      console.warn("[useInlineEditing] handleTextChange called without valid event target.");
    }
  }, []); // No dependency on setEditText needed

  const handleTextBlur = useCallback(async (id) => {
    // Check if the blurred element matches the one being edited
    if (editingId !== id) {
      // This can happen naturally, e.g., clicking away or programmatic blur
      return;
    }

    // Retrieve original text using the passed-in function
    const originalText = getOriginalText(id);
    
    // Ensure editText and originalText are strings for comparison
    const trimmedEditText = typeof editText === 'string' ? editText.trim() : '';
    const trimmedOriginalText = typeof originalText === 'string' ? originalText.trim() : '';

    // Reset editing state *before* async operations
    const currentlyEditingId = editingId; // Capture id before resetting state
    setEditingId(null);
    setEditText('');

    // Check if text actually changed meaningfully
    if (trimmedEditText === trimmedOriginalText) {
      console.log("[useInlineEditing] No change detected for:", currentlyEditingId);
      // Ensure the visual element reverts if edit text was different only by whitespace
      requestAnimationFrame(() => {
        try {
          const element = document.querySelector(`[data-edit-id="${currentlyEditingId}"]`);
          if (element) element.textContent = originalText; // Use original untrimmed
        } catch (e) { console.error("[useInlineEditing] Error reverting text content:", e); }
      });
      return; // No *meaningful* change, no need to save
    }

    // Clear previous errors before attempting save
    if (setError) setError(null); 

    // Optimistically update local state first using the passed-in function
    if (updateLocal) {
        updateLocal(currentlyEditingId, trimmedEditText); // Use trimmed value for consistency
    } else {
        console.warn("[useInlineEditing] updateLocal function not provided.");
    }

    // Then, attempt to update the persistent store (e.g., Firestore)
    let success = false;
    if (updateData) {
        success = await updateData(currentlyEditingId, trimmedEditText);
    } else {
        console.warn("[useInlineEditing] updateData function not provided.");
        // If no persistent update function, assume local update is "success"
        success = !!updateLocal; 
    }

    if (!success) {
      // Revert local state if persistent update failed
      console.warn("[useInlineEditing] Persistent update failed, reverting local state for:", currentlyEditingId);
      if (updateLocal) {
        // Use originalText (untrimmed) for revert to be precise
        updateLocal(currentlyEditingId, originalText);
      }
      // Visually revert the field as well
      requestAnimationFrame(() => {
        try {
          const element = document.querySelector(`[data-edit-id="${currentlyEditingId}"]`);
          if (element) element.textContent = originalText;
        } catch (e) { console.error("[useInlineEditing] Error reverting text content:", e); }
      });
      // Error state should have been set within updateData or manually if needed
      if (setError && !updateData) {
          setError("Failed to save changes.");
      } 
    } else {
      console.log("[useInlineEditing] Successfully saved changes for:", currentlyEditingId);
      // Optionally confirm save by ensuring visual matches saved state (trimmed)
      requestAnimationFrame(() => {
        try {
          const element = document.querySelector(`[data-edit-id="${currentlyEditingId}"]`);
          if (element) element.textContent = trimmedEditText;
        } catch (e) { console.error("[useInlineEditing] Error confirming text content:", e); }
      });
    }
  }, [editingId, editText, getOriginalText, updateData, updateLocal, setError]);

  const handleKeyDown = useCallback((e, id) => {
    // Check if e exists and has key property
    if (!e || !e.key || !id) return;

    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent newline in contentEditable
      // Ensure the target element exists before blurring
      if (e.target && typeof e.target.blur === 'function') {
        e.target.blur(); // Trigger blur, which calls handleTextBlur
      } else {
        handleTextBlur(id); // Fallback if target isn't available/blurrable
      }
    } else if (e.key === 'Escape') {
      // Store original text before resetting state
      const originalText = getOriginalText(id); 
      setEditingId(null); // Cancel editing on Escape
      setEditText('');
      // Revert visual change immediately using original text
      requestAnimationFrame(() => {
        try {
          const element = document.querySelector(`[data-edit-id="${id}"]`);
          if (element) element.textContent = originalText;
        } catch (err) { console.error("[useInlineEditing] Error reverting text on Escape:", err); }
      });
    }
  }, [getOriginalText, handleTextBlur]); // Depends on getOriginalText and handleTextBlur

  return {
    editingId,
    editText,
    handleTextClick,
    handleTextChange,
    handleTextBlur,
    handleKeyDown,
  };
} 