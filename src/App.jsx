import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'

// Public pages
import Navbar from './components/Navbar'
import Feed from './components/Feed'
import Places from './components/Places'
import PlaceProfile from './components/PlaceProfile'
import Compare from './components/Compare'
import AskBot from './components/AskBot'
import Login from './components/Login'

// Admin pages
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminPlaces from './components/admin/AdminPlaces'
import AdminArticles from './components/admin/AdminArticles'
import AdminScores from './components/admin/AdminScores'
import BotInquiries from './components/admin/BotInquiries'
import AdminUsers from './components/admin/AdminUsers'

function PublicLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e8e8e8' }}>
      <Navbar />
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Feed />} />
            <Route path="/places" element={<Places />} />
            <Route path="/places/:slug" element={<PlaceProfile />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/ask" element={<AskBot />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Admin routes — editor+ only, own full-screen layout */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="editor">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="places" element={<AdminPlaces />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="scores" element={<AdminScores />} />
            <Route path="bot-logs" element={<BotInquiries />} />
            <Route path="users" element={
              <ProtectedRoute requiredRole="admin">
                <AdminUsers />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
