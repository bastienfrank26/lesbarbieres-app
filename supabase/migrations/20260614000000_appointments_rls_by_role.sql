-- =====================================================================
-- RLS sur `appointments` selon le rôle (v3, point 2c/2e) :
--   • un administrateur a accès à tous les rendez-vous ;
--   • un barbier n'accède (lecture, création, modification, suppression)
--     qu'à SES propres rendez-vous.
--
-- Les réservations en ligne passent par les fonctions SECURITY DEFINER
-- (`book_appointment`, `available_slots`) : elles contournent la RLS et
-- continuent donc de fonctionner pour les visiteurs anonymes.
-- =====================================================================

-- On remplace la policy permissive "tout authentifié = accès complet".
drop policy if exists "authenticated full appointments" on appointments;

-- Identifiants des barbiers rattachés au compte connecté.
-- (Plusieurs policies permissives sont combinées en OU : l'admin passe par
--  sa policy, le barbier par les siennes.)

-- 1) Administrateur : accès complet.
create policy "admin all appointments"
  on appointments for all to authenticated
  using (public.current_barber_role() = 'admin')
  with check (public.current_barber_role() = 'admin');

-- 2) Barbier : lecture de ses propres rendez-vous.
create policy "barber select own appointments"
  on appointments for select to authenticated
  using (barber_id in (select id from barbers where user_id = auth.uid()));

-- 3) Barbier : création d'un rendez-vous pour lui-même.
create policy "barber insert own appointments"
  on appointments for insert to authenticated
  with check (barber_id in (select id from barbers where user_id = auth.uid()));

-- 4) Barbier : modification de ses propres rendez-vous.
create policy "barber update own appointments"
  on appointments for update to authenticated
  using (barber_id in (select id from barbers where user_id = auth.uid()))
  with check (barber_id in (select id from barbers where user_id = auth.uid()));

-- 5) Barbier : suppression de ses propres rendez-vous.
create policy "barber delete own appointments"
  on appointments for delete to authenticated
  using (barber_id in (select id from barbers where user_id = auth.uid()));
