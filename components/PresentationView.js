import React from \'react\';

// Simple Presentation View Component
const PresentationView = ({ factories, allPersonnel, allRolesData }) => {

    // Helper to get assigned person name
    const getPersonName = (personId) => {
        const person = allPersonnel.find(p => p.id === personId);
        return person ? person.name : \'(Unassigned)\';
    };

    // Helper to get role title
    const getRoleTitle = (roleKey) => {
        return allRolesData[roleKey]?.title || roleKey;
    };

    // Find the \"_shared\" factory data
    const sharedFactory = factories.find(f => f.id === \'_shared\');
    const sharedRoles = allRolesData[\'_shared\'] || {};
    const sharedPersonnelAssignments = allPersonnel.filter(p => p.assignedFactoryId === \'_shared\');

    return (
        <div className=\"presentation-view\">
            <h1>Organizational Overview</h1>

            {/* Iterate through non-shared factories */} 
            {factories.filter(f => f.id !== \'_shared\').map(factory => {
                const factoryRoles = allRolesData[factory.id] || {};
                const factoryPersonnel = allPersonnel.filter(p => p.assignedFactoryId === factory.id);

                return (
                    <section key={factory.id} className=\"factory-section\">
                        <h2>{factory.name || factory.id}</h2>
                        {/* Display key roles or simple list */} 
                        <div className=\"roles-summary\'>
                            {Object.entries(factoryRoles).map(([roleKey, roleData]) => {
                                const assigned = factoryPersonnel.filter(p => p.assignedRoleKey === roleKey);
                                return (
                                    <div key={roleKey} className=\"role-summary-item\">
                                        <strong>{roleData.title || roleKey}:</strong>
                                        <span>
                                            {assigned.length > 0 
                                                ? assigned.map(p => p.name || \'(Unnamed)\').join(\', \') 
                                                : \'(Empty)\'}
                                            ({assigned.length})
                                        </span>
                                    </div>
                                );
                            })}
                             {Object.keys(factoryRoles).length === 0 && <p>No roles defined for this factory.</p>}
                        </div>
                    </section>
                );
            })}
            
             {factories.filter(f => f.id !== \'_shared\').length === 0 && (
                 <p>No specific focus factories defined yet.</p>
             )}

            {/* Shared Resources Section */} 
            {sharedFactory && Object.keys(sharedRoles).length > 0 && (
                 <section className=\"shared-resources-section factory-section\">
                    <h2>{sharedFactory.name || \'Shared Resources\'}</h2>
                    <div className=\"roles-summary\'>
                         {Object.entries(sharedRoles).map(([roleKey, roleData]) => {
                             const assigned = sharedPersonnelAssignments.filter(p => p.assignedRoleKey === roleKey);
                             return (
                                 <div key={roleKey} className=\"role-summary-item\">
                                     <strong>{roleData.title || roleKey}:</strong>
                                     <span>
                                         {assigned.length > 0 
                                             ? assigned.map(p => p.name || \'(Unnamed)\').join(\', \') 
                                             : \'(Empty)\'}
                                         ({assigned.length})
                                     </span>
                                 </div>
                             );
                         })}
                    </div>
                 </section>
            )}

             <style jsx>{`
                .presentation-view {
                    padding: 20px;
                    font-family: sans-serif;
                }
                .factory-section {
                    background-color: #f9f9f9;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    padding: 15px 20px;
                    margin-bottom: 25px;
                }
                .factory-section h2 {
                    margin-top: 0;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                    color: #004B87; /* Primary color */
                }
                .roles-summary {
                    display: grid;
                    gap: 10px;
                }
                .role-summary-item {
                    display: grid;
                    grid-template-columns: 200px 1fr;
                    gap: 10px;
                    font-size: 0.95em;
                    padding-bottom: 5px;
                    border-bottom: 1px dotted #ddd;
                }
                 .role-summary-item:last-child {
                     border-bottom: none;
                 }
                .role-summary-item strong {
                     color: #333;
                }
                 .role-summary-item span {
                     color: #555;
                 }
                 .shared-resources-section {
                     background-color: #e6eef4; /* Lighter blue */
                     border-color: #c0ddee;
                 }
                 .shared-resources-section h2 {
                    color: #002D56; /* Darker blue */
                    border-bottom-color: #c0ddee;
                 }
            `}</style>
        </div>
    );
};

export default PresentationView; 