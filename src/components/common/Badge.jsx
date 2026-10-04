import { cn } from '../../utils/helpers'

export default function Badge({ tone = 'neutral', className, children }) {
  return <span className={cn('badge', `badge--${tone}`, className)}>{children}</span>
}
