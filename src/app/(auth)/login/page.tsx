'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl shadow-md">
            <Image src="/logo.jpg" alt="Midcenturist SA" fill className="object-cover" priority />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Sign In</h1>
          <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
        </div>

        {/* Demo card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Demo Accounts</CardTitle>
            <CardDescription className="text-xs">Mock Mode — no real auth required</CardDescription>
          </CardHeader>

          <Separator />

          <CardContent className="pt-4 space-y-4">
            {/* Account row */}
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <FontAwesomeIcon icon={faUser} className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold">Midcenturist Admin</p>
                <p className="truncate text-xs text-muted-foreground">admin@midcenturist.co.za</p>
              </div>
            </div>

            {/* Login button */}
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Login as Midcenturist Admin
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Production note */}
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          In production, this will be replaced with{' '}
          <span className="font-medium text-foreground">AWS Cognito</span> authentication.
        </p>

      </div>
    </div>
  )
}
