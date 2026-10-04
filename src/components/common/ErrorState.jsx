import Button from './Button'

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  retryLabel = 'Retry',
  onRetry,
}) {
  return (
    <div className="error-state">
      <p className="error-state__title">{title}</p>
      <p className="error-state__message">{message}</p>
      {onRetry ? (
        <div className="error-state__actions">
          <Button variant="ghost" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
