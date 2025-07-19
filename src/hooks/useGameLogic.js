import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuth from './useAuth';
import useGameData from './useGameData';
import useBuildingManagement from './useBuildingManagement';
import useMapGridLogic from './useMapGridLogic';

const useGameLogic = () => {
  const auth = useAuth();
  const gameData = useGameData(auth.token, auth.fetchProfile);
  const buildingManagement = useBuildingManagement(auth, gameData);
  const mapGrid = useMapGridLogic(gameData, buildingManagement.actions, buildingManagement.dialogs);

  return {
    auth,
    gameData,
    buildingManagement,
    mapGrid,
  };
}
export default useGameLogic;
