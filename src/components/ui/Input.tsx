import { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'input' | 'textarea';
}

type InputElementProps = InputHTMLAttributes<HTMLInputElement>;
type TextareaElementProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

type InputProps = BaseInputProps & 
  (
    | ({ variant?: 'input' } & InputElementProps)
    | ({ variant: 'textarea' } & TextareaElementProps)
  );

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, error, helperText, variant = 'input', className, ...props }, ref) => {
    const baseStyles =
      'block w-full rounded-md border-0 py-1.5 text-[#342e29] shadow-sm ring-1 ring-inset placeholder:text-[#51514d] focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6';

    const stateStyles = error
      ? 'ring-red-300 focus:ring-red-500'
      : 'ring-[#e7e4df] focus:ring-[#344736]';

    const inputElement =
      variant === 'textarea' ? (
        <textarea
          ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
          className={twMerge(baseStyles, stateStyles, 'min-h-[100px] resize-y', className)}
          {...(props as TextareaElementProps)}
        />
      ) : (
        <input
          ref={ref as React.ForwardedRef<HTMLInputElement>}
          className={twMerge(baseStyles, stateStyles, className)}
          {...(props as InputElementProps)}
        />
      );

    return (
      <div>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium leading-6 text-[#342e29] mb-1"
          >
            {label}
          </label>
        )}
        {inputElement}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-[#51514d]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
