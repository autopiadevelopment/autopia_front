import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedLayout, PublicLayout } from './components/Layout'
import Cars from './pages/Cars'
import Home from './pages/Home'
import History from './pages/History'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Register from './pages/Register'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
      </Route>
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/coches" element={<Cars />} />
        <Route path="/historial" element={<History />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
