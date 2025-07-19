import { useState, useEffect } from 'react';

const useMapGridLogic = (gameData, buildingActions, buildingDialogs) => {
  const { mapGrid, collectionCooldowns, constructionTimers, resources, minSlot } = gameData;
  const { handleCollectResources, formatTime } = buildingActions;
  const { onEmptyCellClick, handleBuildingClick: onBuildingClick } = buildingDialogs;

  return {
    mapGrid,
    collectionCooldowns,
    constructionTimers,
    handleCollectResources,
    formatTime,
    buildingConfigs: resources?.buildingConfigs,
    onEmptyCellClick,
    minSlot,
    onBuildingClick,
  };
};

export default useMapGridLogic;
