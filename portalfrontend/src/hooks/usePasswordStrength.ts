import { useState, useEffect } from 'react';

interface PasswordStrengthResult {
  score: number;
  strength: 'Débil' | 'Media' | 'Fuerte';
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  isLongEnough: boolean;
}

const usePasswordStrength = (password: string): PasswordStrengthResult => {
  const [strengthResult, setStrengthResult] = useState<PasswordStrengthResult>({
    score: 0,
    strength: 'Débil',
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSymbol: false,
    isLongEnough: false,
  });

  useEffect(() => {
    const getStrength = (pwd: string): PasswordStrengthResult => {
      let score = 0;
      const checks = {
        hasUpperCase: /[A-Z]/.test(pwd),
        hasLowerCase: /[a-z]/.test(pwd),
        hasNumber: /[0-9]/.test(pwd),
        hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
        isLongEnough: pwd.length >= 8,
      };

      if (checks.isLongEnough) score += 1; // Longitud mínima de 8 caracteres
      if (checks.hasUpperCase) score += 1;
      if (checks.hasLowerCase) score += 1;
      if (checks.hasNumber) score += 1;
      if (checks.hasSymbol) score += 1;

      let strength: 'Débil' | 'Media' | 'Fuerte' = 'Débil';
      if (pwd.length === 0) {
        strength = 'Débil'; // Contraseña vacía es débil
        score = 0; // Resetear score si está vacía
      } else if (score >= 4) {
        strength = 'Fuerte';
      } else if (score >= 2) {
        strength = 'Media';
      }

      return { ...checks, score, strength };
    };

    setStrengthResult(getStrength(password));
  }, [password]);

  return strengthResult;
};

export default usePasswordStrength;






