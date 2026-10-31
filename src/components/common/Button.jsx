import { cn } from '../../utils/helpers'

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled,
  block = false,
  className,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn('btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', className)}
      {...rest}
    >
      {loading ? <span className="btn__spinner" aria-hidden /> : null}
      <span className="inline-flex items-center justify-center gap-1.5 leading-none">{children}</span>
    </button>
  )
}
