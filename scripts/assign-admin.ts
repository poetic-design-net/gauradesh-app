const { db } = require('../lib/firebase');
const { doc, setDoc, serverTimestamp } = require('firebase/firestore');
const { ADMIN_COLLECTION } = require('../lib/firebase-admin');

const USER_ID = 'LrWrfpn8VOhjhsKDiQpGFnyJuFa2';

async function assignAdmin() {
  try {
    console.log('Starting admin assignment...');
    
    const adminRef = doc(db, ADMIN_COLLECTION, USER_ID);
    
    await setDoc(adminRef, {
      uid: USER_ID,
      isAdmin: true,
      isSuperAdmin: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('Successfully assigned super admin permissions');
  } catch (error) {
    console.error('Error assigning admin:', error);
  }
}

assignAdmin().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
