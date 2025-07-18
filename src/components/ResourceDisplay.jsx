import React from 'react';

const ResourceDisplay = ({ resources }) => {
  return (
    <>
      <h3>Your Resources:</h3>
      {resources ? (
        <pre>{
`Gold: ${resources.gold}
Fanpower: ${resources.fanpower}
Gems: ${resources.gems}
Water: ${resources.water}
Food: ${resources.food}
Electricity: ${resources.electricity}`
        }</pre>
      ) : (
        <p>Loading resources...</p>
      )}
    </>
  );
};

export default ResourceDisplay;