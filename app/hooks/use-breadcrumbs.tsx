import { useLocation } from 'react-router'
import { useMemo } from 'react'
import { House, Users, FileText, Plus, UserCircle, Settings } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  isCurrentPage?: boolean
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation()

  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbItems: BreadcrumbItem[] = []

    // Handle different route patterns
    if (pathSegments.length === 0 || pathSegments[0] === '') {
      // Root path - redirect to home, show Posts
      breadcrumbItems.push({
        label: 'Posts',
        isCurrentPage: true,
        icon: FileText
      })
      return breadcrumbItems
    }

    // Map routes to breadcrumb configurations
    const routeMap: Record<string, BreadcrumbItem[]> = {
      'home': [
        {
          label: 'Posts',
          isCurrentPage: true,
          icon: FileText
        }
      ],
      'users': [
        {
          label: 'Users',
          href: '/users',
          icon: Users,
          isCurrentPage: pathSegments.length === 1
        }
      ],
      'add-article': [
        {
          label: 'Posts',
          href: '/home',
          icon: FileText
        },
        {
          label: 'Add Article',
          isCurrentPage: true,
          icon: Plus
        }
      ],
      'settings': [
        {
          label: 'Settings',
          isCurrentPage: true,
          icon: Settings
        }
      ],
      'profile': [
        {
          label: 'Profile',
          isCurrentPage: true,
          icon: UserCircle
        }
      ]
    }

    const firstSegment = pathSegments[0]

    if (routeMap[firstSegment]) {
      breadcrumbItems.push(...routeMap[firstSegment])
    } else {
      // Fallback for unknown routes - capitalize the segment
      breadcrumbItems.push({
        label: firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1).replace('-', ' '),
        isCurrentPage: true
      })
    }

    // Handle nested routes (e.g., /users/123/edit)
    if (pathSegments.length > 1) {
      const secondSegment = pathSegments[1]

      // If it's an ID (numeric), show it as detail view
      if (/^\d+$/.test(secondSegment)) {
        const baseRoute = pathSegments[0]
        if (baseRoute === 'users') {
          breadcrumbItems[breadcrumbItems.length - 1].isCurrentPage = false
          breadcrumbItems.push({
            label: `User Details`,
            isCurrentPage: pathSegments.length === 2
          })
        }

        // Handle further nesting (e.g., /users/123/edit)
        if (pathSegments.length > 2) {
          const action = pathSegments[2]
          breadcrumbItems[breadcrumbItems.length - 1].isCurrentPage = false
          breadcrumbItems.push({
            label: action.charAt(0).toUpperCase() + action.slice(1),
            isCurrentPage: true
          })
        }
      } else {
        // Handle named sub-routes
        const subRouteMap: Record<string, string> = {
          'edit': 'Edit',
          'new': 'New',
          'create': 'Create',
          'details': 'Details',
          'settings': 'Settings'
        }

        breadcrumbItems[breadcrumbItems.length - 1].isCurrentPage = false
        breadcrumbItems.push({
          label: subRouteMap[secondSegment] || secondSegment.charAt(0).toUpperCase() + secondSegment.slice(1).replace('-', ' '),
          isCurrentPage: true
        })
      }
    }

    return breadcrumbItems
  }, [location.pathname])

  return breadcrumbs
}