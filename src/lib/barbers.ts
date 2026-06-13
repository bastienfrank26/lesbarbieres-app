import { supabase } from './supabase'

export type Barber = {
  id: string
  name: string
  color: string
  is_active: boolean
  created_at: string
}

export type BarberInput = Omit<Barber, 'id' | 'created_at'>

export async function listBarbers(): Promise<Barber[]> {
  const { data, error } = await supabase.from('barbers').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export async function listActiveBarbers(): Promise<Barber[]> {
  const { data, error } = await supabase.from('barbers').select('*').eq('is_active', true).order('name')
  if (error) throw error
  return data ?? []
}

export async function createBarber(input: BarberInput): Promise<void> {
  const { error } = await supabase.from('barbers').insert(input)
  if (error) throw error
}

export async function updateBarber(id: string, input: Partial<BarberInput>): Promise<void> {
  const { error } = await supabase.from('barbers').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteBarber(id: string): Promise<void> {
  const { error } = await supabase.from('barbers').delete().eq('id', id)
  if (error) throw error
}
