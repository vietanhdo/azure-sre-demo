import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { HeinekenDashboard } from './pages/HeinekenDashboard';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/heineken" element={<HeinekenDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
