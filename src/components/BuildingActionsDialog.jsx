import React from 'react';

const BuildingActionsDialog = ({ gameData, buildingManagement }) => {
  const { selectedBuilding: building } = buildingManagement.dialogs;
  const { handleCloseBuildingActionsDialog: onClose } = buildingManagement.dialogs;
  const { handleCollectResources: onCollect, handleUpgrade: onUpgrade, handleDemolish: onDemolish, formatTime, getUpgradeCost } = buildingManagement.actions;
  const { collectionCooldowns } = gameData;
  const currentCooldown = collectionCooldowns[building._id] || 0;
  const upgradeCost = getUpgradeCost(building); // Add this line

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#aaaaaa',
        padding: '20px',
        borderRadius: '8px',
        position: 'relative',
        color: 'black'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '1.2em',
            cursor: 'pointer'
          }}
        >X</button>
        <h2>{building.type.replace(/_/g, ' ')} - Level {building.level}</h2>
        <p>Floor: {building.floor}, Slot: {building.slots}, Merged: {building.mergedCount}</p>

        {!building.isConstructing && (
          <button
            onClick={() => onCollect(building._id, building.type, building.level, collectionCooldowns)}
            disabled={currentCooldown > 0}
            style={{ marginRight: '10px' }}
          >
            Collect Resources {currentCooldown > 0 && `(${formatTime(currentCooldown)})`}
          </button>
        )}

        {!building.isConstructing && upgradeCost ? (
          <button onClick={() => onUpgrade(building._id)}>
            Upgrade
          </button>
        ) : (
          !building.isConstructing && <span style={{ marginLeft: '10px', color: 'gray' }}>Max Level</span>
        )}

        <button
          onClick={() => onDemolish(building._id)}
          style={{ marginLeft: '10px', backgroundColor: '#ff6666', color: 'white' }}
        >
          Demolish
        </button>
      </div>
    </div>
  );
};

export default BuildingActionsDialog;
