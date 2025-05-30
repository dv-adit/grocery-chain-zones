import React from 'react';
import './App.css';
import FloorPlan from './components/FloorPlan';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Interactive Grocery Store Experience</h1>
        <p>Move your cursor to simulate walking through the store. Click anywhere to sign up.</p>
      </header>
      <main>
        <FloorPlan />
      </main>
      <footer>
        <p>Events tracked: Sign Up, Walk In, Walk Out, Dwell Threshold, Zone Walk In, Zone Walk Out, Zone Dwell Threshold</p>
      </footer>
    </div>
  );
}

export default App;
