import type { R } from "node_modules/vite/dist/node/types.d-aGj9QkWt";
import { AppSidebar } from "~/components/app-sidebar"
import { BreadcrumbNavigation } from "~/components/breadcrumb-navigation"
import { Separator } from "~/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar"
import type { Route } from "./+types/_layout";
import { Outlet, useParams } from 'react-router';
import { Toaster, toast } from 'sonner';
import { AuthSessionTimeoutProvider } from "~/components/auth-session-timeout-provider";
export function clientLoader({params}: Route.ClientLoaderArgs) {
  
  
}
export default function Page() {
  return (
    <AuthSessionTimeoutProvider defaultTimeoutHours={8}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <BreadcrumbNavigation />
          </header>
          <Toaster />
          <Outlet/>

        </SidebarInset>
      </SidebarProvider>
    </AuthSessionTimeoutProvider>
  )
}
