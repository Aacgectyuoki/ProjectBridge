'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getRemainingGuestTries } from '@/lib/guest-session'

export function GuestUsageBanner() {
  const [remainingTries, setRemainingTries] = useState(5)

  useEffect(() => {
    setRemainingTries(getRemainingGuestTries())
  }, [])

  if (remainingTries >= 5) return null

  return (
    <Alert className="mb-4">
      <AlertTitle>Guest Session</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <div>
          You have <span className="font-bold">{remainingTries}</span> free {remainingTries === 1 ? 'try' : 'tries'} remaining.
          Create an account for unlimited access!
        </div>
        <Link href="/register">
          <Button variant="default" size="sm">
            Create Account
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
} 