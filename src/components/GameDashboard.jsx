import React from 'react';
import ResourceDisplay from './ResourceDisplay';
import BuildForm from './BuildForm';
import BuildingList from './BuildingList';
import MapGrid from './MapGrid';
import BuildingActionsDialog from './BuildingActionsDialog';

const GameDashboard = ({ gameLogic }) => {
  const { auth, gameData, buildingManagement } = gameLogic;

  return (
    <div>
      <h2>Welcome, {auth.user.username}!</h2>
      <button onClick={auth.handleLogout}>Logout</button>

      <ResourceDisplay resources={gameData.resources} />

      <BuildForm
        gameData={gameData}
        buildingManagement={buildingManagement}
      />

      <h3>Your Buildings:</h3>
      {gameData.buildings.length > 0 ? (
        <BuildingList
          gameData={gameData}
          buildingManagement={buildingManagement}
        />
      ) : (
        <p>No buildings found.</p>
      )}

      <h3>Building Map:</h3>
      <MapGrid
        gameData={gameData}
        buildingManagement={buildingManagement}
      />

      {buildingManagement.showBuildDialog && (
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
            position: 'relative'
          }}>
            <button
              onClick={() => buildingManagement.setShowBuildDialog(false)}
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
              gameData={gameData}
              buildingManagement={buildingManagement}
            />
          </div>
        </div>
      )}

      {buildingManagement.showBuildingActionsDialog && buildingManagement.selectedBuilding && (
        <BuildingActionsDialog
          gameData={gameData}
          buildingManagement={buildingManagement}
        />
      )}
    </div>
  );
};

export default GameDashboard;
