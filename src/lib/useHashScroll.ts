import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router no baja solo hasta el ancla de la URL (#contacto, #newsletter…)
export function useHashScroll() {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])
}
