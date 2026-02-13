import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import UploadPage from './pages/UploadPage'
import GalleryPage from './pages/GalleryPage'
import PreviewPage from './pages/PreviewPage'
import AdminPage from './pages/AdminPage'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'

function App() {
    return (
        <AuthProvider>
            <Header />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/create" element={<UploadPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/preview/:id" element={<PreviewPage />} />
                <Route path="/admin" element={
                    <RequireAuth adminOnly={true}>
                        <AdminPage />
                    </RequireAuth>
                } />
            </Routes>
        </AuthProvider>
    )
}

export default App
