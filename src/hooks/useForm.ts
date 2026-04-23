import { useState, useCallback } from 'react';
import { ZodSchema, ZodError } from 'zod';

export interface UseFormProps<T> {
  schema: ZodSchema<T>;
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: any) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  validateField: (field: keyof T) => boolean;
  validateAll: () => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
}

export function useForm<T extends Record<string, any>>({
  schema,
  initialValues,
  onSubmit,
}: UseFormProps<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validateField = useCallback(
    (field: keyof T): boolean => {
      try {
        const fieldSchema = schema.shape[field as string];
        if (!fieldSchema) return true;

        fieldSchema.parse(values[field]);
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        return true;
      } catch (error) {
        if (error instanceof ZodError) {
          const message = error.errors[0]?.message || 'Campo inválido';
          setErrors((prev) => ({ ...prev, [field]: message }));
          return false;
        }
        return false;
      }
    },
    [schema, values],
  );

  const validateAll = useCallback((): boolean => {
    try {
      schema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof T;
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
        return false;
      }
      return false;
    }
  }, [schema, values]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      const isValid = validateAll();
      if (!isValid) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        if (error instanceof Error) {
          setErrors({ _form: error.message } as any);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateAll, onSubmit],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setErrors,
    validateField,
    validateAll,
    handleSubmit,
    reset,
  };
}
