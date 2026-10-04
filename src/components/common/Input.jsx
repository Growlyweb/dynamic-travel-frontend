import { forwardRef, useId } from 'react'
import { cn } from '../../utils/helpers'

const Input = forwardRef(function Input({ label, error, hint, className, id, ...rest }, ref) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className={cn('field', className)}>
      {label ? <label className="field__label" htmlFor={inputId}>{label}</label> : null}
      <input
        ref={ref}
        id={inputId}
        className={cn('field__control', error && 'field__control--invalid')}
        aria-invalid={Boolean(error) || undefined}
        {...rest}
      />
      {error ? <p className="field__error">{error}</p> : hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  )
})

export default Input
