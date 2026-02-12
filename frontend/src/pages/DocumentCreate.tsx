import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import DynamicForm from '../components/DynamicForm';
import QADialog from '../components/QADialog';
import { DOCUMENT_TYPE_CONFIGS } from '../api/mockData';
import type { DocumentType } from '../types';

const steps = ['Выбор типа документа', 'Заполнение формы', 'Предпросмотр'];

const DocumentCreate: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [formData, setFormData] = useState<Record<string, unknown> | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showQA, setShowQA] = useState(false);

  const documentTypes = [
    { value: 'application', label: 'Заявление на тему ВКР' },
    { value: 'plan', label: 'Календарный план работы' },
    { value: 'review', label: 'Отзыв руководителя' },
  ];

  const handleNext = () => {
    if (activeStep === 0 && !selectedType) {
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleFormSubmit = (data: Record<string, unknown>) => {
    setFormData(data);
    setActiveStep(2); // Переход к предпросмотру
  };

  const handleSaveDraft = (data: Record<string, unknown>) => {
    // Имитация сохранения черновика
    console.log('Сохранение черновика:', data);
    alert('Черновик сохранён!');
  };

  const handleFinalSubmit = () => {
    // Имитация отправки документа
    console.log('Отправка документа:', { type: selectedType, data: formData });
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate('/dashboard');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Выберите тип документа
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Тип документа</InputLabel>
              <Select
                value={selectedType}
                label="Тип документа"
                onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              >
                {documentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedType && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  {DOCUMENT_TYPE_CONFIGS[selectedType]?.name}
                </Typography>
                <Typography variant="body2">
                  {DOCUMENT_TYPE_CONFIGS[selectedType]?.description}
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 1:
        if (!selectedType) return null;
        const config = DOCUMENT_TYPE_CONFIGS[selectedType];
        if (!config) return null;

        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Заполнение формы</Typography>
              <Button variant="outlined" onClick={() => setShowQA(true)}>
                ❓ Помощь
              </Button>
            </Box>
            <DynamicForm
              config={config}
              onSubmit={handleFormSubmit}
              onSaveDraft={handleSaveDraft}
              initialData={formData || undefined}
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Предпросмотр документа
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="h5" gutterBottom align="center">
                {DOCUMENT_TYPE_CONFIGS[selectedType]?.name}
              </Typography>
              <Box mt={2}>
                {formData && Object.entries(formData).map(([key, value]) => (
                  <Box key={key} mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {key}:
                    </Typography>
                    <Typography variant="body1">
                      {typeof value === 'boolean' 
                        ? (value ? 'Да' : 'Нет')
                        : String(value) || '-'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            <Alert severity="success" sx={{ mb: 2 }}>
              Документ готов к отправке. После отправки он будет направлен руководителю на проверку.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Создание документа
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3, mb: 3 }}>
        {renderStepContent()}
      </Paper>

      {/* Навигация */}
      {activeStep !== 1 && ( // На шаге формы свои кнопки
        <Box display="flex" justifyContent="space-between">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<BackIcon />}
          >
            Назад
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="success"
              onClick={handleFinalSubmit}
              startIcon={<CheckIcon />}
            >
              Отправить на проверку
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NextIcon />}
              disabled={activeStep === 0 && !selectedType}
            >
              Далее
            </Button>
          )}
        </Box>
      )}

      {/* Q/A Диалог */}
      <QADialog
        open={showQA}
        onClose={() => setShowQA(false)}
        context={selectedType ? DOCUMENT_TYPE_CONFIGS[selectedType]?.name : undefined}
        documentType={selectedType || undefined}
      />

      {/* Успешное создание */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Документ успешно создан и отправлен на проверку!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentCreate;