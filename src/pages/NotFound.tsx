import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/PageContainer'
import { EmptyState } from '@/components/common/EmptyState'

export default function NotFound() {
  return (
    <PageContainer>
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="That square is empty. The page you're looking for doesn't exist."
        action={
          <Button asChild>
            <Link to="/">Back to dashboard</Link>
          </Button>
        }
      />
    </PageContainer>
  )
}
