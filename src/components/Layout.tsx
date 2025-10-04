import { Link, useLocation } from 'react-router-dom';
import { Users, Building2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const navigation = [
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Teams', href: '/teams', icon: Building2 },
  { name: 'Clients', href: '/', icon: FolderOpen },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <SidebarProvider>
      <Sidebar className="bg-card" collapsible="offcanvas">
        <SidebarHeader>
          <h1 className="px-2 text-base font-semibold text-foreground">Team Management</h1>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href} className={cn('flex items-center gap-2')}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger />
          <h2 className="text-sm font-medium text-muted-foreground">Team Management</h2>
        </header>
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};