import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  STATUS_LABELS,
  createAppointment,
  deleteAppointment,
  updateAppointment,
  validateSlot,
} from '../../lib/appointments'
import type { Appointment, AppointmentStatus } from '../../lib/appointments'
import type { BusinessHour, Closure } from '../../lib/businessHours'
import type { Barber } from '../../lib/barbers'
import type { Client } from '../../lib/clients'
import type { Service } from '../../lib/services'
import { clientFullName } from '../../lib/clients'
import { formatPrice } from '../../lib/services'
import { addMinutes, combine, hm, ymd } from '../../lib/datetime'

export type ModalState =
  | { mode: 'create'; date: string; time: string; barberId: string }
  | { mode: 'edit'; appointment: Appointment }

type Props = {
  state: ModalState
  clients: Client[]
  services: Service[]
  barbers: Barber[]
  ctx: { hours: BusinessHour[]; closures: Closure[]; appointments: Appointment[] }
  onCancel: () => void
  onSaved: () => void
}

const inputClass =
  'mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20'

const STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'no_show', 'cancelled']

export function AppointmentModal({ state, clients, services, barbers, ctx, onCancel, onSaved }: Props) {
  const editing = state.mode === 'edit' ? state.appointment : null

  const [clientId, setClientId] = useState(editing?.client_id ?? '')
  const [serviceId, setServiceId] = useState(editing?.service_id ?? services[0]?.id ?? '')
  const [barberId, setBarberId] = useState(
    editing?.barber_id ?? (state.mode === 'create' ? state.barberId : barbers[0]?.id ?? ''),
  )
  const [date, setDate] = useState(editing ? ymd(new Date(editing.starts_at)) : state.mode === 'create' ? state.date : '')
  const [time, setTime] = useState(editing ? hm(new Date(editing.starts_at)) : state.mode === 'create' ? state.time : '')
  const [status, setStatus] = useState<AppointmentStatus>(editing?.status ?? 'confirmed')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId])
  const duration = service?.duration_min ?? 60

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!serviceId || !barberId || !date || !time) {
      setError('Service, barbier, date et heure sont requis.')
      return
    }
    const start = combine(date, time)
    const end = addMinutes(start, duration)
    const validationError = validateSlot(start, end, barberId, { ...ctx, excludeId: editing?.id })
    if (validationError) {
      setError(validationError)
      return
    }
    setBusy(true)
    setError(null)
    const payload = {
      client_id: clientId || null,
      service_id: serviceId,
      barber_id: barberId,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status,
      notes: notes.trim() || null,
    }
    try {
      if (editing) await updateAppointment(editing.id, payload)
      else await createAppointment({ ...payload, source: 'internal' })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement')
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!editing) return
    if (!window.confirm('Supprimer ce rendez-vous ?')) return
    setBusy(true)
    try {
      await deleteAppointment(editing.id)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de suppression')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onCancel}>
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-stone-800">
            {editing ? 'Rendez-vous' : 'Nouveau rendez-vous'}
          </h2>
          <button type="button" onClick={onCancel} className="text-stone-400 hover:text-stone-700" aria-label="Fermer">
            ✕
          </button>
        </div>

        {editing && (
          <div className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
            {service ? `${service.name} · ${duration} min · ${formatPrice(service.price_cents)}` : ''}
            {editing.client?.phone ? ` · ☎ ${editing.client.phone}` : ''}
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-stone-700">Client</label>
          <select className={inputClass} value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— Sans fiche client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {clientFullName(c)}
                {c.phone ? ` (${c.phone})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Service</label>
            <select className={inputClass} value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatPrice(s.price_cents)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Barbier</label>
            <select className={inputClass} value={barberId} onChange={(e) => setBarberId(e.target.value)} required>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Date</label>
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Heure</label>
            <input className={inputClass} type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Statut</label>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-stone-700">Notes internes</label>
          <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          {editing ? (
            <button type="button" onClick={onDelete} disabled={busy} className="text-sm text-red-600 hover:underline disabled:opacity-60">
              Supprimer
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-100">
              Annuler
            </button>
            <button type="submit" disabled={busy} className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-60">
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
