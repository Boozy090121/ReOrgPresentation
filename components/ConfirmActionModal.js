import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}> 
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> 
        <h3>
          <AlertCircle size={20} style={{ marginRight: '8px', color: '#dc3545' }} /> 
          {title || 'Confirm Action'}
        </h3>
        <p>{message || 'Are you sure you want to proceed? This action cannot be undone.'}</p>
        <div className="modal-actions">
          <button 
            onClick={onClose}
            className="button secondary-button"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="button danger-button" // Use a danger style
            autoFocus // Focus confirm button
          >
            Confirm
          </button>
        </div>
      </div>
      {/* Basic Styling (ensure styles don't conflict) */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000; 
        }
        .modal-content {
          background: white;
          padding: 25px 30px;
          border-radius: 8px;
          max-width: 450px;
          width: 90%;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          z-index: 1001;
        }
        .modal-content h3 {
          margin-top: 0;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          color: #333;
        }
        .modal-content p {
          margin-bottom: 20px;
          color: #555;
          line-height: 1.5;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        /* Add basic button styles if not globally available */
        .button {
          padding: 8px 15px;
          border-radius: 5px;
          border: 1px solid #ccc;
          cursor: pointer;
          font-size: 0.95em;
        }
        .secondary-button {
          background-color: #eee;
          border-color: #ccc;
        }
        .secondary-button:hover {
          background-color: #ddd;
        }
        .danger-button {
          background-color: #dc3545; 
          color: white;
          border-color: #dc3545;
        }
        .danger-button:hover {
          background-color: #c82333; 
          border-color: #bd2130;
        }
      `}</style>
    </div>
  );
};

export default ConfirmationModal; 