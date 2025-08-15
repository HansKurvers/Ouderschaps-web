import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'

interface AllTheProvidersProps {
  children: ReactNode
}

export const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <MantineProvider>
      <Notifications />
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </MantineProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }