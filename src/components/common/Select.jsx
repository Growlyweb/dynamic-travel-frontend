import { forwardRef, useId } from 'react'
import { cn } from '../../utils/helpers'

const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder, className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? autoId

  return (
    <div className={cn('field', className)}>
      {label ? <label className="field__label" htmlFor={selectId}>{label}</label> : null}
      <select
        ref={ref}
        id={selectId}
        className={cn('field__control', error && 'field__control--invalid')}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="field__error">{error}</p> : hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  )
})

export default Select
