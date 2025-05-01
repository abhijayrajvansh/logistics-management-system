// import env from '@/constants';
// import axios from 'axios';

// export interface Notification {
//   id: string;
//   title: string;
//   description: string;
//   action: string | null;
//   is_read: boolean;
//   userId: string;
//   createdAt: string;
// }

// export interface NotificationResponse {
//   total: number;
//   documents: Notification[];
// }

// export const getNotifications = async (userId: string): Promise<NotificationResponse> => {
//   const response = await axios.post(env.SERVER_URL + '/api/notify', {
//     userId,
//   });

//   return response.data;
// };

// export const readNotification = async (notificationID: string): Promise<boolean> => {
//   const response = await axios.post(env.SERVER_URL + '/api/notify/read', {
//     notificationID,
//   });

//   return response.data.success;
// }
