import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { ListDetail } from './pages/ListDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { JoinList } from './pages/JoinList';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/list/:id" element={<ListDetail />} />
          <Route path="/join/:code" element={<JoinList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
