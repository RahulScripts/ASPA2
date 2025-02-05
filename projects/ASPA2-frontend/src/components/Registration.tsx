import { useWallet } from '@txnlab/use-wallet'
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom' // Import navigation
import { db } from '../firebaseConfig'
import ConnectWallet from './ConnectWallet' // Import the wallet modal

const Registration: React.FC = () => {
  const { activeAddress } = useWallet()
  const navigate = useNavigate() // Initialize navigation
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openModal, setOpenModal] = useState(false) // Modal state

  // Auto-fill wallet address when wallet is connected
  useEffect(() => {
    if (activeAddress) {
      setWalletAddress(activeAddress)
    }
  }, [activeAddress])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name || !email || !walletAddress) {
      setError('All fields are required!')
      return
    }

    try {
      // Check if email or wallet address already exists
      const usersRef = collection(db, 'users')
      const emailSnapshot = await getDocs(query(usersRef, where('email', '==', email)))
      const walletSnapshot = await getDocs(query(usersRef, where('walletAddress', '==', walletAddress)))

      if (!emailSnapshot.empty) {
        setError('Email is already registered!')
        return
      }

      if (!walletSnapshot.empty) {
        setError('Wallet address is already registered!')
        return
      }

      // Store user details in Firestore
      await addDoc(usersRef, {
        name,
        email,
        walletAddress,
        createdAt: new Date(),
      })

      setSuccess('User registered successfully!')
      setName('')
      setEmail('')
      setWalletAddress(activeAddress || '')
    } catch (error: any) {
      console.error('Error saving user:', error)
      setError('Failed to register user. Try again.')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
        {/* Logo Section */}
        <div className="flex justify-center mb-4">
          <img src="./src/assets/ASPA.png" alt="Logo" className="w-60 h-20" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-4">User Registration</h1>

        {error && <p className="text-red-500 text-center">{error}</p>}
        {success && <p className="text-green-500 text-center">{success}</p>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block font-medium">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input input-bordered w-full" required />
          </div>

          <div>
            <label className="block font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input input-bordered w-full" required />
          </div>

          <div>
            <label className="block font-medium">Wallet Address</label>
            <input
              type="text"
              value={walletAddress}
              readOnly
              className="input input-bordered w-full cursor-pointer"
              placeholder="Connect wallet"
              onClick={() => setOpenModal(true)} // Open modal on click
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Register
          </button>
        </form>

        {/* Login Link */}
        <p
          onClick={() => navigate('/login')} // Navigate to login page
          className="text-black-500 text-center mt-2 cursor-pointer"
        >
          Already have an account? Login
        </p>

        {/* Wallet Connection Modal */}
        {openModal && <ConnectWallet openModal={openModal} closeModal={() => setOpenModal(false)} setWalletAddress={setWalletAddress} />}
      </div>
    </div>
  )
}

export default Registration
