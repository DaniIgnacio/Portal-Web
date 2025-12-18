-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categoria (
  id_categoria uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  id_categoria_padre uuid,
  CONSTRAINT categoria_pkey PRIMARY KEY (id_categoria),
  CONSTRAINT fk_categoria_padre FOREIGN KEY (id_categoria_padre) REFERENCES public.categoria(id_categoria)
);
CREATE TABLE public.cliente_app (
  id_cliente uuid NOT NULL DEFAULT uuid_generate_v4(),
  auth_user_id uuid NOT NULL UNIQUE,
  nombre character varying,
  email character varying NOT NULL,
  telefono character varying,
  rut character varying,
  direccion text,
  fecha_registro timestamp with time zone NOT NULL DEFAULT now(),
  tipo_combustible text CHECK (tipo_combustible = ANY (ARRAY['93'::text, '95'::text, '97'::text, 'diesel'::text])),
  rendimiento_km_l numeric,
  latitud numeric,
  longitud numeric,
  CONSTRAINT cliente_app_pkey PRIMARY KEY (id_cliente),
  CONSTRAINT cliente_app_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.cotizacion (
  id_cotizacion uuid NOT NULL DEFAULT gen_random_uuid(),
  id_cliente uuid NOT NULL,
  id_ferreteria uuid NOT NULL,
  estado text NOT NULL DEFAULT 'vigente'::text CHECK (estado = ANY (ARRAY['borrador'::text, 'vigente'::text, 'expirada'::text, 'convertida'::text, 'cancelada'::text, 'confirmada'::text])),
  total_estimada numeric NOT NULL DEFAULT 0,
  expires_at timestamp with time zone NOT NULL,
  meta jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  subtotal_productos numeric,
  costo_viaje numeric,
  costo_total numeric,
  distancia_km numeric,
  duracion_min numeric,
  id_ferreteria_recomendada uuid,
  detalle_costos jsonb,
  CONSTRAINT cotizacion_pkey PRIMARY KEY (id_cotizacion),
  CONSTRAINT cotizacion_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cliente_app(id_cliente),
  CONSTRAINT cotizacion_id_ferreteria_fkey FOREIGN KEY (id_ferreteria) REFERENCES public.ferreteria(id_ferreteria),
  CONSTRAINT cotizacion_id_ferreteria_recomendada_fkey FOREIGN KEY (id_ferreteria_recomendada) REFERENCES public.ferreteria(id_ferreteria)
);
CREATE TABLE public.cotizacion_detalle (
  id_cotizacion_detalle uuid NOT NULL DEFAULT gen_random_uuid(),
  id_cotizacion uuid NOT NULL,
  id_producto uuid NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario_snapshot numeric NOT NULL,
  nombre_producto_snapshot text NOT NULL,
  subtotal_snapshot numeric DEFAULT ((cantidad)::numeric * precio_unitario_snapshot),
  meta jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cotizacion_detalle_pkey PRIMARY KEY (id_cotizacion_detalle),
  CONSTRAINT cotizacion_detalle_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizacion(id_cotizacion),
  CONSTRAINT cotizacion_detalle_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto)
);
CREATE TABLE public.detalle_pedido (
  id_detalle_pedido uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_pedido uuid NOT NULL,
  id_producto uuid NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario_compra integer CHECK (precio_unitario_compra >= 0),
  precio_unitario_venta integer NOT NULL DEFAULT 0,
  CONSTRAINT detalle_pedido_pkey PRIMARY KEY (id_detalle_pedido),
  CONSTRAINT fk_detalle_pedido_pedido FOREIGN KEY (id_pedido) REFERENCES public.pedido(id_pedido),
  CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto)
);
CREATE TABLE public.ferreteria (
  id_ferreteria uuid NOT NULL DEFAULT uuid_generate_v4(),
  rut character varying NOT NULL UNIQUE,
  razon_social character varying NOT NULL,
  direccion character varying NOT NULL,
  latitud numeric,
  longitud numeric,
  telefono character varying,
  api_key character varying NOT NULL UNIQUE,
  rating_avg numeric,
  horario jsonb,
  descripcion text,
  rating_count integer DEFAULT 0,
  CONSTRAINT ferreteria_pkey PRIMARY KEY (id_ferreteria)
);
CREATE TABLE public.ferreteria_subscription (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ferreteria_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text NOT NULL,
  starts_at timestamp without time zone,
  ends_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT ferreteria_subscription_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pagos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_pedido uuid NOT NULL,
  gateway text NOT NULL,
  gateway_payment_id text NOT NULL,
  status text NOT NULL,
  raw jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  amount numeric,
  currency text,
  gateway_ref text,
  CONSTRAINT pagos_pkey PRIMARY KEY (id),
  CONSTRAINT pagos_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedido(id_pedido)
);
CREATE TABLE public.pedido (
  id_pedido uuid NOT NULL DEFAULT gen_random_uuid(),
  id_ferreteria uuid NOT NULL,
  fecha_pedido timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  estado text NOT NULL DEFAULT 'pendiente'::character varying,
  monto_total integer NOT NULL CHECK (monto_total >= 0),
  id_cliente uuid,
  gateway text,
  gateway_ref text,
  paid_at timestamp with time zone,
  ticket_code text UNIQUE,
  ticket_code_generated_at timestamp with time zone,
  CONSTRAINT pedido_pkey PRIMARY KEY (id_pedido),
  CONSTRAINT fk_pedido_ferreteria FOREIGN KEY (id_ferreteria) REFERENCES public.ferreteria(id_ferreteria),
  CONSTRAINT pedido_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.cliente_app(id_cliente)
);
CREATE TABLE public.producto (
  id_producto uuid NOT NULL,
  id_ferreteria uuid,
  id_categoria uuid,
  nombre character varying,
  descripcion text,
  precio integer,
  stock integer,
  sku character varying,
  imagen_url text,
  imagenes ARRAY,
  CONSTRAINT producto_pkey PRIMARY KEY (id_producto),
  CONSTRAINT fk_producto_ferreteria FOREIGN KEY (id_ferreteria) REFERENCES public.ferreteria(id_ferreteria),
  CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria) REFERENCES public.categoria(id_categoria)
);
CREATE TABLE public.resenas (
  id_resena uuid NOT NULL,
  id_ferreteria uuid,
  id_usuario uuid,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comentario text,
  fecha timestamp without time zone DEFAULT now(),
  CONSTRAINT resenas_pkey PRIMARY KEY (id_resena),
  CONSTRAINT resenas_id_ferreteria_fkey FOREIGN KEY (id_ferreteria) REFERENCES public.ferreteria(id_ferreteria)
);
CREATE TABLE public.subscription_backup_corrupta (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ferreteria_id uuid NOT NULL UNIQUE,
  plan_id uuid NOT NULL,
  status text NOT NULL,
  starts_at date NOT NULL,
  ends_at date NOT NULL,
  renews_at date,
  auto_renew boolean NOT NULL DEFAULT true,
  last_payment_at date,
  debt_amount numeric NOT NULL DEFAULT 0,
  suspension_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_trial boolean NOT NULL DEFAULT false,
  CONSTRAINT subscription_backup_corrupta_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_ferreteria_id_fkey FOREIGN KEY (ferreteria_id) REFERENCES public.ferreteria(id_ferreteria),
  CONSTRAINT subscription_plan_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plan(id)
);
CREATE TABLE public.subscription_plan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  monthly_price numeric NOT NULL CHECK (monthly_price >= 0::numeric),
  grace_days integer NOT NULL DEFAULT 5,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscription_plan_pkey PRIMARY KEY (id)
);
CREATE TABLE public.usuario (
  id_usuario uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL,
  email character varying NOT NULL,
  contraseña_hash character varying,
  fecha_registro timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  id_ferreteria uuid,
  rut character varying,
  rol text DEFAULT 'cliente'::text CHECK (rol = ANY (ARRAY['cliente'::text, 'ferreteria'::text, 'ambos'::text, 'admin'::text])),
  CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario),
  CONSTRAINT fk_usuario_ferreteria FOREIGN KEY (id_ferreteria) REFERENCES public.ferreteria(id_ferreteria)
);
CREATE TABLE public.vendor_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ferreteria_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['reclamo'::text, 'atraso_entrega'::text, 'cancelacion'::text])),
  weight integer NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vendor_events_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_events_ferreteria_id_fkey FOREIGN KEY (ferreteria_id) REFERENCES public.ferreteria(id_ferreteria)
);
CREATE TABLE public.vendor_reputation (
  ferreteria_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 100,
  complaints_count integer NOT NULL DEFAULT 0,
  late_deliveries_count integer NOT NULL DEFAULT 0,
  cancellations_count integer NOT NULL DEFAULT 0,
  window_days integer NOT NULL DEFAULT 90,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vendor_reputation_pkey PRIMARY KEY (ferreteria_id),
  CONSTRAINT vendor_reputation_ferreteria_id_fkey FOREIGN KEY (ferreteria_id) REFERENCES public.ferreteria(id_ferreteria)
);