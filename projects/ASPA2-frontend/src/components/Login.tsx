import { useWallet } from '@txnlab/use-wallet'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../firebaseConfig'
import ConnectWallet from './ConnectWallet' // Import the modal component

const Login: React.FC = () => {
  const { activeAddress } = useWallet()
  const [walletAddress, setWalletAddress] = useState('')
  const [error, setError] = useState('')
  const [openModal, setOpenModal] = useState(false) // Control modal state
  const navigate = useNavigate()

  useEffect(() => {
    if (activeAddress) {
      setWalletAddress(activeAddress)
      setOpenModal(false) // Close modal when wallet is connected
    }
  }, [activeAddress])

  const handleLogin = async () => {
    setError('')
    if (!walletAddress) {
      setError('Please connect your wallet!')
      return
    }

    try {
      const usersRef = collection(db, 'users')
      const walletQ = query(usersRef, where('walletAddress', '==', walletAddress))
      const walletSnapshot = await getDocs(walletQ)

      if (walletSnapshot.empty) {
        setError('Wallet address not registered!')
        return
      }

      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Try again.')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-4">
          <img src="./src/assets/ASPA.png" alt="Logo" className="w-60 h-20" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">User Login</h1>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <div>
          <label className="block font-medium">Wallet Address</label>
          <button
            onClick={() => setOpenModal(true)} // Open modal on click
            className="input input-bordered w-full cursor-pointer text-left"
          >
            {walletAddress || 'Click to connect wallet'}
          </button>
        </div>

        <button onClick={handleLogin} className="btn btn-primary w-full mt-4">
          Login
        </button>

        {error === 'Wallet address not registered!' && (
          <p className="text-center text-sm text-gray-600 mt-2">
            Don't have an account?{' '}
            <Link to="/" className="text-blue-500">
              Register here
            </Link>
          </p>
        )}
      </div>

      {/* Wallet Connection Modal */}
      <ConnectWallet openModal={openModal} closeModal={() => setOpenModal(false)} />
    </div>
  )
}

export default Login
