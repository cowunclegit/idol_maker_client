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
  const [collectionCooldown, setCollectionCooldown] = useState(0); 
  const cooldownTimerRef = useRef(null); 

  const API_BASE_URL = '' 

  useEffect(() => {
    console.log('Current token state:', token);
  }, [token]);

  useEffect(() => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; 
    console.log('Google Client ID from .env:', GOOGLE_CLIENT_ID);

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-sign-in-button'),
        { theme: 'outline', size: 'large' }
      );
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

  useEffect(() => {
    if (resources && resources.lastCollected && resources.collectionInterval) {
      const lastCollectedTime = new Date(resources.lastCollected).getTime();
      const collectionInterval = resources.collectionInterval;
      const timeElapsed = Date.now() - lastCollectedTime;
      const remainingCooldown = Math.max(0, collectionInterval - timeElapsed);
      setCollectionCooldown(remainingCooldown);

      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }

      if (remainingCooldown > 0) {
        cooldownTimerRef.current = setInterval(() => {
          setCollectionCooldown(prev => {
            if (prev <= 1000) {
              clearInterval(cooldownTimerRef.current);
              return 0;
            }
            return prev - 1000;
          });
        }, 1000);
      }
    }
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, [resources]);

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
      generateMapGrid(response.data.buildings); // Explicitly call generateMapGrid with fresh data
    } catch (error) {
      console.error('Error fetching buildings:', error)
      setBuildings([])
      generateMapGrid([]); // Also update map grid on error
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

  const handleCollectResources = async (building) => {
    if (!token) {
      alert('Please log in first.');
      return;
    }
    // Removed building.type === 'office' check
    if (collectionCooldown > 0) {
      alert(`Collection on cooldown. Please wait ${formatTime(collectionCooldown)}.`);
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
    setCollectionCooldown(0); 
    localStorage.removeItem('jwtToken')
    setMessage('Logged out')
  }

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes > 0 ? `${minutes}m ` : ''}${remainingSeconds}s`;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Idol Maker Client</h1>
      <p>Status: {message}</p>

      {!user ? (
        <div>
          <h2>Authentication</h2>
          <div id="google-sign-in-button"></div>
        </div>
      ) : (
        <div>
          <h2>Welcome, {user.username}!</h2>
          <button onClick={handleLogout}>Logout</button>

          <h3>Your Resources:</h3>
          {resources ? (
            <pre>{JSON.stringify(resources, null, 2)}</pre>
          ) : (
            <p>Loading resources...</p>
          )}

          <h3>Collect Resources</h3>
          {/* Removed Collect Resources button */}

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
              {buildings.map((b) => (
                <li key={b._id}>
                  ID: {b._id}, Type: {b.type}, Level: {b.level}, Floor: {b.floor}, Slots: {b.slots.join(', ')}
                  {b.isConstructing && ' (Constructing)'}
                  <button onClick={() => handleUpgrade(b._id)}>Upgrade</button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No buildings found.</p>
          )}

          <h3>Building Map:</h3>
          <div style={{ display: 'grid', border: '1px solid black' }}>
            {mapGrid.slice().reverse().map((row, rowIndex) => (
              <div key={rowIndex} style={{ display: 'flex' }}>
                {row.map((cell, colIndex) => (
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
                      cursor: cell ? 'pointer' : 'default', // Cursor for any building
                    }}
                    onClick={() => cell && handleCollectResources(cell)} // Call for any building
                  >
                    {cell ? (
                      <>
                        <div>{cell.type.replace(/_/g, ' ')}</div>
                        <div>Lvl: {cell.level}</div>
                        <div>F:{cell.floor} S:{cell.slots.join(',')}</div>
                        {cell.type === 'office' && collectionCooldown > 0 && (
                          <div style={{ fontSize: '0.8em', color: 'red' }}>
                            CD: {formatTime(collectionCooldown)}
                          </div>
                        )}
                      </>
                    ) : (
                      `F:${mapGrid.length - 1 - rowIndex} S:${colIndex}`
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App