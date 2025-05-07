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
import { AiFillDashboard } from "react-icons/ai";
import { FaBoxesStacked, FaLocationDot, FaUsersGear } from "react-icons/fa6";
import { FaHandshake } from "react-icons/fa6";

const navMain = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: AiFillDashboard,
  },
  {
    title: 'Orders',
    url: '/dashboard/orders',
    icon: FaBoxesStacked,
  },
  {
    title: 'Trips',
    url: '/dashboard/trips',
    icon: FaLocationDot,
  },
  {
    title: 'Drivers',
    url: '/dashboard/drivers',
    icon: FaUsersGear,
  },
  {
    title: 'Clients',
    url: '/dashboard/clients',
    icon: FaHandshake,
  },
];

export function AdminNavPanel({ ...props }: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SidebarGroup {...props}>
      {/* admin panel */}
      <SidebarGroupLabel>Navigation Panel</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {navMain.map((item) => (
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
