'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { resetGuestUsage } from "@/lib/guest-session"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestAccess = async () => {
    try {
      console.log('Guest access button clicked')
      
      // Reset guest usage
      resetGuestUsage()
      console.log('Guest usage reset completed')
      
      // Show toast notification
      toast({
        title: "Guest Access",
        description: "Continuing as guest user...",
      })

      // Navigate to home page
      console.log('Attempting to navigate to home page...')
      await router.push('/')
      await router.refresh()
    } catch (error) {
      console.error('Error in guest access:', error)
      toast({
        title: "Error",
        description: "Failed to continue as guest. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container flex h-screen w-full flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">
            Or{" "}
            <Link href="/register" className="text-primary hover:underline">
              create a new account
            </Link>
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Input
                  id="email"
                  placeholder="Email"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  id="password"
                  placeholder="Password"
                  type="password"
                  autoComplete="current-password"
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button disabled={loading}>
                {loading && (
                  <div className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign In
              </Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue as</span>
            </div>
          </div>

          <Button variant="outline" onClick={handleGuestAccess}>
            Continue as Guest
            <span className="ml-2 text-xs text-muted-foreground">(5 free tries)</span>
          </Button>
        </div>
      </div>
    </div>
  )
} 