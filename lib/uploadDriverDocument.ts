import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/storage';

export async function uploadDriverDocument(
  file: File,
  driverId: string,
  documentType: string,
): Promise<string> {
  if (!file) return '';

  // Create a reference to the file in Firebase Storage
  const fileExtension = file.name.split('.').pop();
  const fileName = `${driverId}_${documentType}.${fileExtension}`;
  const storageRef = ref(storage, `drivers/${driverId}/documents/${fileName}`);

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
