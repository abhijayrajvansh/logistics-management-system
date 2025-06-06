'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { usePathname, useRouter } from 'next/navigation';
import { useFeatureAccess } from '@/app/context/PermissionsContext';
import { FeatureId } from '@/constants/permissions';
import { AiFillDashboard } from "react-icons/ai";
import { FaBoxesStacked, FaLocationDot, FaUsersGear } from "react-icons/fa6";
import { FaHandshake } from "react-icons/fa6";
import { RiUserReceived2Fill } from "react-icons/ri";
import { PiUserSquareFill } from "react-icons/pi";
import { FaTruck } from "react-icons/fa";
import { MdHub } from "react-icons/md";
import { FaClock } from "react-icons/fa6";
import { FaHandHoldingMedical } from "react-icons/fa";
import { FaWallet } from "react-icons/fa";
import { FaCogs } from "react-icons/fa";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType;
  permission: FeatureId;
}

const navMain: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: AiFillDashboard,
    permission: 'FEATURE_DASHBOARD_VIEW' as FeatureId,
  },
  {
    title: 'Orders',
    url: '/dashboard/orders',
    icon: FaBoxesStacked,
    permission: 'FEATURE_ORDERS_VIEW' as FeatureId,
  },
  {
    title: 'Trips',
    url: '/dashboard/trips',
    icon: FaLocationDot,
    permission: 'FEATURE_TRIPS_VIEW' as FeatureId,
  },
  {
    title: 'Trucks',
    url: '/dashboard/trucks',
    icon: FaTruck,
    permission: 'FEATURE_TRUCKS_VIEW' as FeatureId,
  },
  {
    title: 'Drivers',
    url: '/dashboard/drivers',
    icon: FaUsersGear,
    permission: 'FEATURE_DRIVERS_VIEW' as FeatureId,
  },
  {
    title: 'Drivers Attendance',
    url: '/dashboard/drivers/attendance',
    icon: PiUserSquareFill,
    permission: 'FEATURE_ATTENDANCE_VIEW' as FeatureId,
  },
  {
    title: 'Drivers Requests',
    url: '/dashboard/drivers/requests',
    icon: FaHandHoldingMedical,
    permission: 'FEATURE_REQUESTS_VIEW' as FeatureId,
  },
  {
    title: 'Centers',
    url: '/dashboard/centers',
    icon: MdHub,
    permission: 'FEATURE_CENTERS_VIEW' as FeatureId,
  },
  {
    title: 'Rate Cards',
    url: '/dashboard/ratecard',
    icon: FaHandshake,
    permission: 'FEATURE_RATECARD_VIEW' as FeatureId,
  },
  {
    title: 'Wallets',
    url: '/dashboard/wallets',
    icon: FaWallet,
    permission: 'FEATURE_WALLETS_VIEW' as FeatureId,
  },
  {
    title: 'Admin Panel',
    url: '/admin/permissions',
    icon: FaCogs,
    permission: 'FEATURE_ADMIN_PANEL' as FeatureId,
  },
];

export function AdminNavPanel({ ...props }: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const router = useRouter();
  const pathname = usePathname();
  const { can } = useFeatureAccess();

  // Filter navigation items based on user permissions
  const allowedNavItems = navMain.filter(item => can(item.permission));

  return (
    <SidebarGroup {...props}>
      {/* admin panel */}
      <SidebarGroupLabel>Navigation Panel</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {allowedNavItems.map((item) => (
            <SidebarMenuItem
              key={item.title}
              onClick={(e) => {
                e.preventDefault();
                router.push(item.url);
              }}
              data-active={pathname === item.url}
              className={pathname === item.url ? 'bg-primary/40 rounded' : ''}
            >
              <SidebarMenuButton tooltip={item.title} className='hover:bg-primary/30'>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
