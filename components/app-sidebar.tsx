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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/dashboard">
                <div className='flex items-center gap-2'>
                  <img
                    src="/logo/jaiz-logistics-logo.png"
                    alt="jaiz-logistics-logo"
                    className="h-8 rounded-lg"
                  />
                  <span className="text-base font-medium text-lg">Jaiz Logistics Inc.</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <AdminNavPanel />
        <UserNavDocuments className='hidden'/>
        <ControlNavPanel className="mt-auto hidden" />
      </SidebarContent>
      <SidebarFooter>
        <UserNavProfile />
      </SidebarFooter>
    </Sidebar>
  );
}
