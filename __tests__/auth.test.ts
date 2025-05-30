import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { AuthError } from '@supabase/supabase-js'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
  },
}))

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Login', () => {
    it('should successfully log in with valid credentials', async () => {
      const mockUser: User = {
        id: 'test-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }

      const mockSession: Session = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      }

      // Mock successful login
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(error).toBeNull()
      expect(data.user).toEqual(mockUser)
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should handle login failure', async () => {
      // Mock login failure
      const mockError = new AuthError('Invalid login credentials', 401)

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      expect(error).toBeDefined()
      expect(data.user).toBeNull()
    })
  })

  describe('Registration', () => {
    it('should successfully register a new user', async () => {
      const mockUser: User = {
        id: 'new-test-id',
        email: 'newuser@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }

      const mockSession: Session = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      }

      // Mock successful registration
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { data, error } = await supabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'password123',
      })

      expect(error).toBeNull()
      expect(data.user).toEqual(mockUser)
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      })
    })

    it('should handle registration failure', async () => {
      // Mock registration failure
      const mockError = new AuthError('User already registered', 409)

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      })

      const { data, error } = await supabase.auth.signUp({
        email: 'existing@example.com',
        password: 'password123',
      })

      expect(error).toBeDefined()
      expect(data.user).toBeNull()
    })
  })

  describe('User Session', () => {
    it('should get current user session', async () => {
      const mockUser: User = {
        id: 'test-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }

      // Mock get user
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      })

      const { data, error } = await supabase.auth.getUser()

      expect(error).toBeNull()
      expect(data.user).toEqual(mockUser)
    })
  })
}) 