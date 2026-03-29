import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import BookingManagement from './pages/BookingManagement'

function App() {
  const [activeMenuItem, setActiveMenuItem] = useState('bookings')

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar activeItem={activeMenuItem} setActiveItem={setActiveMenuItem} />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<BookingManagement />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
