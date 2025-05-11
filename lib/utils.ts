import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/database';
import { Order } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}