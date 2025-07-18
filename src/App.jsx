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
  const { resources, buildings, availableBuildingTypes, mapGrid, collectionCooldowns, constructionTimers, fetchResources, fetchBuildings, handleFinishConstruction } = useGameData(token, fetchProfile);
  const { handleBuild, handleUpgrade, handleCollectResources, formatTime } = useBuildingActions(token, fetchResources, fetchBuildings);

  const [buildingType, setBuildingType] = useState('idol_house');
  const [floor, setFloor] = useState(0);
  const [slot, setSlot] = useState(0);

  useEffect(() => {
    if (availableBuildingTypes.length > 0) {
      setBuildingType(availableBuildingTypes[0]);
    }
  }, [availableBuildingTypes]);

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

          <BuildForm
            buildingType={buildingType}
            setBuildingType={setBuildingType}
            availableBuildingTypes={availableBuildingTypes}
            floor={floor}
            setFloor={setFloor}
            slot={slot}
            setSlot={setSlot}
            handleBuild={() => handleBuild(buildingType, floor, slot)}
            getBuildingCost={getBuildingCost}
            selectedBuildingCost={selectedBuildingCost}
          />

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
          />
        </div>
      ) : (
        <p>Please log in to view game content.</p>
      )}
    </div>
  );
}

export default App;
