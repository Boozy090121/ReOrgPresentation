import React, { useState, useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import { downloadCSV, getCostMidpoint } from '../lib/utils';
import { PRODUCTIVITY_METRICS, ROLE_TASK_MAPPING } from '../lib/data'; // Import from data.js
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const WorkloadAnalysis = ({ personnel, roles, isUserAdmin }) => { 
  const [workOrders, setWorkOrders] = useState({
    // Initial state with some example clients/tasks
    clientA_batchReview: 1500, 
    clientA_release: 800,
    clientB_complaints: 120,
  });

  const [calculatedHeadcount, setCalculatedHeadcount] = useState({});
  const [availableHeadcount, setAvailableHeadcount] = useState({});

  const chartData = useMemo(() => {
    // Check if roles or personnel are missing
    if (!roles || !personnel) return { labels: [], datasets: [] };

    const roleHeadcounts = {};
    const roleSalaries = {};
    // Check roles before iteration
    Object.keys(roles).forEach(roleKey => {
       // Check roles[roleKey] before accessing title
       const role = roles[roleKey];
       if (role) {
         roleHeadcounts[role.title || roleKey] = 0;
         roleSalaries[role.title || roleKey] = getCostMidpoint(role.costRange);
       }
    });

    // Check personnel before iteration
    if (Array.isArray(personnel)) {
        personnel.forEach(person => {
           // Check person and person.assignedRole
           if (person && person.assignedRole) {
               const assignedRole = roles[person.assignedRole];
               // Check assignedRole before accessing title
               if (assignedRole) {
                   const title = assignedRole.title || person.assignedRole;
                   roleHeadcounts[title] = (roleHeadcounts[title] || 0) + 1;
               }
           }
        });
    }
    
    // ... rest of chartData preparation ...
  }, [roles, personnel]);

  // Function to handle input changes
  const handleInputChange = (taskKey, value) => {
    const numericValue = parseInt(value) || 0;
    setWorkOrders(prev => ({
      ...prev,
      [taskKey]: numericValue,
    }));
  };

  // Effect to recalculate headcount when workOrders or metrics change
  useEffect(() => {
    const required = {};
    // Calculate required headcount for each task
    Object.keys(workOrders).forEach(taskKey => {
      const volume = workOrders[taskKey];
      const metric = PRODUCTIVITY_METRICS[taskKey];
      if (volume > 0 && metric > 0) {
        required[taskKey] = Math.ceil(volume / metric);
      } else {
        required[taskKey] = 0;
      }
    });
    
    // Aggregate required headcount by role (basic example)
    const requiredByRole = {};
    Object.keys(ROLE_TASK_MAPPING).forEach(roleKey => {
       requiredByRole[roleKey] = 0;
       ROLE_TASK_MAPPING[roleKey].forEach(taskKey => {
           if (required[taskKey]) {
               // This simple aggregation assumes one role per task metric
               // More complex logic needed if tasks are shared or metrics are per team
               requiredByRole[roleKey] += required[taskKey]; 
           }
       });
    });

    setCalculatedHeadcount(requiredByRole);
  }, [workOrders]);

  // Effect to calculate available headcount when personnel changes
  useEffect(() => {
    const available = {};
    if (personnel && Array.isArray(personnel)) {
       Object.keys(roles).forEach(roleKey => {
         available[roleKey] = personnel.filter(p => p.assignedRole === roleKey).length;
       });
    }
    setAvailableHeadcount(available);
  }, [personnel, roles]);

  const handleExportWorkload = () => {
    const comparisonData = Object.keys(roles)
      .map(roleKey => {
        const required = calculatedHeadcount[roleKey] || 0;
        const available = availableHeadcount[roleKey] || 0;
        const difference = available - required;
        const roleTitle = roles[roleKey]?.title || roleKey;
        
        // Optionally filter out roles with 0 required and 0 available
        if (required === 0 && available === 0) {
          return null;
        }

        return {
          Role: roleTitle,
          RequiredHeadcount: required,
          AvailableHeadcount: available,
          GapSurplus: difference,
        };
      })
      .filter(row => row !== null); // Remove null rows

    if (comparisonData.length === 0) {
        alert("No data to export."); // Or handle appropriately
        return;
    }

    const csvString = arrayToCsv(comparisonData);
    downloadCSV(csvString, 'workload_analysis.csv');
  };

  // Check for roles or personnel before rendering
  if (!roles || !personnel) {
    return <div className="workload-analysis-container">Loading analysis data...</div>;
  }

  return (
    <div className="workload-analysis-container">
      <div className="section-header">
        <h2>Workload Analysis & Headcount Calculation</h2>
        <button onClick={handleExportWorkload} className="export-button" title="Export Workload Analysis">
             <Download size={18} /> Export Analysis
           </button>
      </div>

      <div className="workload-inputs">
        <h3>Monthly Work Order Volumes</h3>
        {Object.keys(workOrders).map(taskKey => (
          <div key={taskKey} className="input-group">
            <label htmlFor={taskKey}>{taskKey.replace(/_/g, ' ')}:</label>
            <input
              type="number"
              id={taskKey}
              name={taskKey}
              value={workOrders[taskKey]}
              onChange={(e) => handleInputChange(taskKey, e.target.value)}
              min="0"
            />
             <span className="metric-info"> (Metric: {PRODUCTIVITY_METRICS[taskKey]}/HC/Mo)</span>
          </div>
        ))}
      </div>

      <div className="headcount-results">
        <h3>Headcount Analysis (Required vs. Available)</h3>
        {Object.keys(calculatedHeadcount).length > 0 ? (
           <table className="comparison-table">
             <thead>
               <tr>
                 <th>Role</th>
                 <th>Required Headcount</th>
                 <th>Available Headcount</th>
                 <th>Gap / Surplus</th>
               </tr>
             </thead>
             <tbody>
              {/* Combine roles from calculated and available, or iterate roles object */}
              {Object.keys(roles).map(roleKey => {
                 const required = calculatedHeadcount[roleKey] || 0;
                 const available = availableHeadcount[roleKey] || 0;
                 const difference = available - required;
                 const roleTitle = roles[roleKey]?.title || roleKey;
                 
                 // Only show roles relevant to the calculation or that have staff?
                 // if (required === 0 && available === 0) return null; 

                 return (
                   <tr key={roleKey}>
                     <td>{roleTitle}</td>
                     <td>{required}</td>
                     <td>{available}</td>
                     <td style={{ color: difference < 0 ? 'red' : (difference > 0 ? 'green' : 'inherit') }}>
                       {difference > 0 ? `+${difference}` : difference} 
                       {difference < 0 ? ' (Gap)' : (difference > 0 ? ' (Surplus)' : '')}
                     </td>
                   </tr>
                 );
              })}
             </tbody>
           </table>
        ) : (
           <p>Enter work order volumes to calculate required headcount.</p>
        )}
      </div>

      {/* Placeholders for further analysis */}
      {/* - Capacity vs Demand Visualization */} 
      {/* - What-if Scenario Planning */} 
      {/* - Staffing Gaps/Surpluses */} 

      {/* Check if chartData is valid */} 
      {chartData && chartData.labels && chartData.labels.length > 0 ? (
         <div className="charts-container"> /* ... Chart components ... */ </div>
       ) : (
         <p>Not enough data to display charts.</p>
       )}

    </div>
  );
};

export default WorkloadAnalysis; 