-- ============================================
-- BEHAVIOR INCIDENT REPORTING SYSTEM
-- ============================================

-- Create incident categories enum-like table with standard values
CREATE TABLE public.behavior_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  incident_type TEXT NOT NULL, -- disruption, disrespect, safety_concern, physical_altercation, other
  location TEXT NOT NULL, -- classroom, hallway, cafeteria, playground, other
  severity TEXT NOT NULL DEFAULT 'minor', -- minor, major, safety
  description TEXT, -- Optional detailed description
  status TEXT NOT NULL DEFAULT 'reported', -- reported, parent_contacted, resolved
  parent_notified_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  notes TEXT, -- Staff notes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on behavior_incidents
ALTER TABLE public.behavior_incidents ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_behavior_incidents_updated_at
  BEFORE UPDATE ON public.behavior_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS: Staff can view incidents for their classroom students
CREATE POLICY "Staff can view incidents for own classroom students"
  ON public.behavior_incidents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = behavior_incidents.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- RLS: Staff can create incidents for their classroom students
CREATE POLICY "Staff can create incidents for own classroom students"
  ON public.behavior_incidents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = behavior_incidents.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- RLS: Staff can update incidents they created or for their classroom
CREATE POLICY "Staff can update incidents for own classroom"
  ON public.behavior_incidents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = behavior_incidents.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- RLS: Staff can delete incidents for their classroom
CREATE POLICY "Staff can delete incidents for own classroom"
  ON public.behavior_incidents FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = behavior_incidents.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- ============================================
-- SCHOOL STORE SYSTEM
-- ============================================

-- Store Items table
CREATE TABLE public.store_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎁',
  point_cost INTEGER NOT NULL,
  description TEXT,
  is_digital BOOLEAN NOT NULL DEFAULT false, -- Digital items have unlimited stock
  stock_quantity INTEGER, -- NULL for unlimited digital items
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on store_items
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_store_items_updated_at
  BEFORE UPDATE ON public.store_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS: Teachers can view their store items
CREATE POLICY "Teachers can view own store items"
  ON public.store_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = store_items.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- RLS: Teachers can create store items
CREATE POLICY "Teachers can create store items"
  ON public.store_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = store_items.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- RLS: Teachers can update store items
CREATE POLICY "Teachers can update store items"
  ON public.store_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = store_items.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- RLS: Teachers can delete store items
CREATE POLICY "Teachers can delete store items"
  ON public.store_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = store_items.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- Store Orders table
CREATE TABLE public.store_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, fulfilled, cancelled
  delivery_method TEXT NOT NULL DEFAULT 'homeroom', -- homeroom, office, classroom
  notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  fulfilled_by UUID,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on store_orders
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_store_orders_updated_at
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS: Teachers can view orders for their classrooms
CREATE POLICY "Teachers can view orders for own classrooms"
  ON public.store_orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = store_orders.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- RLS: Teachers can create orders (for testing/admin)
CREATE POLICY "Teachers can create orders"
  ON public.store_orders FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = store_orders.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- RLS: Teachers can update orders
CREATE POLICY "Teachers can update orders"
  ON public.store_orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = store_orders.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- Order Items table (line items for each order)
CREATE TABLE public.store_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  point_cost INTEGER NOT NULL, -- Store cost at time of order
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on store_order_items
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

-- RLS: Teachers can view order items for their classroom orders
CREATE POLICY "Teachers can view order items for own classroom orders"
  ON public.store_order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.store_orders o
    JOIN public.classrooms c ON o.classroom_id = c.id
    WHERE o.id = store_order_items.order_id
    AND c.teacher_id = auth.uid()
  ));

-- RLS: Teachers can create order items
CREATE POLICY "Teachers can create order items"
  ON public.store_order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.store_orders o
    JOIN public.classrooms c ON o.classroom_id = c.id
    WHERE o.id = store_order_items.order_id
    AND c.teacher_id = auth.uid()
  ));

-- Store Settings table (delivery schedule, cutoff times)
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL UNIQUE REFERENCES public.classrooms(id) ON DELETE CASCADE,
  delivery_days TEXT[] NOT NULL DEFAULT ARRAY['monday', 'wednesday', 'friday'],
  order_cutoff_time TIME NOT NULL DEFAULT '15:00:00', -- 3pm default
  delivery_window TEXT DEFAULT 'advisory', -- advisory, lunch, end_of_day
  is_store_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on store_settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS: Teachers can view their store settings
CREATE POLICY "Teachers can view own store settings"
  ON public.store_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = store_settings.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- RLS: Teachers can create store settings
CREATE POLICY "Teachers can create store settings"
  ON public.store_settings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = store_settings.classroom_id
    AND c.teacher_id = auth.uid()
  ));

-- RLS: Teachers can update store settings
CREATE POLICY "Teachers can update store settings"
  ON public.store_settings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.classrooms c
    WHERE c.id = store_settings.classroom_id
    AND c.teacher_id = auth.uid()
  ));