import React from 'react';

const MapGrid = ({ mapGrid, collectionCooldowns, constructionTimers, handleCollectResources, formatTime }) => {
  return (
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
                onClick={() => cell && handleCollectResources(cell._id, cell.type, cell.level, collectionCooldowns)}
              >
                {cell ? (
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
                ) : (
                  `F:${mapGrid.length - 1 - rowIndex} S:${colIndex}`
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
