import Upcoming from './upcoming/upcoming'
import { PastEventsSection } from './past/PastEvents'
import type { PastEventView } from '@/lib/event-display'

interface EventsProps {
  pastEvents?: PastEventView[]
}

const Events = ({ pastEvents = [] }: EventsProps) => {
  return (
    <div className="space-y-16">
      <Upcoming />
      <PastEventsSection events={pastEvents} />
    </div>
  )
}

export default Events
