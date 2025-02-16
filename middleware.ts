import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Match /p/[projectName]/[view]
  const projectViewMatch = pathname.match(/^\/p\/([^\/]+)\/([^\/]+)$/)
  if (projectViewMatch) {
    const [, projectName, view] = projectViewMatch
    return NextResponse.redirect(
      new URL(`/view?project=${encodeURIComponent(projectName)}&view=${encodeURIComponent(view)}`, request.url)
    )
  }

  // Match /p/[projectName]
  const projectMatch = pathname.match(/^\/p\/([^\/]+)$/)
  if (projectMatch) {
    const [, projectName] = projectMatch
    return NextResponse.redirect(
      new URL(`/?project=${encodeURIComponent(projectName)}`, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/p/:projectName/:view*']
} 