import { Box, Button, FormControl, FormLabel, Input, Text, useToast } from '@chakra-ui/react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useState } from 'react'
import { db } from '../firebaseConfig'

const Dashboard = () => {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const getNextDocId = async () => {
    const counterRef = doc(db, 'metadata', 'counter')
    const counterSnap = await getDoc(counterRef)
    let newId = 1

    if (counterSnap.exists()) {
      newId = counterSnap.data().count + 1
    }

    await setDoc(counterRef, { count: newId })
    return newId
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!name || !price) {
      toast({
        title: 'All fields are required!',
        status: 'error',
        position: 'top',
        duration: 3000,
      })
      return
    }

    setLoading(true)
    try {
      const numericId = await getNextDocId()

      await setDoc(doc(db, 'assets', numericId.toString()), {
        id: numericId,
        name,
        price: Number(price),
        createdAt: new Date(),
      })

      toast({
        title: 'Asset registered successfully!',
        status: 'success',
        position: 'top',
        duration: 3000,
      })
      setName('')
      setPrice('')
    } catch (error) {
      console.error('Error adding asset:', error)
      toast({
        title: 'Failed to register asset. Try again.',
        status: 'error',
        position: 'top',
        duration: 3000,
      })
    }
    setLoading(false)
  }

  return (
    <Box p={0} bg="black" minHeight="100vh" display="flex" flexDirection="column" alignItems="center">
      {/* Centered Logo */}
      <Box width="100%" height="50vh" display="flex" justifyContent="center" alignItems="center">
        <img src="./src/assets/ASPAW.png" alt="Platform_Image" objectFit="cover" />
      </Box>

      {/* Asset Registration Form */}
      <Box mt={6} p={6} bg="white" color="black" borderRadius="16px" boxShadow="2xl" height="250px" padding={20} width="400px">
        <Text fontWeight="semibold" color="gray.700" textAlign="center">
          Register Asset
        </Text>
        <form onSubmit={handleSubmit}>
          <FormControl mt={4} isRequired>
            <FormLabel>Asset Name</FormLabel>
            <Input
              placeholder="Enter Asset Name"
              value={name}
              margintop="10px"
              marginBottom="10px"
              onChange={(e) => setName(e.target.value)}
              bg="gray.100"
              _focus={{
                bg: 'white',
                borderColor: 'blue.500',
                boxShadow: 'outline',
              }}
            />
          </FormControl>
          <FormControl mt={4} isRequired>
            <FormLabel>Price (INR)</FormLabel>
            <Input
              type="number"
              placeholder="Enter Price"
              margintop="10px"
              marginBottom="10px"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              bg="gray.100"
              _focus={{
                bg: 'white',
                borderColor: 'blue.500',
                boxShadow: 'outline',
              }}
            />
          </FormControl>
          <Button
            mt={6}
            type="submit"
            padding={10}
            borderRadius="10px"
            color="white"
            background="black"
            margintop="10px"
            marginBottom="10px"
            isLoading={loading}
            colorScheme="blue"
            width="full"
            _hover={{
              bg: 'blue.600',
              transform: 'scale(1.05)',
              transition: '0.2s',
            }}
          >
            Submit
          </Button>
        </form>
      </Box>
    </Box>
  )
}

export default Dashboard
