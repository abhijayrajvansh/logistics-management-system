'use client';

import {
  IconDotsVertical,
  IconLoader,
  IconLogout,
  IconMail,
  IconUserCircle,
  IconUserFilled
} from '@tabler/icons-react';

import { useAuth } from '@/app/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
// import { useLogout } from '@/hooks/useAuth';

export function UserNavProfile() {
  const { isMobile } = useSidebar();
  // const logout = useLogout();
  const { user } = useAuth();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {/* <AvatarImage src={user?.avatar} alt={user?.name} /> */}
                <AvatarFallback className="rounded">
                  <IconUserFilled size={25}/>
                </AvatarFallback>
              </Avatar>
              
              <div className="grid flex-1 text-left text-sm leading-tight">
                {/* <span className="truncate font-medium">{user?.name}</span> */}
                <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {/* <AvatarImage src={user?.avatar} alt={user?.name} /> */}
                  <AvatarFallback className="rounded-lg">
                  <IconUserFilled size={25}/>
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {/* <span className="truncate font-medium">{user?.name}</span> */}
                  <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <IconMail />
                Mails
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                // logout.mutate();
              }}
              // disabled={logout.isPending}
            >
              {/* {logout.isPending ? (
                <>
                  <IconLoader className="animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <IconLogout />
                  Log out
                </>
              )} */}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
