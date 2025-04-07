import React, { useMemo } from 'react';
import { Download } from 'lucide-react';
import { downloadCSV } from '../lib/utils';
// Uncomment Chart.js imports
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend); // Register elements

// Helper function to parse cost range string (e.g., "$150,000 - $180,000")
// Returns the midpoint or 0 if parsing fails.
const getCostMidpoint = (costRange) => {
  if (!costRange || typeof costRange !== 'string') return 0;
  try {
    const numbers = costRange.match(/\d{1,3}(?:,\d{3})*(?:\.\d+)?/g);
    if (!numbers || numbers.length === 0) return 0;
    
    const cleanedNumbers = numbers.map(n => parseFloat(n.replace(/,/g, '')));
    
    if (cleanedNumbers.length === 1) return cleanedNumbers[0];
    if (cleanedNumbers.length === 2) return (cleanedNumbers[0] + cleanedNumbers[1]) / 2;
    
    return 0; // Fallback if more than 2 numbers found?
  } catch (error) {
    console.error("Error parsing cost range:", costRange, error);
    return 0;
  }
};

const Budget = ({
  budgetData,
  isUserAdmin,
  editingId,
  editText,
  handleTextClick,
  handleTextBlur,
  handleKeyDown,
  handleTextChange
}) => {

  // Calculate factory totals using useMemo to avoid recalculation on every render
  const factorySummaries = useMemo(() => {
    if (!budgetData) return [];

    return Object.entries(budgetData).map(([factoryId, factoryData]) => {
      let totalPersonnelCost = 0;
      if (factoryData.personnelCosts) {
        Object.values(factoryData.personnelCosts).forEach(category => {
          if (category && Array.isArray(category.roles)) {
            category.roles.forEach(role => {
              totalPersonnelCost += getCostMidpoint(role.costRange);
            });
          }
        });
      }
      const totalOperationalExpenses = Array.isArray(factoryData.operationalExpenses)
        ? factoryData.operationalExpenses.reduce((sum, item) => sum + (item.amount || 0), 0)
        : 0;
      const totalBudget = totalPersonnelCost + totalOperationalExpenses;
      const productionVolume = factoryData.productionVolume || 0;
      const costPerUnit = productionVolume > 0 ? totalBudget / productionVolume : 0;

      return {
        factoryId,
        factoryData, // Keep original data for rendering tables
        // Calculated values:
        totalPersonnelCost,
        totalOperationalExpenses,
        totalBudget,
        costPerUnit,
        productionVolume // Include volume here too
      };
    });
  }, [budgetData]);

  const handleExportBudgetSummary = () => {
     // Use the calculated summaries
    const summaryData = factorySummaries.map(summary => ({
        FactoryName: summary.factoryData.name || summary.factoryId,
        TotalBudget: summary.totalBudget,
        CostPerUnit: summary.costPerUnit.toFixed(2),
        ProductionVolume: summary.productionVolume,
        TotalPersonnelCost: summary.totalPersonnelCost,
        TotalOperationalExpenses: summary.totalOperationalExpenses,
      }));
    
    const csvString = arrayToCsv(summaryData);
    downloadCSV(csvString, 'budget_summary.csv');
  };

  if (!budgetData || Object.keys(budgetData).length === 0) {
    return <div className="budget-container">Loading budget data or no data available...</div>;
  }

  return (
    <div className="budget-container">
      <h2>Budget Analysis by Factory</h2>

      <div className="factories-container">
        {factorySummaries.map(summary => {
          const { 
            factoryId, 
            factoryData, 
            totalPersonnelCost, 
            totalOperationalExpenses, 
            totalBudget, 
            costPerUnit 
          } = summary;

          // Prepare Pie Chart Data using calculated values
          const pieChartData = {
            labels: ['Personnel Costs', 'Operational Expenses'],
            datasets: [
              {
                label: 'Cost Breakdown',
                data: [totalPersonnelCost, totalOperationalExpenses],
                backgroundColor: [
                  'rgba(0, 75, 135, 0.7)', // Primary color, slightly transparent
                  'rgba(244, 121, 32, 0.7)', // Accent color, slightly transparent
                ],
                borderColor: [
                  'rgba(0, 75, 135, 1)',
                  'rgba(244, 121, 32, 1)',
                ],
                borderWidth: 1,
              },
            ],
          };
          const pieChartOptions = {
             responsive: true,
             plugins: {
                 legend: {
                     position: 'top',
                 },
                 title: {
                     display: true,
                     text: 'Cost Allocation',
                 },
             },
           };

          return (
            <div key={factoryId} className="factory-budget-section">
              <h3>{factoryData.name || factoryId}</h3>

              <h4>Personnel Costs</h4>
              <table className="budget-table personnel-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Role</th>
                    <th>Count</th>
                    <th>Cost Range</th>
                  </tr>
                </thead>
                <tbody>
                  {factoryData.personnelCosts && Object.entries(factoryData.personnelCosts).map(([categoryKey, categoryData]) => (
                    categoryData && categoryData.roles && (
                      <React.Fragment key={`${factoryId}-${categoryKey}`}>
                        <tr><td colSpan="4" className="budget-category-title">{categoryData.title || categoryKey}</td></tr>
                        {categoryData.roles.map((role, index) => (
                          <tr key={`${factoryId}-${categoryKey}-${index}`}>
                            <td></td>
                            <td
                               data-edit-id={`budget-${factoryId}-personnelCosts-${categoryKey}-${index}-title`}
                               className="editable-text"
                               contentEditable={isUserAdmin}
                               suppressContentEditableWarning={true}
                               onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                               onClick={() => isUserAdmin && handleTextClick(`budget-${factoryId}-personnelCosts-${categoryKey}-${index}-title`, role.title || '')}
                               onBlur={() => handleTextBlur(`budget-${factoryId}-personnelCosts-${categoryKey}-${index}-title`)}
                               onKeyDown={(e) => handleKeyDown(e, `budget-${factoryId}-personnelCosts-${categoryKey}-${index}-title`)}
                               onInput={handleTextChange}
                              >
                               {editingId === `budget-${factoryId}-personnelCosts-${categoryKey}-${index}-title` ? editText : (role.title || '')}
                            </td>
                            <td
                               data-edit-id={`budget-${factoryId}-personnelCosts-${categoryKey}-${index}-count`}
                               className="editable-text number-input"
                                contentEditable={isUserAdmin}
                                suppressContentEditableWarning={true}
                                onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                                onClick={() => isUserAdmin && handleTextClick(`budget-${factoryId}-personnelCosts-${categoryKey}-${index}-count`, (role.count ?? '').toString())}
                                onBlur={() => handleTextBlur(`budget-${factoryId}-personnelCosts-${categoryKey}-${index}-count`)}
                                onKeyDown={(e) => handleKeyDown(e, `budget-${factoryId}-personnelCosts-${categoryKey}-${index}-count`)}
                                onInput={handleTextChange}
                               >
                                {editingId === `budget-${factoryId}-personnelCosts-${categoryKey}-${index}-count` ? editText : (role.count ?? '')}
                            </td>
                            <td
                               data-edit-id={`budget-${factoryId}-personnelCosts-${categoryKey}-${index}-costRange`}
                               className="editable-text"
                                contentEditable={isUserAdmin}
                                suppressContentEditableWarning={true}
                                onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                                onClick={() => isUserAdmin && handleTextClick(`budget-${factoryId}-personnelCosts-${categoryKey}-${index}-costRange`, role.costRange || '')}
                                onBlur={() => handleTextBlur(`budget-${factoryId}-personnelCosts-${categoryKey}-${index}-costRange`)}
                                onKeyDown={(e) => handleKeyDown(e, `budget-${factoryId}-personnelCosts-${categoryKey}-${index}-costRange`)}
                                onInput={handleTextChange}
                               >
                                {editingId === `budget-${factoryId}-personnelCosts-${categoryKey}-${index}-costRange` ? editText : (role.costRange || '')}
                            </td>
                          </tr>
                        ))}
                        {categoryData.subtotal && (
                           <tr className="budget-subtotal">
                              <td></td>
                              <td><strong>Subtotal</strong></td>
                              <td><strong>{categoryData.subtotal.count}</strong></td>
                              <td><strong>{categoryData.subtotal.costRange}</strong></td>
                            </tr>
                         )}
                      </React.Fragment>
                    )
                  ))}
                </tbody>
              </table>

              <h4>Operational Expenses</h4>
               <table className="budget-table operational-table">
                 <thead>
                   <tr>
                     <th>Category</th>
                     <th>Amount</th>
                   </tr>
                 </thead>
                 <tbody>
                  {Array.isArray(factoryData.operationalExpenses) && factoryData.operationalExpenses.map((item, index) => (
                      <tr key={`${factoryId}-opEx-${index}`}>
                         <td
                           data-edit-id={`budget-${factoryId}-operationalExpenses-${index}-na-category`}
                           className="editable-text"
                            contentEditable={isUserAdmin}
                            suppressContentEditableWarning={true}
                            onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                            onClick={() => isUserAdmin && handleTextClick(`budget-${factoryId}-operationalExpenses-${index}-na-category`, item.category || '')}
                            onBlur={() => handleTextBlur(`budget-${factoryId}-operationalExpenses-${index}-na-category`)}
                            onKeyDown={(e) => handleKeyDown(e, `budget-${factoryId}-operationalExpenses-${index}-na-category`)}
                            onInput={handleTextChange}
                           >
                            {editingId === `budget-${factoryId}-operationalExpenses-${index}-na-category` ? editText : (item.category || '')}
                         </td>
                          <td
                           data-edit-id={`budget-${factoryId}-operationalExpenses-${index}-na-amount`}
                           className="editable-text number-input"
                            contentEditable={isUserAdmin}
                            suppressContentEditableWarning={true}
                            onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                            onClick={() => isUserAdmin && handleTextClick(`budget-${factoryId}-operationalExpenses-${index}-na-amount`, (item.amount ?? '').toString())}
                            onBlur={() => handleTextBlur(`budget-${factoryId}-operationalExpenses-${index}-na-amount`)}
                            onKeyDown={(e) => handleKeyDown(e, `budget-${factoryId}-operationalExpenses-${index}-na-amount`)}
                            onInput={handleTextChange}
                           >
                            {editingId === `budget-${factoryId}-operationalExpenses-${index}-na-amount` ? editText : (item.amount ?? '')}
                         </td>
                      </tr>
                  ))}
                 </tbody>
               </table>
               
               <div className="production-volume">
                  <h4>Production Volume (Units):</h4> 
                  <span
                       data-edit-id={`budget-${factoryId}-productionVolume-na-na-volume`}
                       className="editable-text number-input"
                       contentEditable={isUserAdmin}
                       suppressContentEditableWarning={true}
                       onMouseDown={(e) => {if (!isUserAdmin) e.preventDefault()}}
                       onClick={() => isUserAdmin && handleTextClick(`budget-${factoryId}-productionVolume-na-na-volume`, (factoryData.productionVolume ?? '').toString())}
                       onBlur={() => handleTextBlur(`budget-${factoryId}-productionVolume-na-na-volume`)}
                       onKeyDown={(e) => handleKeyDown(e, `budget-${factoryId}-productionVolume-na-na-volume`)}
                       onInput={handleTextChange}
                       >
                        {editingId === `budget-${factoryId}-productionVolume-na-na-volume` ? editText : (factoryData.productionVolume ?? '')}
                  </span>
               </div>

               <div className="factory-totals">
                  <h4>Totals</h4>
                  <p>Total Personnel Cost: ${totalPersonnelCost.toLocaleString()}</p>
                  <p>Total Operational Expenses: ${totalOperationalExpenses.toLocaleString()}</p>
                  <p><strong>Total Budget: ${totalBudget.toLocaleString()}</strong></p>
                  <p><strong>Cost Per Unit: ${costPerUnit.toFixed(2)}</strong></p>
               </div>

              {/* Render Pie Chart */}
              <div className="chart-container pie-chart-container">
                 <h4>Cost Allocation Chart</h4>
                 {/* Uncomment Pie chart component */}
                   <Pie data={pieChartData} options={pieChartOptions} /> 
                 {/* REMOVE Placeholder text */}
                 {/* 
                 <p style={{ textAlign: 'center', padding: '20px', border: '1px dashed #ccc' }}>
                   [Pie Chart Placeholder - Requires 'react-chartjs-2' installation]
                 </p>
                 */}
              </div>

            </div>
          );
        })}
      </div>
      
      {/* Comparative Analysis Section */}
      <div className="comparative-analysis">
        <div className="section-header">
           <h2>Comparative Summary</h2>
           <button onClick={handleExportBudgetSummary} className="export-button" title="Export Budget Summary">
             <Download size={18} /> Export Summary
           </button>
        </div>
        <table className="budget-table summary-table">
          <thead>
            <tr>
              <th>Factory</th>
              <th>Total Budget</th>
              <th>Cost Per Unit</th>
            </tr>
          </thead>
          <tbody>
            {factorySummaries.map(summary => (
              <tr key={`${summary.factoryId}-summary`}>
                <td>{summary.factoryData.name || summary.factoryId}</td>
                <td>${summary.totalBudget.toLocaleString()}</td>
                <td>${summary.costPerUnit.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Placeholder for Charts Section */} 

    </div>
  );
};

// Helper function (can be moved to utils if reused)
const arrayToCsv = (data) => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));
  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '\"\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
};

export default Budget; 