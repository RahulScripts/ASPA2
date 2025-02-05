import React from 'react'
import Login from './components/Registration'

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-teal-400">
      <Login /> {/* Render the Login component here */}
    </div>
  )
}

export default Home
