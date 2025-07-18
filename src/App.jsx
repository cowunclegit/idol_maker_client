import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

function App() {
  const [message, setMessage] = useState('Loading...')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('jwtToken'))
  const [resources, setResources] = useState(null)
  const [buildingType, setBuildingType] = useState('idol_house')
  const [floor, setFloor] = useState(0)
  const [slot, setSlot] = useState(0)
  const [buildings, setBuildings] = useState([])
  const [availableBuildingTypes, setAvailableBuildingTypes] = useState([])
  const [mapGrid, setMapGrid] = useState([])
  const [collectionCooldowns, setCollectionCooldowns] = useState({}); 
  const [constructionTimers, setConstructionTimers] = useState({}); 
  const masterIntervalRef = useRef(null); // Ref for the single master interval

  const API_BASE_URL = '' 

  useEffect(() => {
    console.log('Current token state:', token);
  }, [token]);

  useEffect(() => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; 
    console.log('Google Client ID from .env:', GOOGLE_CLIENT_ID);

    if (window.google) {
      console.log('window.google is available.');
      const googleSignInButton = document.getElementById('google-sign-in-button');
      console.log('Google Sign-In Button Element:', googleSignInButton);

      if (googleSignInButton) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          googleSignInButton,
          { theme: 'outline', size: 'large' }
        );
      } else {
        console.error('Error: Google Sign-In Button element not found.');
      }
    } else {
      console.log('window.google is NOT available. Please ensure the GSI script is loaded.');
    }
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    const id_token = response.credential;
    console.log("Google ID Token received from Google:", id_token);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/google`, {
        id_token: id_token,
      });
      console.log('Server response after Google Auth:', res.data);
      const newToken = res.data.token; 
      setToken(newToken);
      localStorage.setItem('jwtToken', newToken);
      console.log('Token saved to localStorage:', newToken);

      fetchProfile(newToken);
      fetchResources(newToken);
      fetchBuildings(newToken);
      fetchAvailableBuildingTypes(newToken);
    } catch (error) {
      console.error('Google Auth Error:', error.response ? error.response.data : error);
      setMessage('Google Auth Failed');
    }
  };

  useEffect(() => {
    if (token) {
      console.log('Token is available, fetching data...');
      fetchProfile(token);
      fetchResources(token);
      fetchBuildings(token);
      fetchAvailableBuildingTypes(token);
    } else {
      console.log('Token is null or empty, not fetching data.');
    }
  }, [token])

  // Single master interval for all time-based updates
  useEffect(() => {
    console.log('--- Starting master interval ---');
    masterIntervalRef.current = setInterval(() => {
      // Update collection cooldowns
      setCollectionCooldowns(prevCooldowns => {
        const updatedCooldowns = { ...prevCooldowns };
        let changed = false;
        if (resources && resources.lastCollected && resources.buildingConfigs) {
          // Iterate over all buildings to update their individual cooldowns
          buildings.forEach(building => {
            const lastCollectedTime = resources.lastCollected[building._id] ? new Date(resources.lastCollected[building._id]).getTime() : 0;
            const config = resources.buildingConfigs[building.type];
            const collectionInterval = config?.levels[building.level]?.collectionInterval; // Get interval from specific building level

            if (collectionInterval) {
              const timeElapsed = Date.now() - lastCollectedTime;
              const remainingCooldown = Math.max(0, collectionInterval - timeElapsed);

              if (updatedCooldowns[building._id] !== remainingCooldown) {
                updatedCooldowns[building._id] = remainingCooldown;
                changed = true;
              }
            }
          });
        }
        return changed ? updatedCooldowns : prevCooldowns;
      });

      // Update construction timers
      setConstructionTimers(prevTimers => {
        const updatedTimers = { ...prevTimers };
        let changed = false;
        buildings.forEach(building => {
          if (building.isConstructing) {
            const finishTime = new Date(building.constructionFinishTime).getTime();
            const remainingTime = Math.max(0, finishTime - Date.now());

            if (updatedTimers[building._id] !== remainingTime) {
              updatedTimers[building._id] = remainingTime;
              changed = true;
            }

            // If construction is finished, trigger finish construction
            if (remainingTime <= 0 && building.isConstructing) { 
              console.log(`  Construction for ${building.type} (${building._id}) finished. Triggering finish.`);
              handleFinishConstruction(building._id); 
            }
          }
        });
        return changed ? updatedTimers : prevTimers;
      });

    }, 1000);

    return () => {
      console.log('--- Clearing master interval ---');
      clearInterval(masterIntervalRef.current);
    };
  }, [resources, buildings, token]); // Dependencies for master interval

  const fetchProfile = async (currentToken) => {
    try {
      console.log('Fetching profile with token:', currentToken);
      const response = await axios.get(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      })
      setUser(response.data.user)
      setMessage(response.data.message)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage('Failed to fetch profile')
      setUser(null)
      setToken(null)
      localStorage.removeItem('jwtToken')
    }
  }

  const fetchResources = async (currentToken) => {
    try {
      console.log('Fetching resources with token:', currentToken);
      const response = await axios.get(`${API_BASE_URL}/api/game/resources`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      })
      setResources(response.data)
      console.log('Fetched resources data:', response.data); 
    } catch (error) {
      console.error('Error fetching resources:', error)
      setResources(null)
    }
  }

  const fetchBuildings = async (currentToken) => {
    try {
      console.log('Fetching buildings with token:', currentToken);
      const response = await axios.get(`${API_BASE_URL}/api/game/buildings`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      })
      setBuildings(response.data.buildings)
      generateMapGrid(response.data.buildings); 
    } catch (error) {
      console.error('Error fetching buildings:', error)
      setBuildings([])
      generateMapGrid([]); 
    }
  }

  const fetchAvailableBuildingTypes = async (currentToken) => {
    try {
      console.log('Fetching available building types with token:', currentToken);
      const response = await axios.get(`${API_BASE_URL}/api/game/config`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setAvailableBuildingTypes(Object.keys(response.data));
      if (Object.keys(response.data).length > 0) {
        setBuildingType(Object.keys(response.data)[0]);
      }
    } catch (error) {
      console.error('Error fetching available building types:', error);
      setAvailableBuildingTypes([]);
    }
  };

  const generateMapGrid = (currentBuildings) => {
    if (currentBuildings.length === 0) {
      setMapGrid([]);
      return;
    }

    const maxFloor = Math.max(...currentBuildings.map(b => b.floor));
    const maxSlot = Math.max(...currentBuildings.flatMap(b => b.slots));
    const minSlot = Math.min(...currentBuildings.flatMap(b => b.slots));

    const gridWidth = maxSlot - minSlot + 1;
    const gridHeight = maxFloor + 1; 

    const newGrid = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(null));

    currentBuildings.forEach(building => {
      building.slots.forEach(s => {
        const normalizedSlot = s - minSlot; 
        if (newGrid[building.floor] && newGrid[building.floor][normalizedSlot] === null) {
          newGrid[building.floor][normalizedSlot] = building; 
        }
      });
    });
    setMapGrid(newGrid);
  };

  const handleBuild = async () => {
    if (!token) {
      alert('Please log in first.')
      return
    }
    try {
      console.log('Building with token:', token);
      const response = await axios.post(
        `${API_BASE_URL}/api/game/build`,
        { type: buildingType, floor: parseInt(floor), slot: parseInt(slot) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert(response.data.message)
      fetchResources(token)
      fetchBuildings(token)
    } catch (error) {
      console.error('Build Error:', error.response ? error.response.data : error)
      alert(`Build failed: ${error.response ? error.response.data.message : error.message}`)
    }
  }

  const handleUpgrade = async (buildingId) => {
    if (!token) {
      alert('Please log in first.')
      return
    }
    try {
      console.log('Upgrading with token:', token);
      const response = await axios.post(
        `${API_BASE_URL}/api/game/upgrade`,
        { buildingId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert(response.data.message)
      fetchResources(token)
      fetchBuildings(token)
    } catch (error) {
      console.error('Upgrade Error:', error.response ? error.response.data : error)
      alert(`Upgrade failed: ${error.response ? error.response.data.message : error.message}`)
    }
  }

  const handleFinishConstruction = async (buildingId) => {
    if (!token) {
      console.error('Cannot finish construction: No token available.');
      return;
    }
    try {
      console.log('Finishing construction for building:', buildingId);
      const response = await axios.post(
        `${API_BASE_URL}/api/game/finish_construction`,
        { buildingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Finish construction response:', response.data.message);
      fetchBuildings(token); // Refresh buildings to update status
    } catch (error) {
      console.error('Error finishing construction:', error.response ? error.response.data : error);
    }
  };

  const handleCollectResources = async (building) => {
    if (!token) {
      alert('Please log in first.');
      return;
    }
    
    const buildingType = building.type;
    const config = resources.buildingConfigs[buildingType];
    if (!config || !config.levels[building.level] || !config.levels[building.level].collectionInterval) {
      alert(`Collection interval not configured for ${buildingType} level ${building.level}.`);
      return;
    }

    const currentCooldown = collectionCooldowns[building._id] || 0; // Use building._id for cooldown
    if (currentCooldown > 0) {
      alert(`Collection for ${buildingType} is on cooldown. Please wait ${formatTime(currentCooldown)}.`);
      return;
    }

    try {
      console.log('Collecting resources from building:', building._id, 'with token:', token);
      const response = await axios.post(
        `${API_BASE_URL}/api/game/collect_resources`,
        { buildingId: building._id }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      fetchResources(token); 
    } catch (error) {
      console.error('Collect Resources Error:', error.response ? error.response.data : error);
      alert(`Collect failed: ${error.response ? error.response.data.message : error.message}`);
    }
  };

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setResources(null)
    setBuildings([])
    setAvailableBuildingTypes([])
    setMapGrid([])
    setCollectionCooldowns({}); 
    // Clear master interval on logout
    if (masterIntervalRef.current) {
      clearInterval(masterIntervalRef.current);
      masterIntervalRef.current = null;
    }
    localStorage.removeItem('jwtToken')
    setMessage('Logged out')
  }

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes > 0 ? `${minutes}m ` : ''}${remainingSeconds}s`;
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

      {/* Google Sign-In Button always rendered for initialization */}
      <div id="google-sign-in-button" style={{ display: user ? 'none' : 'block' }}></div>

      {user ? (
        <div>
          <h2>Welcome, {user.username}!</h2>
          <button onClick={handleLogout}>Logout</button>

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
          <button onClick={handleBuild}>Build</button>

          <h3>Your Buildings:</h3>
          {buildings.length > 0 ? (
            <ul>
              {buildings.map((b) => {
                const upgradeCost = getUpgradeCost(b);
                const remainingConstructionTime = constructionTimers[b._id] || 0;
                return (
                  <li key={b._id}>
                    ID: {b._id}, Type: {b.type}, Level: {b.level}, Floor: {b.floor}, Slots: {b.slots.join(', ')}
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
          ) : (
            <p>No buildings found.</p>
          )}

          <h3>Building Map:</h3>
          <div style={{ display: 'grid', border: '1px solid black' }}>
            {mapGrid.slice().reverse().map((row, rowIndex) => (
              <div key={rowIndex} style={{ display: 'flex' }}>
                {row.map((cell, colIndex) => {
                  const remainingConstructionTime = cell && constructionTimers[cell._id] || 0;
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      style={{
                        width: '80px',
                        height: '80px',
                        border: '1px solid #ccc',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '0.7em',
                        backgroundColor: cell ? '#e0ffe0' : '#f0f0f0',
                        color: 'black',
                        cursor: cell ? 'pointer' : 'default',
                      }}
                      onClick={() => cell && handleCollectResources(cell)}
                    >
                      {cell ? (
                        <>
                          <div>{cell.type.replace(/_/g, ' ')}</div>
                          <div>Lvl: {cell.level}</div>
                          <div>F:{cell.floor} S:{cell.slots.join(',')}</div>
                          {collectionCooldowns[cell._id] > 0 && (
                            <div style={{ fontSize: '0.8em', color: 'red' }}>
                              CD: {formatTime(collectionCooldowns[cell._id])}
                            </div>
                          )}
                          {cell.isConstructing && (
                            <div style={{ fontSize: '0.8em', color: 'blue' }}>
                              {formatTime(remainingConstructionTime)}
                            </div>
                          )}
                        </>
                      ) : (
                        `F:${mapGrid.length - 1 - rowIndex} S:${colIndex}`
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>Please log in to view game content.</p>
      )}
    </div>
  )
}

export default App