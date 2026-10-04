export default function Loader({ size = 28, label, fullPage = false }) {
  const spinner = (
    <span className="loader" style={{ width: size, height: size }} role="status" aria-label={label || 'Loading'} />
  )
  if (!fullPage) return spinner
  return (
    <div className="loader-page">
      {spinner}
      {label ? <p>{label}</p> : null}
    </div>
  )
}
