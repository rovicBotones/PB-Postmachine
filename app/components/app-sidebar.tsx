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
  UserCircle
} from "lucide-react"
import { Button } from "~/components/ui/button"
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

const items = [
  {
    title: "App Home",
    url: "/home",
    icon: House,
  },
  {
    title: "Print",
    url: "#",
    icon: Printer,
  },
  {
    title: "Users",
    url: "/users",
    icon: UserCircle,
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [open, setOpen] = React.useState(false);
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
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>PB POST MACHINE</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span className="">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter >
        <SidebarRail />
        <Credenza open={open} onOpenChange={setOpen}>
          <CredenzaTrigger asChild>
            <Button className="flex items-center gap-2 text-sm">
              <LogOut size={15} />
              <span>Log Out</span>
            </Button>
          </CredenzaTrigger>
          <CredenzaContent>
            <CredenzaHeader>
              <CredenzaTitle>Log Out</CredenzaTitle>
              {/* <CredenzaDescription>
                A responsive modal component for shadcn/ui.
              </CredenzaDescription> */}
            </CredenzaHeader>
            <CredenzaBody>
              Are you sure you want to log out? 
            </CredenzaBody>
            <CredenzaFooter>
              <Button
               variant="destructive"
               id="logout" 
               onClick={handleLogout}
               >Logout</Button>
              <CredenzaClose asChild>
                <Button>Close</Button>
              </CredenzaClose>
            </CredenzaFooter>
          </CredenzaContent>
        </Credenza>
          
      </SidebarFooter >
    </Sidebar>
  )
}
