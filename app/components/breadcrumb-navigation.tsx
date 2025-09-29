import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { useBreadcrumbs } from "~/hooks/use-breadcrumbs"
import { usePageTitle } from "~/hooks/use-page-title"
import { Fragment } from "react"

interface BreadcrumbNavigationProps {
  customTitle?: string
  className?: string
}

export function BreadcrumbNavigation({ customTitle, className }: BreadcrumbNavigationProps) {
  const breadcrumbs = useBreadcrumbs()

  // This will also set the document title
  usePageTitle(customTitle)

  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
              {item.isCurrentPage ? (
                <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span className="truncate max-w-[200px]">{customTitle || item.label}</span>
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  href={item.href || '#'}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span className="truncate max-w-[150px]">{item.label}</span>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : ""} />
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}