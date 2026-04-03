import React, { useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AssetCataloguePage from './pages/AssetCataloguePage';
import BookingManagement from './pages/BookingManagement';
import PlaceholderPage from './pages/PlaceholderPage';
import { ensureMockUser } from './utils/mockAuth';

function App() {
  useEffect(() => {
    ensureMockUser();
  }, []);

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 min-w-0 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/assets" replace />} />
            <Route
              path="/dashboard"
              element={
                <PlaceholderPage
                  title="Dashboard"
                  description="The main dashboard shell is ready. This route is now wired through the sidebar so the layout behaves like a real multi-module app."
                />
              }
            />
            <Route path="/assets" element={<AssetCataloguePage />} />
            <Route path="/bookings" element={<BookingManagement />} />
            <Route
              path="/tickets"
              element={
                <PlaceholderPage
                  title="Incident Tickets"
                  description="Ticketing screens are not implemented yet, but the route and sidebar navigation are now live so the module can be added without reworking the app shell."
                />
              }
            />
            <Route
              path="/users"
              element={
                <PlaceholderPage
                  title="User Management"
                  description="User administration is still a placeholder. The route exists so the sidebar works end-to-end while the team completes the remaining modules."
                />
              }
            />
            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Settings"
                  description="Settings has a working route placeholder so the sidebar behaves consistently across the application."
                />
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
