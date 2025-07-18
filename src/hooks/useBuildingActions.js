import axios from 'axios';

const API_BASE_URL = '';

const useBuildingActions = (token, fetchResources, fetchBuildings) => {
  const handleBuild = async (buildingType, floor, slot) => {
    if (!token) {
      alert('Please log in first.');
      return;
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/game/build`,
        { type: buildingType, floor: parseInt(floor), slot: parseInt(slot) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      fetchResources(token);
      fetchBuildings(token);
    } catch (error) {
      console.error('Build Error:', error.response ? error.response.data : error);
      alert(`Build failed: ${error.response ? error.response.data.message : error.message}`);
    }
  };

  const handleUpgrade = async (buildingId) => {
    if (!token) {
      alert('Please log in first.');
      return;
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/game/upgrade`,
        { buildingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      fetchResources(token);
      fetchBuildings(token);
    } catch (error) {
      console.error('Upgrade Error:', error.response ? error.response.data : error);
      alert(`Upgrade failed: ${error.response ? error.response.data.message : error.message}`);
    }
  };

  const handleCollectResources = async (buildingId, buildingType, buildingLevel, collectionCooldowns) => {
    if (!token) {
      alert('Please log in first.');
      return;
    }

    const currentCooldown = collectionCooldowns[buildingId] || 0;
    if (currentCooldown > 0) {
      alert(`Collection for ${buildingType} is on cooldown. Please wait ${formatTime(currentCooldown)}.`);
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/game/collect_resources`,
        { buildingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      fetchResources(token);
    } catch (error) {
      console.error('Collect Resources Error:', error.response ? error.response.data : error);
      alert(`Collect failed: ${error.response ? error.response.data.message : error.message}`);
    }
  };

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes > 0 ? `${minutes}m ` : ''}${remainingSeconds}s`;
  };

  return { handleBuild, handleUpgrade, handleCollectResources, formatTime };
};

export default useBuildingActions;
