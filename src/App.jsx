import { useState, useEffect } from 'react';
import useAuth from './hooks/useAuth';
import useGameData from './hooks/useGameData';
import useBuildingActions from './hooks/useBuildingActions';
import MapGrid from './components/MapGrid';
import BuildingList from './components/BuildingList';
import ResourceDisplay from './components/ResourceDisplay';
import BuildForm from './components/BuildForm';

function App() {
  const { user, token, message, handleLogout, fetchProfile, setToken, setMessage } = useAuth();
  const { resources, buildings, availableBuildingTypes, mapGrid, collectionCooldowns, constructionTimers, fetchResources, fetchBuildings, handleFinishConstruction, minSlot } = useGameData(token, fetchProfile);
  const { handleBuild, handleUpgrade, handleCollectResources, formatTime } = useBuildingActions(token, fetchResources, fetchBuildings);

  const [buildingType, setBuildingType] = useState('idol_house');
  const [floor, setFloor] = useState(0);
  const [slot, setSlot] = useState(0);

  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [dialogFloor, setDialogFloor] = useState(0);
  const [dialogSlot, setDialogSlot] = useState(0);

  useEffect(() => {
    if (availableBuildingTypes.length > 0) {
      setBuildingType(availableBuildingTypes[0]);
    }
  }, [availableBuildingTypes]);

  const handleEmptyCellClick = (clickedFloor, clickedSlot) => {
    setDialogFloor(clickedFloor);
    setDialogSlot(clickedSlot);
    setShowBuildDialog(true);
  };

  const handleBuildAndCloseDialog = async (buildingType, floor, slot) => {
    await handleBuild(buildingType, floor, slot);
    setShowBuildDialog(false);
  };

  const getBuildingCost = (type) => {
    if (!resources || !resources.buildingConfigs || !resources.buildingConfigs[type]) {
      return null;
    }
    return resources.buildingConfigs[type].levels[1].cost; // Cost for level 1
  };

  const getUpgradeCost = (building) => {
    if (!resources || !resources.buildingConfigs || !resources.buildingConfigs[building.type]) {
      return null;
    }
    const config = resources.buildingConfigs[building.type];
    const nextLevel = building.level + 1;
    if (nextLevel > config.maxLevel) {
      return null; // Already max level
    }
    return config.levels[nextLevel]?.cost; // Cost for next level
  };

  const selectedBuildingCost = getBuildingCost(buildingType);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Idol Maker Client</h1>
      <p>Status: {message}</p>

      <div id="google-sign-in-button" style={{ display: user ? 'none' : 'block' }}></div>

      {user ? (
        <div>
          <h2>Welcome, {user.username}!</h2>
          <button onClick={handleLogout}>Logout</button>

          <ResourceDisplay resources={resources} />

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
          <button onClick={handleBuildAndCloseDialog}>Build</button>

          <h3>Your Buildings:</h3>
          {buildings.length > 0 ? (
            <BuildingList
              buildings={buildings}
              getUpgradeCost={getUpgradeCost}
              handleUpgrade={handleUpgrade}
              handleFinishConstruction={handleFinishConstruction}
              constructionTimers={constructionTimers}
              formatTime={formatTime}
            />
          ) : (
            <p>No buildings found.</p>
          )}

          <h3>Building Map:</h3>
          <MapGrid
            mapGrid={mapGrid}
            collectionCooldowns={collectionCooldowns}
            constructionTimers={constructionTimers}
            handleCollectResources={handleCollectResources}
            formatTime={formatTime}
            buildingConfigs={resources?.buildingConfigs}
            onEmptyCellClick={handleEmptyCellClick}
            minSlot={minSlot}
          />

          {showBuildDialog && (
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
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                position: 'relative'
              }}>
                <button
                  onClick={() => setShowBuildDialog(false)}
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
                <BuildForm
                  buildingType={buildingType}
                  setBuildingType={setBuildingType}
                  availableBuildingTypes={availableBuildingTypes}
                  floor={dialogFloor}
                  setFloor={setDialogFloor}
                  slot={dialogSlot}
                  setSlot={setDialogSlot}
                  handleBuild={() => handleBuildAndCloseDialog(buildingType, dialogFloor, dialogSlot)}
                  getBuildingCost={getBuildingCost}
                  selectedBuildingCost={getBuildingCost(buildingType)}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>Please log in to view game content.</p>
      )}
    </div>
  );
}

export default App;
