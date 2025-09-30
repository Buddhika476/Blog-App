import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined

  // If the image URL is already absolute, return it as is
  if (imageUrl.startsWith('http')) return imageUrl

  // If it's a relative path starting with /uploads, prepend the backend URL
  if (imageUrl.startsWith('/uploads')) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    return `${API_BASE_URL}${imageUrl}`
  }

  // For any other relative paths, return as is
  return imageUrl
}