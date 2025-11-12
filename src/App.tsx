import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ListDetail } from './pages/ListDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/list/:id" element={<ListDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
