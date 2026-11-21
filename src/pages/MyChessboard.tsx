import { PageContainer } from '@/components/layout/PageContainer'
import { SimulationNotice } from '@/components/common/SimulationBadge'
import { DeviceOverview } from '@/components/device/DeviceOverview'
import { OccupancyGrid } from '@/components/device/OccupancyGrid'
import { MovementSimulator } from '@/components/device/MovementSimulator'
import { DeviceLogs } from '@/components/device/DeviceLogs'

export default function MyChessboard() {
  return (
    <PageContainer title="My Chessboard" description="Device management for your Smart Connected Chessboard.">
      <div className="mb-6">
        <SimulationNotice>
          <strong>Visual simulation.</strong> This page does not communicate with an ESP32-S3, Raspberry Pi, sensors, or motors.
          All statuses and events are generated in your browser. Enable “Use physical board” when creating a game to see moves
          mirrored here.
        </SimulationNotice>
      </div>
      <div className="grid gap-6">
        <DeviceOverview />
        <div className="grid gap-6 xl:grid-cols-2">
          <OccupancyGrid />
          <MovementSimulator />
        </div>
        <DeviceLogs />
      </div>
    </PageContainer>
  )
}
