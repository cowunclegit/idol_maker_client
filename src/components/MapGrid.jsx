import React from 'react';
import { ELEVATOR_BUILDABLE } from '../hooks/useGameData';

const MapGrid = ({ mapGrid, collectionCooldowns, constructionTimers, handleCollectResources, formatTime, buildingConfigs, onEmptyCellClick, minSlot }) => {
  return (
    <div style={{ display: 'grid', border: '1px solid black' }}>
      {mapGrid.slice().reverse().map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex' }}>
          {row.map((cell, colIndex) => {
            console.log(`MapGrid - Row: ${rowIndex}, Col: ${colIndex}, Cell:`, cell);
            // If the cell is null, or if it's a multi-slot building and this is not its starting slot,
            // then we don't render a new div for it. Instead, we let the starting slot's div span across.
            if (cell && colIndex > 0 && row[colIndex - 1] === cell) {
                return null; // This cell is part of a multi-slot building already rendered
            }

            const remainingConstructionTime = cell && constructionTimers[cell._id] || 0;

            let spanWidth = 1; // Default for empty cells
            if (cell && cell !== ELEVATOR_BUILDABLE) {
                const buildingConfig = buildingConfigs?.[cell.type];
                console.log(`  MapGrid - Building Config for ${cell.type}:`, buildingConfig);
                const requiredSlots = buildingConfig?.slot || 2; // Default to 2 if not specified
                console.log(`  MapGrid - Required Slots for ${cell.type}: ${requiredSlots}`);
                spanWidth = cell.mergedCount * requiredSlots;
            }

            const displayFloor = mapGrid.length - 1 - rowIndex;
            const displaySlot = colIndex + minSlot;

            const isElevatorBuildable = cell === ELEVATOR_BUILDABLE;

            console.log(`Rendering F:${displayFloor} S:${displaySlot} (colIndex: ${colIndex})`);
            if (cell && cell !== ELEVATOR_BUILDABLE) {
                console.log(`  Building: ${cell.type}, slots: ${cell.slots}, mergedCount: ${cell.mergedCount}`);
                const buildingConfig = buildingConfigs?.[cell.type];
                console.log(`  Building Config for ${cell.type}:`, buildingConfig);
                const requiredSlots = buildingConfig?.slot || 2;
                console.log(`  Required Slots: ${requiredSlots}`);
                spanWidth = cell.mergedCount * requiredSlots;
                console.log(`  Calculated spanWidth: ${spanWidth}`);
            } else if (isElevatorBuildable) {
                console.log(`  Cell is ELEVATOR_BUILDABLE`);
            } else {
                console.log(`  Cell is empty`);
            }

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={{
                  width: `${80 * spanWidth}px`, // Dynamic width based on occupied slots
                  height: '80px',
                  border: '1px solid #ccc',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '0.7em',
                  backgroundColor: isElevatorBuildable ? '#FFD700' : (cell ? '#e0ffe0' : '#ADD8E6'), // Gold for elevator buildable, light green for occupied, light blue for empty
                  color: 'black',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (cell && cell !== ELEVATOR_BUILDABLE) {
                    handleCollectResources(cell._id, cell.type, cell.level, collectionCooldowns);
                  } else {
                    onEmptyCellClick(displayFloor, displaySlot);
                  }
                }}
              >
                {cell && cell !== ELEVATOR_BUILDABLE ? (
                  <>
                    <div>{cell.type.replace(/_/g, ' ')}</div>
                    <div>Lvl: {cell.level}</div>
                    <div>F:{cell.floor} S:{cell.slots} M:{cell.mergedCount}</div>
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
                ) : isElevatorBuildable ? (
                  <>
                    <div>Elevator</div>
                    <div>Buildable</div>
                    <div>F:{displayFloor} S:{displaySlot}</div>
                  </>
                ) : (
                  `F:${displayFloor} S:${displaySlot}`
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MapGrid;
