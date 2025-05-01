// import { useState } from 'react';
// import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
// // import { getFirebaseAuth } from '@/firebase/firebase.config'; // Assuming you have Firebase setup
// import env from '@/constants';

// interface UseAuthReturn {
//   login: {
//     mutate: (data: { email: string; password: string }) => Promise<void>;
//     isPending: boolean;
//     error: Error | null;
//   };
//   googleAuth: {
//     mutate: () => Promise<void>;
//     isPending: boolean;
//     error: Error | null;
//   };
// }

// export function useAuth(): UseAuthReturn {
//   const [isLoginPending, setIsLoginPending] = useState(false);
//   const [loginError, setLoginError] = useState<Error | null>(null);
  
//   const [isGooglePending, setIsGooglePending] = useState(false);
//   const [googleError, setGoogleError] = useState<Error | null>(null);

//   const handleEmailLogin = async (data: { email: string; password: string }) => {
//     try {
//       setIsLoginPending(true);
//       setLoginError(null);

//       // const auth = getFirebaseAuth();
      
//       const response = await signInWithEmailAndPassword(
//         auth,
//         data.email,
//         data.password
//       );

//       // Handle successful login
//       if (response.user) {
//         // You can add additional logic here, like storing tokens or redirecting
//         console.log('Login successful:', response.user);
//       }
//     } catch (error) {
//       setLoginError(error as Error);
//       throw error;
//     } finally {
//       setIsLoginPending(false);
//     }
//   };

//   const handleGoogleLogin = async () => {
//     try {
//       setIsGooglePending(true);
//       setGoogleError(null);

//       // const auth = getFirebaseAuth();
      
//       const provider = new GoogleAuthProvider();
//       // const response = await signInWithPopup(auth, provider);

//       // Handle successful Google login
//       // if (response.user) {
//         // You can add additional logic here, like storing tokens or redirecting
//         // console.log('Google login successful:', response.user);
//       }
//     } catch (error) {
//       setGoogleError(error as Error);
//       throw error;
//     } finally {
//       setIsGooglePending(false);
//     }
//   };

//   return {
//     login: {
//       mutate: handleEmailLogin,
//       isPending: isLoginPending,
//       error: loginError,
//     },
//     googleAuth: {
//       mutate: handleGoogleLogin,
//       isPending: isGooglePending,
//       error: googleError,
//     },
//   };
// }