import { useCallback } from 'react';
import { AnySchema } from 'yup';

const useYupValidationResolver = <T>(validationSchema: AnySchema) =>
  useCallback(
    async (data: T) => {
      try {
        const values = await validationSchema?.validate(data, {
          abortEarly: false,
        });

        return {
          values,
          errors: {},
        };
      } catch (errors: any) {
        return {
          values: {},
          errors: errors?.inner?.reduce((allErrors, currentError) => {
            return {
              ...allErrors,
              [currentError.path]: {
                type: currentError.type ?? 'validation',
                message: currentError.message,
                messages: {
                  ...allErrors[currentError.path]?.messages,
                  [currentError.message]: {
                    type: currentError.type ?? 'validation',
                    field: currentError.path,
                  },
                },
              },
            };
          }, {}),
        };
      }
    },
    [validationSchema]
  );

export default useYupValidationResolver;
