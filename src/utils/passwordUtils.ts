export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  message?: string;
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const isValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar;

  let message = '';
  if (!hasMinLength) message = 'Le mot de passe doit contenir au moins 8 caractères.';
  else if (!hasUppercase) message = 'Le mot de passe doit contenir au moins une lettre majuscule (A-Z).';
  else if (!hasNumber) message = 'Le mot de passe doit contenir au moins un chiffre (0-9).';
  else if (!hasSpecialChar) message = 'Le mot de passe doit contenir au moins un caractère spécial (@, #, $, %, !, etc.).';

  return {
    isValid,
    hasMinLength,
    hasUppercase,
    hasNumber,
    hasSpecialChar,
    message
  };
};
