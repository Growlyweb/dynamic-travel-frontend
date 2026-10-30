import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import PartnerDocumentList from '../components/PartnerDocumentList'
import { b2bApi } from '../b2b.api'
import { errorMessage } from '../../../utils/errors'

// The documents of one partner (opened from the partner's page or the applications list).
export default function PartnerDocuments() {
  const [searchParams] = useSearchParams()
  const partnerId = searchParams.get('partnerId') || ''
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(Boolean(partnerId))
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!partnerId) return
    setError(null)
    try {
      setPartner(await b2bApi.getPartner(partnerId))
    } catch (failure) {
      setError(failure)
    } finally {
      setLoading(false)
    }
  }, [partnerId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="stack">
      <PageHeader title="Partner documents" description="Verify the trade license and business documents of a partner." breadcrumbs={[{ label: 'Partners · B2B' }, { label: 'Documents' }]} />
      {!partnerId ? (
        <div className="card">
          <p className="muted">Documents are checked partner by partner. Open a partner on the <Link to="/b2b/partners" className="strong">Partners</Link> page to see theirs.</p>
        </div>
      ) : loading ? (
        <Loader label="Loading documents…" />
      ) : error ? (
        <ErrorState title="Could not load the documents" message={errorMessage(error)} onRetry={load} />
      ) : (
        <div className="card">
          <p className="card__title">{partner.company}</p>
          <PartnerDocumentList partner={partner} onChanged={load} />
        </div>
      )}
    </div>
  )
}
