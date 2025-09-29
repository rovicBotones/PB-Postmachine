import { useEffect } from 'react'
import { useBreadcrumbs } from './use-breadcrumbs'

export function usePageTitle(customTitle?: string) {
  const breadcrumbs = useBreadcrumbs()

  useEffect(() => {
    const currentPage = breadcrumbs.find(item => item.isCurrentPage)
    const pageTitle = customTitle || currentPage?.label || 'PB Post Machine'
    const fullTitle = pageTitle === 'PB Post Machine' ? pageTitle : `${pageTitle} - PB Post Machine`

    document.title = fullTitle
  }, [breadcrumbs, customTitle])

  return {
    pageTitle: customTitle || breadcrumbs.find(item => item.isCurrentPage)?.label || 'Dashboard',
    breadcrumbs
  }
}