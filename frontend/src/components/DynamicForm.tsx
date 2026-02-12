import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon, Send as SubmitIcon, Help as HelpIcon } from '@mui/icons-material';
import type { DocumentTypeConfig, FormField } from '../types';

interface DynamicFormProps {
  config: DocumentTypeConfig;
  onSubmit: (data: Record<string, unknown>) => void;
  onSaveDraft?: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown>;
}

// Генерация Zod схемы из конфигурации полей
const generateValidationSchema = (fields: FormField[]) => {
  const schema: Record<string, z.ZodType<unknown>> = {};
  
  fields.forEach((field) => {
    let fieldSchema: z.ZodType<unknown>;
    
    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email('Введите корректный email');
        break;
      case 'number':
        fieldSchema = z.coerce.number();
        if (field.validation?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min);
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max);
        }
        break;
      case 'checkbox':
        fieldSchema = z.boolean();
        break;
      case 'date':
        fieldSchema = z.coerce.date();
        break;
      default:
        fieldSchema = z.string();
        if (field.validation?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).min(
            field.validation.min,
            field.validation.message || `Минимум ${field.validation.min} символов`
          );
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).max(
            field.validation.max,
            `Максимум ${field.validation.max} символов`
          );
        }
    }
    
    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }
    
    schema[field.name] = fieldSchema;
  });
  
  return z.object(schema);
};

const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  onSubmit,
  onSaveDraft,
  initialData,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const validationSchema = generateValidationSchema(config.fields);
  type FormData = z.infer<typeof validationSchema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: initialData as FormData,
  });

  const watchedValues = watch();

  // Рендер поля в зависимости от типа
  const renderField = (field: FormField) => {
    const error = errors[field.name];
    const errorMessage = error?.message as string | undefined;

    switch (field.type) {
      case 'textarea':
        return (
          <TextField
            key={field.name}
            fullWidth
            multiline
            rows={4}
            label={field.label + (field.required ? ' *' : '')}
            placeholder={field.placeholder}
            error={!!error}
            helperText={errorMessage || `${(watchedValues[field.name] as string)?.length || 0} символов`}
            {...register(field.name)}
            sx={{ mb: 2 }}
          />
        );

      case 'select':
        return (
          <FormControl key={field.name} fullWidth error={!!error} sx={{ mb: 2 }}>
            <InputLabel>{field.label + (field.required ? ' *' : '')}</InputLabel>
            <Select label={field.label} defaultValue="" {...register(field.name)}>
              <MenuItem value=""><em>Не выбрано</em></MenuItem>
              {field.options?.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{errorMessage}</FormHelperText>}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            key={field.name}
            control={<Checkbox {...register(field.name)} />}
            label={field.label + (field.required ? ' *' : '')}
            sx={{ mb: 2, display: 'block' }}
          />
        );

      case 'date':
        return (
          <TextField
            key={field.name}
            fullWidth
            type="date"
            label={field.label + (field.required ? ' *' : '')}
            error={!!error}
            helperText={errorMessage}
            {...register(field.name)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        );

      case 'number':
        return (
          <TextField
            key={field.name}
            fullWidth
            type="number"
            label={field.label + (field.required ? ' *' : '')}
            placeholder={field.placeholder}
            error={!!error}
            helperText={errorMessage}
            {...register(field.name, { valueAsNumber: true })}
            sx={{ mb: 2 }}
          />
        );

      default:
        return (
          <TextField
            key={field.name}
            fullWidth
            label={field.label + (field.required ? ' *' : '')}
            placeholder={field.placeholder}
            error={!!error}
            helperText={errorMessage}
            {...register(field.name)}
            sx={{ mb: 2 }}
          />
        );
    }
  };

  // Проверка логических зависимостей (имитация reasoner)
  const checkLogicalDependencies = (data: FormData): string[] => {
    const warnings: string[] = [];
    
    // Пример проверки: если тема ВКР не содержит глагола
    if (data.topic && typeof data.topic === 'string') {
      const verbs = ['разработка', 'исследование', 'анализ', 'создание', 'проектирование', 'моделирование'];
      const hasVerb = verbs.some(verb => data.topic!.toString().toLowerCase().includes(verb));
      if (!hasVerb) {
        warnings.push('⚠️ Тема ВКР должна начинаться с глагола (Разработка, Исследование, Анализ и т.д.)');
      }
    }
    
    // Проверка дат
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate as string);
      const end = new Date(data.endDate as string);
      if (end <= start) {
        warnings.push('⚠️ Дата окончания должна быть позже даты начала');
      }
    }
    
    return warnings;
  };

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    // Имитация задержки
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Проверка логических зависимостей
    const warnings = checkLogicalDependencies(data);
    setValidationWarnings(warnings);
    
    if (warnings.length === 0) {
      onSubmit(data);
    }
    
    setIsSubmitting(false);
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(watchedValues as Record<string, unknown>);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {config.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {config.description}
      </Typography>

      {/* Предупреждения от reasoner */}
      {validationWarnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Обнаружены потенциальные проблемы:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {validationWarnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {config.fields.map(renderField)}

        <Box display="flex" gap={2} mt={3}>
          {onSaveDraft && (
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              Сохранить черновик
            </Button>
          )}
          
          <Button
            type="submit"
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SubmitIcon />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Отправка...' : 'Отправить на проверку'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default DynamicForm;