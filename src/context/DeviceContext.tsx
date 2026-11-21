import { createContext, useContext, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useDeviceSimulator, type DeviceSimulatorApi } from '@/hooks/useDeviceSimulator'
import { useSettings } from './SettingsContext'
import { useAccount } from './AccountContext'

const DeviceContext = createContext<DeviceSimulatorApi | null>(null)

export function DeviceProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const { pushNotification } = useAccount()
  const device = useDeviceSimulator({
    boardName: settings.boardName,
    speed: settings.movementSpeed,
    autoMovement: settings.autoMovement,
    onConnectionChange: (online) => {
      if (!settings.notifyDeviceStatus) return
      const title = online ? 'Board reconnected (simulated)' : 'Board connection lost (simulated)'
      const body = `${settings.boardName} is ${online ? 'back online' : 'offline'}.`
      if (online) toast.success(title, { description: body })
      else toast.error(title, { description: body })
      pushNotification({ title, body, kind: 'device' })
    },
  })
  return <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>
}

export function useDevice() {
  const ctx = useContext(DeviceContext)
  if (!ctx) throw new Error('useDevice must be used within DeviceProvider')
  return ctx
}
