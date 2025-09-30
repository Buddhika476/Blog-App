'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { authApi } from './api'
import { LoginData, RegisterData, User } from './types'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const response = await authApi.login({ email, password })
    const cookieStore = await cookies()

    cookieStore.set('access_token', response.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    cookieStore.set('user', JSON.stringify(response.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  } catch (error: any) {
    console.error('Login error:', error)
    let errorMessage = 'Login failed'

    if (error?.response?.status === 401) {
      errorMessage = 'Invalid email or password'
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error?.message) {
      errorMessage = error.message
    }

    return { error: errorMessage }
  }

  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string

  try {
    const response = await authApi.register({ email, password, firstName, lastName })
    const cookieStore = await cookies()

    cookieStore.set('access_token', response.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    cookieStore.set('user', JSON.stringify(response.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    let errorMessage = 'Registration failed'

    if (error?.response?.status === 409) {
      errorMessage = 'An account with this email already exists'
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.response?.data?.error) {
      errorMessage = error.response.data.error
    } else if (error?.message) {
      errorMessage = error.message
    }

    return { error: errorMessage }
  }

  redirect('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('user')
  redirect('/login')
}

export async function getUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')

  if (!userCookie) {
    return null
  }

  try {
    return JSON.parse(userCookie.value)
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('access_token')
  return tokenCookie?.value || null
}