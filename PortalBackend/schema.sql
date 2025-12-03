/* CODIGO SQL DE LA BASE DE DATOS */

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
CREATE TABLE public.pagos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  id_pedido uuid NOT NULL,
  gateway text NOT NULL,
  gateway_payment_id text NOT NULL,
  status text NOT NULL,
  raw jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
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