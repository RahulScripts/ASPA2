import { Box, Button, Spinner, Text, useToast } from '@chakra-ui/react'
import algosdk from 'algosdk'
import { useState } from 'react'

// 🔹 Algorand TestNet Configuration
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud'
const ALGOD_TOKEN = ''
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, '')

// 🔹 Test Account (⚠️ Use only for testing, not for mainnet)
const TEST_ACCOUNT_MNEMONIC =
  'lens divorce voice city model airport weasel mail subway thing gossip museum invest jewel wood wait prison sign boy soon gate wave twin above arena'

const account = algosdk.mnemonicToSecretKey(TEST_ACCOUNT_MNEMONIC)

// 🔹 Your Asset Details (Change if needed)
const ASSET_ID = 1233 // Replace with actual asset ID
const PRICE_PER_UNIT = 1 // Amount of asset to send

const ContractInteraction = () => {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  // 🔹 Check if Account is Opted-In
  const checkAssetOptIn = async () => {
    try {
      const accountInfo = await algodClient.accountInformation(account.addr).do()
      return accountInfo.assets.some((asset) => asset['asset-id'] === ASSET_ID)
    } catch (error) {
      console.error('Opt-In Check Error:', error)
      return false
    }
  }

  // 🔹 Opt-In to Asset
  const optInToAsset = async () => {
    setLoading(true)
    try {
      const params = await algodClient.getTransactionParams().do()
      const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: account.addr,
        to: account.addr, // Self Opt-In
        amount: 0,
        assetIndex: ASSET_ID,
        suggestedParams: params,
      })

      console.log('Unsigned Opt-In Transaction:', optInTxn)

      const signedTxn = optInTxn.signTxn(account.sk)
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do()
      await algodClient.pendingTransactionInformation(txId).do()

      toast({ title: 'Opt-In Successful!', status: 'success', duration: 2000 })
      console.log(`✅ Opt-In Transaction ID: ${txId}`)
    } catch (error) {
      console.error('Opt-In Error:', error)
      toast({ title: 'Opt-In Failed!', description: error.message, status: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  // 🔹 Send Asset Transaction
  const sendAssetTransaction = async () => {
    setLoading(true)
    try {
      const isOptedIn = await checkAssetOptIn()
      if (!isOptedIn) {
        toast({ title: 'Account Not Opted-In!', description: 'Please opt-in first.', status: 'warning', duration: 3000 })
        await optInToAsset()
        return
      }

      const params = await algodClient.getTransactionParams().do()
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: account.addr,
        to: account.addr, // Self-transfer for testing (Change if needed)
        amount: PRICE_PER_UNIT,
        assetIndex: ASSET_ID,
        suggestedParams: params,
      })

      console.log('Unsigned Transaction:', txn)

      const signedTxn = txn.signTxn(account.sk)
      const { txId } = await algodClient.sendRawTransaction(signedTxn).do()
      await algodClient.pendingTransactionInformation(txId).do()

      toast({ title: 'Transaction Sent!', status: 'success', duration: 2000 })
      console.log(`✅ Transaction ID: ${txId}`)
    } catch (error) {
      console.error('Transaction Error:', error)
      toast({ title: 'Transaction Failed!', description: error.message, status: 'error', duration: 4000 })
    }
    setLoading(false)
  }

  return (
    <Box p={6} textAlign="center">
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        🔹 Algorand TestNet - Asset Transfer
      </Text>

      <Button colorScheme="blue" onClick={optInToAsset} isLoading={loading} mb={3}>
        Opt-In to Asset
      </Button>

      <Button colorScheme="green" onClick={sendAssetTransaction} isLoading={loading}>
        Send Asset Transaction
      </Button>

      {loading && <Spinner mt={4} />}
    </Box>
  )
}

export default ContractInteraction
