'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import {
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconListDetails,
  IconUsers,
} from '@tabler/icons-react';
import { CiBoxes } from "react-icons/ci";
import { usePathname, useRouter } from 'next/navigation';

const navMain = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: IconDashboard,
  },
  {
    title: 'Orders',
    url: '/dashboard/orders',
    icon: CiBoxes,
  },
  // {
  //   title: 'Team',
  //   url: '/teams',
  //   icon: IconUsers,
  // },
  // {
  //   title: 'Lifecycle',
  //   url: '#',
  //   icon: IconListDetails,
  // },
  // {
  //   title: 'Analytics',
  //   url: '#',
  //   icon: IconChartBar,
  // },
  // {
  //   title: 'Projects',
  //   url: '#',
  //   icon: IconFolder,
  // },
];

export function AdminNavPanel() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {/* admin panel */}
      <SidebarGroupLabel>Main</SidebarGroupLabel>
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
