import { getUser } from '@/lib/auth'
import { NavigationClient } from './navigation-client'

export default async function Navigation() {
  const user = await getUser()

  return <NavigationClient user={user} />
}