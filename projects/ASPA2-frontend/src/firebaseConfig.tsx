import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDfgpdo_Qhf-NnqpvwAcxS8u7WRjCT9X9s',
  authDomain: 'aspa-2e863.firebaseapp.com',
  projectId: 'aspa-2e863',
  storageBucket: 'aspa-2e863.appspot.com', // ✅ Fixed storage bucket
  messagingSenderId: '49236490563',
  appId: '1:49236490563:web:9be7366fbcb4092d1b17f6',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }
