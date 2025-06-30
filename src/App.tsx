import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import GameLobby from './pages/GameLobby';
import SpaceBattle from './games/SpaceBattle';
import MazeRunner from './games/MazeRunner';
import PixelPlatformer from './games/PixelPlatformer';
import PuzzleMaster from './games/PuzzleMaster';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster position="top-center" />
      <Navbar />
      <Routes>
        {/* Regular routes with container */}
        <Route path="/" element={
          <main className="container mx-auto px-4 py-8">
            <Home />
          </main>
        } />
        <Route path="/login" element={
          <main className="container mx-auto px-4 py-8">
            <Login />
          </main>
        } />
        <Route path="/register" element={
          <main className="container mx-auto px-4 py-8">
            <Register />
          </main>
        } />
        <Route path="/profile" element={
          <main className="container mx-auto px-4 py-8">
            <Profile />
          </main>
        } />
        <Route path="/game-lobby" element={
          <main className="container mx-auto px-4 py-8">
            <GameLobby />
          </main>
        } />
        
        {/* Game routes without container constraints */}
        <Route path="/games/space-battle" element={<SpaceBattle />} />
        <Route path="/games/maze-runner" element={<MazeRunner />} />
        <Route path="/games/pixel-platformer" element={<PixelPlatformer />} />
        <Route path="/games/puzzle-master" element={<PuzzleMaster />} />
      </Routes>
    </div>
  );
}

export default App;