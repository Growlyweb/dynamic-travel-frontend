import EmptyState from '../../../components/common/EmptyState'

export default function DocumentViewer({ document }) {
  if (!document) return null

  const isImage = /\.(jpe?g|png|gif|webp)$/i.test(document.name ?? '')

  return (
    <div className="card">
      <p className="card__title">Preview</p>
      {isImage ? (
        <img src={document.url} alt={document.name} style={{ maxHeight: 420, borderRadius: 'var(--radius-sm)' }} />
      ) : (
        <EmptyState
          icon="📄"
          title="Inline preview not available"
          description={`No preview for ${document.name}. Connect your file storage to render PDFs and other formats here.`}
        />
      )}
    </div>
  )
}
