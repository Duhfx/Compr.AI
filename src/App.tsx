import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Home } from './pages/Home';
import { ListDetail } from './pages/ListDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { JoinList } from './pages/JoinList';
import { History } from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes - require authentication */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/list/:id"
              element={
                <ProtectedRoute>
                  <ListDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join/:code"
              element={
                <ProtectedRoute>
                  <JoinList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
