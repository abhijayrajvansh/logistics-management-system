'use client';

import * as React from 'react';

import { UserNavDocuments } from '@/components/nav-documents';
import { AdminNavPanel } from '@/components/nav-main';
import { ControlNavPanel } from '@/components/nav-secondary';
import { UserNavProfile } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { FaTruck } from 'react-icons/fa';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/dashboard">
                <span className="text-base font-semibold text-xl">Jaiz Logistics.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <AdminNavPanel />
        <UserNavDocuments />
        <ControlNavPanel className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <UserNavProfile />
      </SidebarFooter>
    </Sidebar>
  );
}
