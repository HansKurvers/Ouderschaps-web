import { NavLink } from '@mantine/core'
import { IconFolder, IconUsers } from '@tabler/icons-react'
import { Link, useLocation } from 'react-router-dom'

export function Navigation() {
  const location = useLocation()

  const links = [
    // { label: 'Home', icon: IconHome, to: '/' },
    { label: 'Dossiers', icon: IconFolder, to: '/dossiers' },
    { label: 'Contacten', icon: IconUsers, to: '/contacten' },
    // { label: 'Over Ons', icon: IconInfoCircle, to: '/about' },
    // { label: 'Contact', icon: IconPhone, to: '/contact' },
  ]

  return (
    <>
      {links.map((link) => (
        <NavLink
          key={link.to}
          component={Link}
          to={link.to}
          label={link.label}
          leftSection={<link.icon size={20} />}
          active={location.pathname === link.to}
          style={{ marginBottom: 5 }}
        />
      ))}
    </>
  )
}