import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { HeinekenDashboard } from './pages/HeinekenDashboard';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', gap: '10px' }}>
        <Link to="/" style={{ padding: '8px 16px', background: '#333', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
          Azure SRE
        </Link>
        <Link to="/brewery/heineken" style={{ padding: '8px 16px', background: '#008200', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
          Heineken SRE
        </Link>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/brewery/heineken" element={<HeinekenDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
