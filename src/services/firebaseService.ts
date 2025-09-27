import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import firebaseConfig from '../config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// User interface for our application
export interface AppUser {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  occupation?: string;
  company?: string;
  website?: string;
  bio?: string;
  interests?: string;
  newsletter?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication Functions
export const authService = {
  auth, // Export auth instance for use in AuthContext
  
  // Sign up with email and password
  async signUp(email: string, password: string, userData: Partial<AppUser>): Promise<AppUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      const appUser: AppUser = {
        uid: user.uid,
        email: user.email || email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        dateOfBirth: userData.dateOfBirth || '',
        gender: userData.gender || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        zipCode: userData.zipCode || '',
        country: userData.country || '',
        occupation: userData.occupation || '',
        company: userData.company || '',
        website: userData.website || '',
        bio: userData.bio || '',
        interests: userData.interests || '',
        newsletter: userData.newsletter || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), appUser);
      return appUser;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AppUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as AppUser;
      } else {
        // If user document doesn't exist, create a basic one
        const appUser: AppUser = {
          uid: user.uid,
          email: user.email || email,
          firstName: '',
          lastName: '',
          phoneNumber: '',
          dateOfBirth: '',
          gender: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          occupation: '',
          company: '',
          website: '',
          bio: '',
          interests: '',
          newsletter: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'users', user.uid), appUser);
        return appUser;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<AppUser> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as AppUser;
      } else {
        // Create new user document for Google sign-in
        const appUser: AppUser = {
          uid: user.uid,
          email: user.email || '',
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          phoneNumber: user.phoneNumber || '',
          dateOfBirth: '',
          gender: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
          occupation: '',
          company: '',
          website: '',
          bio: '',
          interests: '',
          newsletter: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'users', user.uid), appUser);
        return appUser;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  // Update user data
  async updateUserData(uid: string, userData: Partial<AppUser>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...userData,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Get user data by UID
  async getUserData(uid: string): Promise<AppUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as AppUser;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
};

// Firestore Functions
export const firestoreService = {
  // Add a new document
  async addDocument(collectionName: string, data: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Get a document
  async getDocument(collectionName: string, docId: string): Promise<any> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
};
