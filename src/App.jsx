import { Routes, Route } from 'react-router-dom';
import Navbar        from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home           from './pages/Home';
import Login          from './pages/Login';
import Register       from './pages/Register';
import HomeProfile    from './pages/HomeProfile';
import Interview      from './pages/Interview';
import Guidelines     from './pages/Guidelines';
import Setup          from './pages/Setup';
import InterviewStart from './pages/InterviewStart';
import Result         from './pages/Result';

function App() {
  return (
    <>
      {/* Navbar hides itself on auth pages and the interview room */}
      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/dashboard"      element={<ProtectedRoute><HomeProfile /></ProtectedRoute>} />
        <Route path="/interview"      element={<ProtectedRoute><Interview /></ProtectedRoute>} />
        <Route path="/guidelines"     element={<ProtectedRoute><Guidelines /></ProtectedRoute>} />
        <Route path="/setup"          element={<ProtectedRoute><Setup /></ProtectedRoute>} />
        <Route path="/interview-start"element={<ProtectedRoute><InterviewStart /></ProtectedRoute>} />
        <Route path="/result"         element={<ProtectedRoute><Result /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;
