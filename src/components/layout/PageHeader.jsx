import Breadcrumb from './Breadcrumb'

export default function PageHeader({ title, description, breadcrumbs, actions }) {
  return (
    <header className="page-header">
      <div>
        {breadcrumbs ? <Breadcrumb items={breadcrumbs} /> : null}
        <h1 className="page-header__title">{title}</h1>
        {description ? <p className="page-header__description muted">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions row">{actions}</div> : null}
    </header>
  )
}
