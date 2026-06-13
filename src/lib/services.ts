import { supabase } from './supabase'

export type Service = {
  id: string
  category: string
  name: string
  description: string | null
  price_cents: number
  duration_min: number
  prep_min: number
  cleanup_min: number
  is_active: boolean
  display_order: number
  created_at: string
}

export type ServiceInput = Omit<Service, 'id' | 'created_at'>

export async function listServices(): Promise<Service[]> {
  const { data, error } = await supabase.from('services').select('*').order('display_order')
  if (error) throw error
  return data ?? []
}

export async function listActiveServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order')
  if (error) throw error
  return data ?? []
}

export async function createService(input: ServiceInput): Promise<void> {
  const { error } = await supabase.from('services').insert(input)
  if (error) throw error
}

export async function updateService(id: string, input: Partial<ServiceInput>): Promise<void> {
  const { error } = await supabase.from('services').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) throw error
}

/** 3000 -> "30 $", 1050 -> "10,50 $" (format québécois) */
export function formatPrice(cents: number): string {
  const value = cents / 100
  const text = Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ',')
  return `${text} $`
}

/** "30" | "10,50" -> cents */
export function dollarsToCents(input: string): number {
  const n = parseFloat(input.replace(',', '.'))
  return Math.round((Number.isFinite(n) ? n : 0) * 100)
}
