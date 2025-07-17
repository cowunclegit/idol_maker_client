import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [message, setMessage] = useState('Loading...')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('jwtToken'))
  const [resources, setResources] = useState(null)
  const [buildingType, setBuildingType] = useState('idol_house')
  const [floor, setFloor] = useState(0)
  const [slot, setSlot] = useState(0)

  const API_BASE_URL = 'http://localhost:3000' // Proxy handles /api and /auth

  // Google Identity Services 초기화
  useEffect(() => {
    // Google 클라이언트 ID를 여기에 입력하세요.
    const GOOGLE_CLIENT_ID = '380605341489-epoje0nmii5ke6jlh3qrbu5s6os9rj7e.apps.googleusercontent.com'; 

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse, // 로그인 성공 시 호출될 함수
      });
      // Google 로그인 버튼 렌더링
      window.google.accounts.id.renderButton(
        document.getElementById('google-sign-in-button'),
        { theme: 'outline', size: 'large' } // 버튼 스타일
      );
      // 원탭 프롬프트 표시 (선택 사항)
      // window.google.accounts.id.prompt(); 
    }
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    // 여기서 response.credential이 Google ID 토큰입니다.
    const id_token = response.credential;
    console.log("Google ID Token:", id_token);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/google`, {
        id_token: id_token,
      });
      setToken(res.data.token);
      localStorage.setItem('jwtToken', res.data.token);
      fetchProfile();
      fetchResources();
    } catch (error) {
      console.error('Google Auth Error:', error.response ? error.response.data : error);
      setMessage('Google Auth Failed');
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile()
      fetchResources()
    }
  }, [token])

  const fetchProfile = async () => {
    console.log('### Fetching profile with token:', token);
    if (!token) {
      console.warn('No token found, cannot fetch profile');
      setMessage('No Token found')
      return
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUser(response.data.user)
      setMessage(response.data.message)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage('Failed to fetch profile')
      setUser(null)
      setToken(null) // Clear token if invalid
      localStorage.removeItem('jwtToken')
    }
  }

  const fetchResources = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/game/resources`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setResources(response.data)
    } catch (error) {
      console.error('Error fetching resources:', error)
      setResources(null)
    }
  }

  const handleBuild = async () => {
    if (!token) {
      alert('Please log in first.')
      return
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/game/build`,
        { type: buildingType, floor: parseInt(floor), slot: parseInt(slot) },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert(response.data.message)
      fetchResources() // Refresh resources after building
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
      const response = await axios.post(
        `${API_BASE_URL}/api/game/upgrade`,
        { buildingId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert(response.data.message)
      fetchResources() // Refresh resources after upgrade
    } catch (error) {
      console.error('Upgrade Error:', error.response ? error.response.data : error)
      alert(`Upgrade failed: ${error.response ? error.response.data.message : error.message}`)
    }
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setResources(null)
    localStorage.removeItem('jwtToken')
    setMessage('Logged out')
  }

  console.log(token);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Idol Maker Client</h1>
      <p>Status: {message}</p>

      {!user ? (
        <div>
          <h2>Authentication</h2>
          {/* Google 로그인 버튼이 렌더링될 div */}
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

          <h3>Build Building</h3>
          <div>
            <label>
              Type:
              <select value={buildingType} onChange={(e) => setBuildingType(e.target.value)}>
                <option value="idol_house">Idol House</option>
                <option value="training_center">Training Center</option>
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

          <h3>Your Buildings (for upgrade test)</h3>
          <p>You'll need to fetch your buildings from the server to get their IDs for upgrade.</p>
          <p>For now, manually enter a building ID to test upgrade:</p>
          <input type="text" placeholder="Enter Building ID for upgrade" id="upgradeBuildingId" />
          <button onClick={() => handleUpgrade(document.getElementById('upgradeBuildingId').value)}>Upgrade Building</button>
        </div>
      )}
    </div>
  )
}

export default App
