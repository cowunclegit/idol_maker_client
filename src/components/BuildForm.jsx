import React from 'react';

const BuildForm = ({ gameData, buildingManagement }) => {
  const { availableBuildingTypes } = gameData;
  const { dialogs } = buildingManagement;
  const { dialogBuildingType: buildingType, setDialogBuildingType: setBuildingType, dialogFloor: floor, setDialogFloor: setFloor, dialogSlot: slot, setDialogSlot: setSlot, getDialogBuildingCost: getBuildingCost, selectedDialogBuildingCost: selectedBuildingCost, handleBuildAndCloseDialog } = dialogs;
  return (
    <>
      <h3>Build Building</h3>
      <div>
        <label>
          Type:
          <select value={buildingType} onChange={(e) => setBuildingType(e.target.value)}>
            {availableBuildingTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
              </option>
            ))}
          </select>
        </label>
        {selectedBuildingCost && (
          <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
            Required:
            {selectedBuildingCost.gold > 0 && `Gold: ${selectedBuildingCost.gold} `}
            {selectedBuildingCost.fanpower > 0 && `Fanpower: ${selectedBuildingCost.fanpower} `}
            {selectedBuildingCost.electricity > 0 && `Electricity: ${selectedBuildingCost.electricity} `}
          </div>
        )}
      </div>
      <div>
        <label>
          Floor:
          <input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          Slot:
          <input type="number" value={slot} onChange={(e) => setSlot(e.target.value)} />
        </label>
      </div>
      <button onClick={() => handleBuildAndCloseDialog(buildingType, floor, slot)}>Build</button>
    </>
  );
};

export default BuildForm;
