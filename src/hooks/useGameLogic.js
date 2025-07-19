import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuth from './useAuth';
import useGameData from './useGameData';
import useBuildingManagement from './useBuildingManagement';

const useGameLogic = () => {
  const auth = useAuth();
  const gameData = useGameData(auth.token, auth.fetchProfile);
  const buildingManagement = useBuildingManagement(auth, gameData);

  return {
    auth,
    gameData,
    buildingManagement,
  };
}
export default useGameLogic;
