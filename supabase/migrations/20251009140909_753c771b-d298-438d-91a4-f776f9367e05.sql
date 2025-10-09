-- Criar policies para schedules
CREATE POLICY "Allow all access to schedules"
ON schedules FOR ALL
USING (true)
WITH CHECK (true);

-- Criar policies para service_assignments
CREATE POLICY "Allow all access to service_assignments"
ON service_assignments FOR ALL
USING (true)
WITH CHECK (true);

-- Criar policies para schedule_assignments  
CREATE POLICY "Allow all access to schedule_assignments"
ON schedule_assignments FOR ALL
USING (true)
WITH CHECK (true);

-- Criar policies para transactions
CREATE POLICY "Allow all access to transactions"
ON transactions FOR ALL
USING (true)
WITH CHECK (true);