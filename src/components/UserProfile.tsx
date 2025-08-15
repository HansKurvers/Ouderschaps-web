import { Avatar, Group, Text, Menu, UnstyledButton, rem } from '@mantine/core'
import { IconLogout, IconChevronDown, IconUser } from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'

interface UserProfileProps {
  compact?: boolean
}

export const UserProfile = ({ compact = false }: UserProfileProps) => {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated || !user) {
    return null
  }

  const userName = user.name || user.email
  const userEmail = user.email
  const userPicture = user.picture

  const getInitials = (name?: string, email?: string) => {
    const displayName = name || email || ''
    const parts = displayName.split(' ').filter(Boolean)
    
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0][0].toUpperCase()
    
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  const initials = getInitials(user.name, user.email)

  if (compact) {
    return (
      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <UnstyledButton>
            <Group gap="xs">
              <Avatar
                src={userPicture}
                alt={userName}
                radius="xl"
                size="md"
              >
                {initials}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Text size="sm" fw={500}>
                  {userName}
                </Text>
              </div>
              <IconChevronDown size={16} />
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Account</Menu.Label>
          <Menu.Item
            leftSection={<IconUser size={14} />}
            disabled
          >
            {userEmail}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            color="red"
            leftSection={<IconLogout size={14} />}
            onClick={() => logout()}
          >
            Uitloggen
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    )
  }

  return (
    <Group>
      <Avatar
        src={userPicture}
        alt={userName}
        radius="xl"
        size="lg"
      >
        {initials}
      </Avatar>
      <div>
        <Text fw={500}>{userName}</Text>
        <Text size="sm" c="dimmed">
          {userEmail}
        </Text>
      </div>
      <UnstyledButton
        onClick={() => logout()}
        style={{
          padding: rem(8),
          borderRadius: rem(4),
          color: 'var(--mantine-color-red-6)',
          '&:hover': {
            backgroundColor: 'var(--mantine-color-red-0)'
          }
        }}
      >
        <Group gap="xs">
          <IconLogout size={20} />
          <Text size="sm">Uitloggen</Text>
        </Group>
      </UnstyledButton>
    </Group>
  )
}