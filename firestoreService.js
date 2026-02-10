// firestoreService.js - Service layer for Firestore operations
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp,
  doc,
  setDoc 
} from 'firebase/firestore';
import { db, auth } from './firebase';

class FirestoreService {
  // Save a session to Firestore
  async saveSession(session) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const sessionData = {
        userId,
        date: Timestamp.fromDate(new Date(session.date)),
        duration: session.duration,
        energyLevel: session.energyLevel,
        timeOfDay: session.timeOfDay,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(
        collection(db, 'sessions'),
        sessionData
      );

      return docRef.id;
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  // Get all sessions for current user
  async getUserSessions(startDate = null, endDate = null) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      let q = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      // Add date range filters if provided
      if (startDate) {
        q = query(q, where('date', '>=', Timestamp.fromDate(startDate)));
      }
      if (endDate) {
        q = query(q, where('date', '<=', Timestamp.fromDate(endDate)));
      }

      const querySnapshot = await getDocs(q);
      const sessions = [];

      querySnapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate() // Convert Timestamp to Date
        });
      });

      return sessions;
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw error;
    }
  }

  // Save user settings
  async saveSettings(settings) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      await setDoc(
        doc(db, 'users', userId),
        {
          settings: settings,
          updatedAt: Timestamp.now()
        },
        { merge: true } // Merge with existing data
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Get user settings
  async getSettings() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data().settings || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  // Sync local storage to Firestore
  async syncLocalToCloud() {
    try {
      // Get local sessions
      const localSessions = JSON.parse(
        localStorage.getItem('ultradianSessions') || '[]'
      );

      // Upload each to Firestore
      for (const session of localSessions) {
        await this.saveSession(session);
      }

      // Get local settings
      const localSettings = JSON.parse(
        localStorage.getItem('ultradianSettings') || '{}'
      );

      if (Object.keys(localSettings).length > 0) {
        await this.saveSettings(localSettings);
      }

      return true;
    } catch (error) {
      console.error('Error syncing to cloud:', error);
      throw error;
    }
  }

  // Download cloud data to local storage
  async syncCloudToLocal() {
    try {
      // Get cloud sessions
      const cloudSessions = await this.getUserSessions();
      
      // Save to localStorage
      localStorage.setItem(
        'ultradianSessions',
        JSON.stringify(cloudSessions)
      );

      // Get cloud settings
      const cloudSettings = await this.getSettings();
      
      if (cloudSettings) {
        localStorage.setItem(
          'ultradianSettings',
          JSON.stringify(cloudSettings)
        );
      }

      return true;
    } catch (error) {
      console.error('Error syncing from cloud:', error);
      throw error;
    }
  }
}

export default new FirestoreService();
