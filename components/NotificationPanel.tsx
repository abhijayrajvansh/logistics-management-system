// 'use client';

// import { useAuth } from '@/app/context/AuthContext';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { ScrollArea } from '@/components/ui/scroll-area';
// // import {
//   // getNotifications,
//   // readNotification,
//   // type Notification,
// // } from '@/services/notification.service';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { formatDistanceToNow } from 'date-fns';
// import { BellIcon } from 'lucide-react';
// import { useEffect, useState } from 'react';
// import { Card } from './ui/card';

// const NotificationPanel = () => {
//   const { user } = useAuth();
//   // const userId = user?.$id as string;
//   const queryClient = useQueryClient();

//   // jugaad, but db heavy
//   // change this update notification refetch logic, default: 60 for 60 seconds
//   const NOTIF_REFESH_INTERVAL: number = 60;

//   const { data, isLoading, isError } = useQuery({
//     // queryKey: ['notifications', userId],
//     // queryFn: () => getNotifications(userId),
//     refetchInterval: 1000 * NOTIF_REFESH_INTERVAL,
//   });

//   const [notifs, setNotifs] = useState<Notification[]>([]);

//   useEffect(() => {
//     setNotifs(data?.documents || []);
//     // console.log('> running setNotifs');
//   }, [data]);

//   const handleNotificationClick = (notifID: string) => {
//     // console.log(`Notification clicked: ${notifID}`);
//     readNotifMutation.mutate(notifID);

//     // perform action based on notification type
//   };

//   const readNotifMutation = useMutation({
//     mutationFn: (notifID: string) => readNotification(notifID),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
//     },
//   });

//   return (
//     <Popover>
//       <PopoverTrigger asChild>
//         <button className="p-2 rounded-xl bg-primary/90 hover:bg-primary/70 font-medium relative text-white border-primary">
//           <BellIcon size={20} />
//           {notifs.some((n) => !n.is_read) && (
//             <span className="absolute -top-1 -right-1 text-xs bg-red-500 px-01 rounded-full text-white font-bold h-3 w-3" />
//           )}
//         </button>
//       </PopoverTrigger>
//       <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[450px] p-0 rounded-xl" align="end">
//         <Card className="shadow-none" notif>
//           <div className="flex justify-between items-center border-b">
//             <h3 className="font-semibold text-xl py-1 pl-4 pb-2">Notifications</h3>
//           </div>
//           <ScrollArea className="h-[500px] bg-slate-50 rounded-xl">
//             {userId ? (
//               <div className="p-4">
//                 {isLoading && <p>loading...</p>}
//                 {isError && (
//                   <p className="text-red-500 text-center text-sm">
//                     Error loading notifications, try again later.
//                   </p>
//                 )}
//                 {notifs.length > 0
//                   ? notifs.map((notification) => (
//                       <div
//                         onClick={() => {
//                           if (!notification.is_read) {
//                             handleNotificationClick(notification.id);
//                           }
//                         }}
//                         key={notification.id}
//                         className={`mb-2 px-3 py-2 border rounded-lg ${
//                           !notification.is_read ? 'bg-primary/10 cursor-pointer' : 'bg-white'
//                         }`}
//                       >
//                         <div className="flex items-start justify-between gap-2">
//                           <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
//                           {!notification.is_read && (
//                             <span className="text-xs bg-red-500 px-1 rounded-full text-white font-bold h-2 w-2 mr-1" />
//                           )}
//                           {/* <button className='text-xs cursor-pointer border rounded p-1 px-2'>Done</button> */}
//                         </div>
//                         <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
//                         <div className="w-full text-right">
//                           <span className="text-xs text-gray-500">
//                             {formatDistanceToNow(new Date(notification.createdAt), {
//                               addSuffix: true,
//                             })}
//                           </span>
//                         </div>
//                       </div>
//                     ))
//                   : !isLoading && <p className="text-center text-gray-500">No notifications</p>}
//               </div>
//             ) : (
//               <div className="p-4">
//                 <p className="text-center text-gray-500">Please log in to see notifications</p>
//               </div>
//             )}
//           </ScrollArea>
//         </Card>
//       </PopoverContent>
//     </Popover>
//   );
// };

// export default NotificationPanel;

// // Refresh notifications every 3 seconds as a fallback if realtime fails
// // useEffect(() => {
// //   if (!userId) return;

// //   const intervalId = setInterval(() => {
// //     console.log('Performing backup notification fetch');
// //     fetchNotifications().then((notifications) => {
// //       setNotifs((current) => {
// //         // Merge and deduplicate notifications
// //         const combinedNotifications = [...notifications];

// //         current.forEach((existingNotif) => {
// //           if (!combinedNotifications.some((n) => n.id === existingNotif.id)) {
// //             combinedNotifications.push(existingNotif);
// //           }
// //         });

// //         // Sort by creation time (newest first)
// //         return combinedNotifications.sort(
// //           (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
// //         );
// //       });
// //     });
// //   }, 60000);

// //   return () => clearInterval(intervalId);
// // }, [userId]);
