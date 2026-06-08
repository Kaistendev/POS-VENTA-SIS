const MIN_LENGTH = 8;
const UPPERCASE_RE = /[A-Z]/;
const LOWERCASE_RE = /[a-z]/;
const NUMBER_RE = /[0-9]/;
const SPECIAL_RE = /[!@#$%^&*()_\-+=<>?/{}~|]/;

const PASSWORD_ERROR = `La contraseña debe tener al menos ${MIN_LENGTH} caracteres, una mayúscula, un número y un carácter especial`;

interface PasswordValidation {
  valid: boolean;
  error: string;
}

export function validatePassword(password: string): PasswordValidation {
  if (password.length < MIN_LENGTH) {
    return { valid: false, error: PASSWORD_ERROR };
  }
  if (!UPPERCASE_RE.test(password)) {
    return { valid: false, error: PASSWORD_ERROR };
  }
  if (!LOWERCASE_RE.test(password)) {
    return { valid: false, error: PASSWORD_ERROR };
  }
  if (!NUMBER_RE.test(password)) {
    return { valid: false, error: PASSWORD_ERROR };
  }
  if (!SPECIAL_RE.test(password)) {
    return { valid: false, error: PASSWORD_ERROR };
  }
  return { valid: true, error: '' };
}
