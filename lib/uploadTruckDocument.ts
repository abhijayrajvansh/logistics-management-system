import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export async function uploadTruckDocument(
  file: File,
  truckId: string,
  documentType: string,
): Promise<string> {
  if (!file) return '';

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 5MB limit for ${documentType}`);
  }

  // Create a reference to the file in Firebase Storage
  const fileExtension = file.name.split('.').pop();
  const fileName = `${truckId}_${documentType}.${fileExtension}`;
  const storageRef = ref(storage, `trucks/${truckId}/documents/${fileName}`);

  try {
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error(`Failed to upload ${documentType}`);
  }
}
