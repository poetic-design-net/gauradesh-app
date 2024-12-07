import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { ADMIN_COLLECTION } from '../lib/firebase-admin';

async function fixAdminPermissions() {
  try {
    console.log('Starting admin permissions fix...');
    
    // Get all temples
    const templesSnapshot = await getDocs(collection(db, 'temples'));
    
    for (const templeDoc of templesSnapshot.docs) {
      const templeId = templeDoc.id;
      console.log(`Processing temple: ${templeId}`);
      
      // Get all admins for this temple
      const adminsSnapshot = await getDocs(
        collection(db, 'temples', templeId, 'temple_admins')
      );
      
      for (const adminDoc of adminsSnapshot.docs) {
        const adminData = adminDoc.data();
        const userId = adminData.userId;
        
        // Check if admin document exists in the admin collection
        const adminRef = doc(db, ADMIN_COLLECTION, userId);
        const existingAdminDoc = await getDoc(adminRef);
        
        if (!existingAdminDoc.exists()) {
          console.log(`Creating admin document for user ${userId} in temple ${templeId}`);
          
          // Create the admin document
          await setDoc(adminRef, {
            uid: userId,
            isAdmin: true,
            isSuperAdmin: false,
            templeId: templeId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          
          console.log(`Created admin document for user ${userId}`);
        } else {
          console.log(`Updating admin document for user ${userId}`);
          
          // Update the existing document
          await setDoc(adminRef, {
            isAdmin: true,
            templeId: templeId,
            updatedAt: serverTimestamp(),
          }, { merge: true });
          
          console.log(`Updated admin document for user ${userId}`);
        }
      }
    }
    
    console.log('Admin permissions fix completed successfully');
  } catch (error) {
    console.error('Error fixing admin permissions:', error);
  }
}

// Run the fix
fixAdminPermissions().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
