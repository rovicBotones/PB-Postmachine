import * as React from "react"

import { toast } from "sonner"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter
} from "~/components/ui/sidebar"
import {
  House,
  LogOut,
  Printer,
  UserCircle,
  Settings,
  Bell,
  ChevronDown,
  Plus,
  Search,
  Calendar,
  FileText,
  BarChart3,
  Users,
  Zap,
  Newspaper
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Skeleton } from "~/components/ui/skeleton"
import { signoutService } from "utils/signOut.service"
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "~/components/ui/credenza"
import { set } from "date-fns"
import { Link, useLocation } from "react-router"
import { useUser } from "~/hooks/use-user"

const items = [
  {
    title: "Posts",
    url: "/home",
    icon: FileText,
    permission: "view.user"
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    permission: "print"
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    permission: "view.user"
  }
]
// Helper function to check if user has permission for a menu item
const hasPermission = (item: any, userRole: string | undefined): boolean => {
  if (!userRole) return false;

  // Admin has access to everything
  if (userRole === 'admin') return true;

  // Settings is admin-only
  if (item.permission === 'admin.only') return userRole === 'admin';

  // Map specific permissions to roles
  const rolePermissions: Record<string, string[]> = {
    'user': ['view.user'],
    'editor': ['view.user', 'edit.posts'],
    'moderator': ['view.user', 'edit.posts', 'print'],
  };

  const permissions = rolePermissions[userRole.toLowerCase()] || [];
  return permissions.includes(item.permission);
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const { user, loading, error } = useUser();

  const handleLogout = async () => {
    const { success, error } = await signoutService();
    if (error) {
      toast.error("Error signing out: " + error.message);
    } else if (success) {
      toast.success("Successfully signed out");
    }
    setOpen(false);
     setTimeout(() => {
        window.location.reload();
      }, 2000);
  }

  // Show error state if there's an authentication error
  if (error) {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent className="flex items-center justify-center p-4">
          <div className="text-center text-sm text-sidebar-foreground/70">
            <p>Error loading user data</p>
            <p className="text-xs">{error}</p>
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  const isActiveRoute = (url: string) => {
    if (url === "#") return false;
    return location.pathname === url || location.pathname.startsWith(url + "/");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-1 py-1.5">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Newspaper className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">PB Post Machine</span>
                <span className="truncate text-xs text-sidebar-foreground/70">v1.0.0</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* User Profile Section */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-1 py-1.5">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar_url} alt={user?.full_name || user?.email || "User"} />
                  <AvatarFallback className="rounded-lg">
                    {loading ? "..." : user?.initials || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {loading ? "Loading..." : user?.full_name || user?.email?.split('@')[0] || "User"}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {loading ? "" : user?.email || ""}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {user?.role && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {user.role}
                    </Badge>
                  )}
                  <ChevronDown className="size-4 text-sidebar-foreground/50" />
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items
              .filter(item => hasPermission(item, user?.role))
              .map((item) => {
                const isActive = isActiveRoute(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Credenza open={open} onOpenChange={setOpen}>
              <CredenzaTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <LogOut className="size-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </CredenzaTrigger>
              <CredenzaContent>
                <CredenzaHeader>
                  <CredenzaTitle>Sign Out</CredenzaTitle>
                  <CredenzaDescription>
                    Are you sure you want to sign out of your account?
                  </CredenzaDescription>
                </CredenzaHeader>
                <CredenzaBody>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar_url} alt={user?.full_name || user?.email || "User"} />
                      <AvatarFallback>{user?.initials || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {user?.full_name || user?.email?.split('@')[0] || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      {user?.role && (
                        <Badge variant="secondary" className="text-xs mt-1 capitalize">
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You will be redirected to the login page and will need to enter your credentials again to access your account.
                  </p>
                </CredenzaBody>
                <CredenzaFooter>
                  <Button
                   variant="destructive"
                   id="logout"
                   onClick={handleLogout}
                   >Sign Out</Button>
                  <CredenzaClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </CredenzaClose>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarRail />
      </SidebarFooter>
    </Sidebar>
  )
}
