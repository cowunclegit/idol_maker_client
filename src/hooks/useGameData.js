import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = '';
const MAX_SLOT = 20;
export const ELEVATOR_BUILDABLE = 'ELEVATOR_BUILDABLE'; // New constant and export

const useGameData = (token, fetchProfile) => {
  const [resources, setResources] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [availableBuildingTypes, setAvailableBuildingTypes] = useState([]);
  const [mapGrid, setMapGrid] = useState([]);
  const [minSlot, setMinSlot] = useState(0); // Add minSlot state
  const [collectionCooldowns, setCollectionCooldowns] = useState({});
  const [constructionTimers, setConstructionTimers] = useState({});
  const masterIntervalRef = useRef(null);

  useEffect(() => {
    if (token) {
      fetchResources(token);
      fetchBuildings(token);
      fetchAvailableBuildingTypes(token);
    }
  }, [token]);

  useEffect(() => {
    if (masterIntervalRef.current) {
      clearInterval(masterIntervalRef.current);
    }

    masterIntervalRef.current = setInterval(() => {
      setCollectionCooldowns(prevCooldowns => {
        const updatedCooldowns = { ...prevCooldowns };
        let changed = false;
        if (resources && resources.lastCollected && resources.buildingConfigs) {
          buildings.forEach(building => {
            const lastCollectedTime = resources.lastCollected[building._id] ? new Date(resources.lastCollected[building._id]).getTime() : 0;
            const config = resources.buildingConfigs[building.type];
            const collectionInterval = config?.levels[building.level]?.collectionInterval;

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

            if (remainingTime <= 0 && building.isConstructing) {
              handleFinishConstruction(building._id);
            }
          }
        });
        return changed ? updatedTimers : prevTimers;
      });
    }, 1000);

    return () => {
      clearInterval(masterIntervalRef.current);
    };
  }, [resources, buildings, token]);

  const fetchResources = async (currentToken) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/game/resources`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources(null);
    }
  };

  const fetchBuildings = async (currentToken) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/game/buildings`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setBuildings(response.data.buildings);
      generateMapGrid(response.data.buildings, resources?.buildingConfigs); // Pass buildingConfigs from resources state
    } catch (error) {
      console.error('Error fetching buildings:', error);
      setBuildings([]);
      setMapGrid([]);
    }
  };

  const fetchAvailableBuildingTypes = async (currentToken) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/game/config`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setAvailableBuildingTypes(Object.keys(response.data));
    } catch (error) {
      console.error('Error fetching available building types:', error);
      setAvailableBuildingTypes([]);
    }
  };

  const generateMapGrid = (currentBuildings, buildingConfigs) => {
    console.log("DEBUG: buildingConfigs received in generateMapGrid:", buildingConfigs);
    if (currentBuildings.length === 0) {
      setMapGrid([]);
      return;
    }

    const maxFloor = Math.max(...currentBuildings.map(b => b.floor));
    let allOccupiedSlots = [];
    currentBuildings.forEach(b => {
      const buildingConfig = buildingConfigs?.[b.type];
      const requiredSlots = buildingConfig?.slot || 2;
      const occupiedSlots = Array.from({ length: b.mergedCount * requiredSlots }, (_, i) => b.slots + i);
      allOccupiedSlots = allOccupiedSlots.concat(occupiedSlots);
    });

    const minSlot = 0; // Always start from slot 0 for display purposes
    setMinSlot(minSlot); 

    let currentMaxSlot = 0;
    currentBuildings.forEach(b => {
      const buildingConfig = buildingConfigs?.[b.type];
      const requiredSlots = buildingConfig?.slot || 2;
      const buildingEndSlot = b.slots + (b.mergedCount * requiredSlots) - 1;
      if (buildingEndSlot > currentMaxSlot) {
        currentMaxSlot = buildingEndSlot;
      }
    });
    const maxSlot = Math.max(currentMaxSlot, MAX_SLOT); // Ensure at least MAX_SLOT width

    const gridWidth = maxSlot - minSlot + 1;
    const gridHeight = maxFloor + 2; // Extend grid height to allow for building above maxFloor

    const newGrid = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(null));

    console.log("--- generateMapGrid: Processing Buildings ---");
    currentBuildings.forEach(building => {
      console.log(`  Processing Building: ID=${building._id}, Type=${building.type}, Floor=${building.floor}, Slots=${building.slots}, MergedCount=${building.mergedCount}`);
      const buildingConfig = buildingConfigs?.[building.type];
      const requiredSlots = buildingConfig?.slot || 2; // Default to 2 if not specified
      console.log(`    Configured Slot for ${building.type}: ${buildingConfig?.slot}, Calculated Required Slots: ${requiredSlots}`);
      console.log(`    DEBUG: building.mergedCount = ${building.mergedCount}, requiredSlots = ${requiredSlots}`);
      const occupiedSlots = Array.from({ length: building.mergedCount * requiredSlots }, (_, i) => building.slots + i);
      console.log(`    Occupied Slots array:`, occupiedSlots);

      occupiedSlots.forEach(s => {
        const normalizedSlot = s - minSlot;
        console.log(`      Populating newGrid[${building.floor}][${normalizedSlot}] with building ID: ${building._id}`);
        if (newGrid[building.floor] && newGrid[building.floor][normalizedSlot] === null) {
          newGrid[building.floor][normalizedSlot] = building;
        }
      });
    });

    // Mark elevator buildable slots
    for (let f = 0; f < gridHeight; f++) { // Loop up to gridHeight
      for (let s = 0; s < gridWidth; s++) {
        const currentCell = newGrid[f][s];
        if (currentCell && currentCell.type === 'elevator') {
          const nextFloor = f + 1;
          if (nextFloor < gridHeight && newGrid[nextFloor][s] === null) {
            newGrid[nextFloor][s] = ELEVATOR_BUILDABLE;
          }
        }
      }
    }

    console.log("Final newGrid before setting mapGrid:", newGrid);
    setMapGrid(newGrid);
  };

  const handleFinishConstruction = async (buildingId) => {
    if (!token) {
      console.error('Cannot finish construction: No token available.');
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/api/game/finish_construction`,
        { buildingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBuildings(token);
    } catch (error) {
      console.error('Error finishing construction:', error.response ? error.response.data : error);
    }
  };

  return {
    resources,
    buildings,
    availableBuildingTypes,
    mapGrid,
    collectionCooldowns,
    constructionTimers,
    fetchResources,
    fetchBuildings,
    fetchAvailableBuildingTypes,
    handleFinishConstruction,
    minSlot,
  };
};

export default useGameData;
