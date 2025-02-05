import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react'
import { useWallet } from '@txnlab/use-wallet'
import { addDoc, collection } from 'firebase/firestore'
import { useState } from 'react'
import { db } from '../firebaseConfig'

const Dashboard = () => {
  const { activeAddress } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name || !price || !activeAddress) {
      alert('All fields are required!')
      return
    }
    setLoading(true)
    try {
      const docRef = await addDoc(collection(db, 'assets'), {
        name,
        price: Number(price),
        owner: activeAddress,
        createdAt: new Date(),
      })

      await executeOnChain(docRef.id, name, price, activeAddress)

      alert('Asset registered successfully!')
      setIsOpen(false)
      setName('')
      setPrice('')
    } catch (error) {
      console.error('Error adding asset:', error)
      alert('Failed to register asset. Try again.')
    }
    setLoading(false)
  }

  const executeOnChain = async (assetId, name, price, owner) => {
    try {
      console.log('Executing Algorand contract with:', { assetId, name, price, owner })
      // Call your Algorand smart contract here
    } catch (error) {
      console.error('Blockchain transaction failed:', error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Tokenization Dashboard</h1>
      <Tabs>
        <TabList>
          <Tab>Tokenize Crop</Tab>
          <Tab>Buy Crops</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Button onClick={() => setIsOpen(true)} colorScheme="blue">
              Tokenize Your Crop
            </Button>
          </TabPanel>
          <TabPanel>
            <p>Buy tokenized crops will be implemented here.</p>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tokenize Your Crop</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input placeholder="Crop Name" value={name} onChange={(e) => setName(e.target.value)} mb={3} />
            <Input placeholder="Price (INR)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={loading}>
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default Dashboard
