import { Link } from 'react-router-dom'
import { APP_ROUTES } from '../../utils/constants'

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link to={APP_ROUTES.DASHBOARD}>Home</Link>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="breadcrumb__item">
          <span className="breadcrumb__sep">/</span>
          {item.to && index < items.length - 1 ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span className="breadcrumb__current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
