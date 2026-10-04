import Badge from '../../../components/common/Badge'

const STATUS_TONES = { verified: 'success', pending: 'warning', rejected: 'danger' }

export default function VisaDocumentList({ documents = [] }) {
  return (
    <ul className="stack stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {documents.map((document) => (
        <li key={document.id} className="row between">
          <div>
            <p className="strong">{document.name}</p>
            <p className="muted small">{document.size}</p>
          </div>
          <Badge tone={STATUS_TONES[document.status] ?? 'neutral'}>{document.status}</Badge>
        </li>
      ))}
    </ul>
  )
}
