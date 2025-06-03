import * as React from "react"
import { Check, ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { redirect } from "react-router"

export function VersionSwitcher({
  versions = [],
  defaultVersion = '',
}: {
  versions: string[]
  defaultVersion: string
}) {
  const [selectedVersion, setSelectedVersion] = React.useState(defaultVersion)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              onClick={(e) => {
                e.preventDefault();
                redirect('/');
              }}
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <img src="./logo.png"  alt="" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">PB Post Machine</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
