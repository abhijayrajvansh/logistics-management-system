import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export async function uploadTyrePhoto(
  file: File,
  tyreId: string,
  photoType: string,
): Promise<string> {
  if (!file) return '';

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 5MB limit for ${photoType}`);
  }

  // Create a reference to the file in Firebase Storage
  const fileExtension = file.name.split('.').pop();
  const fileName = `${tyreId}_${photoType}_${Date.now()}.${fileExtension}`;
  const storageRef = ref(storage, `tyres/${tyreId}/photos/${fileName}`);

  try {
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading tyre photo:', error);
    throw new Error(`Failed to upload ${photoType}`);
  }
}
