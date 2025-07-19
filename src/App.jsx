import { useState, useEffect } from 'react';
import useGameLogic from './hooks/useGameLogic';
import GoogleSignInButton from './components/GoogleSignInButton';
import GameDashboard from './components/GameDashboard';

const API_BASE_URL = '';

function App() {
  const gameLogic = useGameLogic();
  const { auth } = gameLogic;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Idol Maker Client</h1>
      <p>Status: {auth.message}</p>

      <GoogleSignInButton user={auth.user} />

      {auth.user ? (
        <GameDashboard
          gameLogic={gameLogic}
        />
      ) : (
        <p>Please log in to view game content.</p>
      )}
    </div>
  );
}

export default App;
