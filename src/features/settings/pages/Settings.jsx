import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import { settingsApi } from '../settings.api'
import { usePermission } from '../../../hooks/usePermission'
import { useToast } from '../../../context/ToastContext'
import { PERMISSIONS } from '../../../utils/permissions'
import { errorMessage } from '../../../utils/errors'
import { formatDate } from '../../../utils/formatters'

// What the platform lets an administrator set. Everyone with access can read it. Only an administrator changes the limits,
// and a currency rate is changed by someone who may edit visas (it prices visa applications).
export default function Settings() {
  const { can, isAdmin } = usePermission()
  const toast = useToast()
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState(null)
  const [currencies, setCurrencies] = useState([])
  const [limits, setLimits] = useState(null)
  const [saving, setSaving] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      const all = await settingsApi.getAll()
      setSettings(all)
      setCurrencies(all.currencies.items.map((item) => ({ ...item, rateToBase: String(item.rateToBase) })))
      setLimits({
        maxSizeMb: String(all['visa.documents'].maxSizeMb),
        maxFilesPerItem: String(all['visa.documents'].maxFilesPerItem),
        retentionDays: String(all['visa.retention'].days),
        duplicateWindowDays: String(all['visa.duplicateWindowDays'].days),
      })
    } catch (failure) {
      setError(failure)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function run(name, action, done) {
    setSaving(name)
    try {
      await action()
      toast.success(done)
      await load()
    } catch (failure) {
      toast.error(errorMessage(failure))
    } finally {
      setSaving('')
    }
  }

  if (error) return <ErrorState title="Could not load the settings" message={errorMessage(error)} onRetry={load} />
  if (!settings) return <Loader fullPage label="Loading settings…" />

  const canRates = can(PERMISSIONS.VISA_EDIT)

  return (
    <div className="stack">
      <PageHeader title="Settings" description="Currencies and limits that apply to everyone." breadcrumbs={[{ label: 'Settings' }, { label: 'General' }]} />

      <div className="card stack" style={{ maxWidth: 720 }}>
        <p className="card__title">Currencies</p>
        <p className="muted small">How many {settings.currencies.base} one unit is worth. Visa prices in another currency are converted with these rates.</p>
        {currencies.map((currency, index) => (
          <div key={currency.code} className="row" style={{ gap: 12, alignItems: 'flex-end' }}>
            <div style={{ width: 160 }}>
              <p className="strong" style={{ margin: 0 }}>{currency.code} · {currency.name}</p>
              <p className="muted small" style={{ margin: 0 }}>{currency.source === 'base' ? 'Base currency' : currency.updatedAt ? `${currency.source}, ${formatDate(currency.updatedAt)}` : currency.source}</p>
            </div>
            <Input label={`1 ${currency.code} in ${settings.currencies.base}`} type="number" min="0" step="any" value={currency.rateToBase} disabled={currency.source === 'base' || !canRates} onChange={(event) => setCurrencies((list) => list.map((item, position) => (position === index ? { ...item, rateToBase: event.target.value } : item)))} />
            {currency.source !== 'base' && canRates ? (
              <Button variant="ghost" size="sm" loading={saving === `refresh-${currency.code}`} onClick={() => run(`refresh-${currency.code}`, () => settingsApi.refreshCurrency(currency.code), `${currency.code} rate refreshed.`)}>
                Fetch today’s rate
              </Button>
            ) : null}
          </div>
        ))}
        {canRates ? (
          <div>
            <Button
              loading={saving === 'currencies'}
              onClick={() => run('currencies', () => settingsApi.saveCurrencies(currencies.map(({ code, name, symbol, rateToBase }) => ({ code, name, symbol, rateToBase: Number(rateToBase) }))), 'Currencies saved.')}
            >
              Save currencies
            </Button>
          </div>
        ) : null}
      </div>

      <div className="card stack" style={{ maxWidth: 720 }}>
        <p className="card__title">Visa documents and records</p>
        <div className="grid grid--2">
          <Input label="Largest file (MB)" type="number" min="1" max="25" value={limits.maxSizeMb} disabled={!isAdmin} onChange={(event) => setLimits({ ...limits, maxSizeMb: event.target.value })} />
          <Input label="Files per checklist item" type="number" min="1" max="20" value={limits.maxFilesPerItem} disabled={!isAdmin} onChange={(event) => setLimits({ ...limits, maxFilesPerItem: event.target.value })} />
          <Input label="Keep visa records (days)" type="number" min="30" max="3650" value={limits.retentionDays} disabled={!isAdmin} onChange={(event) => setLimits({ ...limits, retentionDays: event.target.value })} />
          <Input label="Duplicate window (days)" type="number" min="0" max="365" value={limits.duplicateWindowDays} disabled={!isAdmin} onChange={(event) => setLimits({ ...limits, duplicateWindowDays: event.target.value })} hint="The same passport and country within this time needs a confirmation note. 0 turns the check off." />
        </div>
        <p className="muted small">Accepted file types: {settings['visa.documents'].allowedTypes.join(', ')}.</p>
        {isAdmin ? (
          <div>
            <Button
              loading={saving === 'limits'}
              onClick={() =>
                run(
                  'limits',
                  async () => {
                    await settingsApi.save('visa.documents', { ...settings['visa.documents'], maxSizeMb: Number(limits.maxSizeMb), maxFilesPerItem: Number(limits.maxFilesPerItem) })
                    await settingsApi.save('visa.retention', { days: Number(limits.retentionDays) })
                    await settingsApi.save('visa.duplicateWindowDays', { days: Number(limits.duplicateWindowDays) })
                  },
                  'Settings saved.',
                )
              }
            >
              Save limits
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
