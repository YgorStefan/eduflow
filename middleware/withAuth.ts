import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase-client'
import type { NextPage } from 'next'

type Role = 'student' | 'admin'

export function withAuth(Component: NextPage, role: Role = 'student') {
  return function ProtectedPage() {
    const router = useRouter()
    const [checked, setChecked] = useState(false)

    useEffect(() => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.replace('/login')
          return
        }
        const snap = await getDoc(doc(db, 'users', user.uid))
        const data = snap.data()

        if (!data?.access_enabled) {
          router.replace('/aguardando')
          return
        }
        if (role === 'admin' && data?.role !== 'admin') {
          router.replace('/portal')
          return
        }
        setChecked(true)
      })
      return unsub
    }, [router])

    if (!checked) return null

    return <Component />
  }
}
