import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedLayout, PublicLayout } from './components/Layout'
import Access from './pages/Access'
import Cars from './pages/Cars'
import Home from './pages/Home'
import History from './pages/History'
import Profile from './pages/Profile'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Access />} />
        <Route path="/registro" element={<Navigate to="/login" replace />} />
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
