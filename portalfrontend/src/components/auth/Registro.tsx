// src/pages/Registro.tsx
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient'; // Asegúrate de tener este archivo
import { Link, useNavigate } from 'react-router-dom'; // Importa useNavigate para redireccionar
import './AuthForm.css'; // <-- Importar el CSS de estilos

const Registro = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate(); // Hook para redireccionar

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      alert(`Error de registro: ${error.message}`);
    } else {
      alert('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.');
      navigate('/login'); // Redirigir al login después del registro
    }
    setLoading(false);
  };

  return (
    <div className="auth-container"> {/* Contenedor principal para centrar */}
      <div className="auth-card"> {/* La tarjeta blanca */}
        <div className="auth-header">
          <h2>Crea tu Cuenta</h2>
          <p>Ingresa tus datos para registrarte.</p>
        </div>
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registro;