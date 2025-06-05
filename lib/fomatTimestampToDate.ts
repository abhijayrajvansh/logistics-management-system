import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export const formatFirestoreDate = (date: Timestamp | null | undefined) => {
  if (!date) return '';

  // If it's a Firestore Timestamp, it will have seconds and nanoseconds
  if (typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
    return format(new Date(date.seconds * 1000), 'PPP');
  }
  // Fallback in case it's already a Date or string
  return format(new Date(date), 'PPP');
};
