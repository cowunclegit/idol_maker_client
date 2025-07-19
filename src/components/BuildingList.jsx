import React from 'react';

const BuildingList = ({ gameData, buildingManagement }) => {
  const { buildings, constructionTimers, handleFinishConstruction } = gameData;
  const { actions } = buildingManagement;
  const { getUpgradeCost, handleUpgrade, formatTime } = actions;
  return (
    <ul>
      {buildings.map((b) => {
        const upgradeCost = getUpgradeCost(b);
        const remainingConstructionTime = constructionTimers[b._id] || 0;
        return (
          <li key={b._id}>
            ID: {b._id}, Type: {b.type}, Level: {b.level}, Floor: {b.floor}, Slot: {b.slots}, Merged: {b.mergedCount}
            {b.isConstructing && (
              <span style={{ marginLeft: '10px', color: 'blue' }}>
                (Constructing: {formatTime(remainingConstructionTime)})
                {remainingConstructionTime <= 0 && (
                  <button
                    onClick={() => handleFinishConstruction(b._id)}
                    style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}
                  >
                    Finish
                  </button>
                )}
              </span>
            )}
            {!b.isConstructing && upgradeCost ? (
              <>
                <button onClick={() => handleUpgrade(b._id)}>Upgrade</button>
                <span style={{ fontSize: '0.8em', marginLeft: '10px' }}>
                  Cost:
                  {upgradeCost.gold > 0 && `Gold: ${upgradeCost.gold} `}
                  {upgradeCost.fanpower > 0 && `Fanpower: ${upgradeCost.fanpower} `}
                  {upgradeCost.electricity > 0 && `Electricity: ${upgradeCost.electricity} `}
                </span>
              </>
            ) : (
              !b.isConstructing && <span style={{ marginLeft: '10px', color: 'gray' }}>Max Level</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default BuildingList;
