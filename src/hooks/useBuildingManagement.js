import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = '';

const useBuildingManagement = (auth, gameData) => {
  const { token, fetchProfile } = auth;
  const { resources, buildings, availableBuildingTypes, collectionCooldowns, constructionTimers, fetchResources, fetchBuildings, handleFinishConstruction, minSlot } = gameData;

  // From useBuildFormLogic - moved into dialogs
  // const [buildingType, setBuildingType] = useState('idol_house');
  // const [floor, setFloor] = useState(0);
  // const [slot, setSlot] = useState(0);

  // useEffect(() => {
  //   if (availableBuildingTypes.length > 0) {
  //     setBuildingType(availableBuildingTypes[0]);
  //   }
  // }, [availableBuildingTypes]);

  // const getBuildingCost = (type) => {
  //   if (!resources || !resources.buildingConfigs || !resources.buildingConfigs[type]) {
  //     return null;
  //   }
  //   return resources.buildingConfigs[type].levels[1].cost; // Cost for level 1
  // };

  // const selectedBuildingCost = getBuildingCost(buildingType);

  // From useBuildingActions
  const handleBuild = async (type, floor, slot) => {
    if (!token) {
      alert('Please log in first.');
      return;
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/game/build`,
        { type, floor: parseInt(floor), slot: parseInt(slot) },
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

  const handleCollectResources = async (buildingId, buildingType, buildingLevel, currentCollectionCooldowns) => {
    if (!token) {
      alert('Please log in first.');
      return;
    }

    const currentCooldown = currentCollectionCooldowns[buildingId] || 0;
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

  const handleDemolish = async (buildingId) => {
    if (window.confirm('Are you sure you want to demolish this building?')) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/game/demolish`,
          { buildingId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(response.data.message);
        fetchBuildings(token);
        fetchResources(token);
        handleCloseBuildingActionsDialog(); // Assuming this is defined in dialogs
      } catch (error) {
        console.error('Demolish Error:', error.response ? error.response.data : error);
        alert(`Demolish failed: ${error.response ? error.response.data.message : error.message}`);
      }
    }
  };

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes > 0 ? `${minutes}m ` : ''}${remainingSeconds}s`;
  };

  // From useBuildingDialogs
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [dialogFloor, setDialogFloor] = useState(0);
  const [dialogSlot, setDialogSlot] = useState(0);
  const [dialogBuildingType, setDialogBuildingType] = useState('idol_house'); // New state for dialog building type

  useEffect(() => {
    if (availableBuildingTypes.length > 0) {
      setDialogBuildingType(availableBuildingTypes[0]);
    }
  }, [availableBuildingTypes]);

  const getDialogBuildingCost = (type) => {
    if (!resources || !resources.buildingConfigs || !resources.buildingConfigs[type]) {
      return null;
    }
    return resources.buildingConfigs[type].levels[1].cost; // Cost for level 1
  };

  const selectedDialogBuildingCost = getDialogBuildingCost(dialogBuildingType);

  const [showBuildingActionsDialog, setShowBuildingActionsDialog] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const handleEmptyCellClick = (clickedFloor, clickedSlot) => {
    console.log(`useBuildingManagement: Setting dialogFloor to ${clickedFloor}, dialogSlot to ${clickedSlot}`);
    setDialogFloor(clickedFloor);
    setDialogSlot(clickedSlot);
    setShowBuildDialog(true);
  };

  const handleBuildingClick = (building) => {
    setSelectedBuilding(building);
    setShowBuildingActionsDialog(true);
  };

  const handleCloseBuildingActionsDialog = () => {
    setShowBuildingActionsDialog(false);
    setSelectedBuilding(null);
  };

  const handleBuildAndCloseDialog = async (type, floor, slot) => {
    await handleBuild(type, floor, slot);
    setShowBuildDialog(false);
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

  return {
    actions: {
      handleBuild,
      handleUpgrade,
      handleCollectResources,
      handleDemolish,
      formatTime,
      getUpgradeCost,
    },
    dialogs: {
      showBuildDialog,
      setShowBuildDialog,
      dialogFloor,
      setDialogFloor,
      dialogSlot,
      setDialogSlot,
      dialogBuildingType,
      setDialogBuildingType,
      getDialogBuildingCost,
      selectedDialogBuildingCost,
      showBuildingActionsDialog,
      setShowBuildingActionsDialog,
      selectedBuilding,
      setSelectedBuilding,
      handleEmptyCellClick,
      handleBuildingClick,
      handleCloseBuildingActionsDialog,
      handleBuildAndCloseDialog,
    },
  };
};

export default useBuildingManagement;
