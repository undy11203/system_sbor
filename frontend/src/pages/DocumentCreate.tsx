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
  Grid,
  TextField,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  Check as CheckIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import DynamicForm from '../components/DynamicForm';
import { DOCUMENT_TYPE_CONFIGS, MOCK_QA_RESPONSES, mockDelay } from '../api/mockData';
import type { DocumentType } from '../types';

const steps = ['Выбор типа документа', 'Заполнение формы', 'Предпросмотр'];

interface QAItem {
  q: string;
  a: string;
}

const DocumentCreate: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [formData, setFormData] = useState<Record<string, unknown> | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Q/A состояния
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<QAItem[]>([]);
  const [isQALoading, setIsQALoading] = useState(false);

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
    setActiveStep(2);
  };

  const handleSaveDraft = (data: Record<string, unknown>) => {
    console.log('Сохранение черновика:', data);
    alert('Черновик сохранён!');
  };

  const handleFinalSubmit = () => {
    console.log('Отправка документа:', { type: selectedType, data: formData });
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate('/dashboard');
  };

  // Q/A обработчик
  const handleQASubmit = async (question: string) => {
    if (!question.trim()) return;
    
    setIsQALoading(true);
    await mockDelay(800);
    
    const lowerQ = question.toLowerCase();
    let answer: string;
    
    if (lowerQ.includes('тема') || lowerQ.includes('формат')) {
      answer = MOCK_QA_RESPONSES['формат темы'].answer;
    } else if (lowerQ.includes('актуальность')) {
      answer = MOCK_QA_RESPONSES['актуальность'].answer;
    } else {
      answer = MOCK_QA_RESPONSES.default.answer;
    }
    
    setQaHistory([...qaHistory, { q: question, a: answer }]);
    setQaQuestion('');
    setIsQALoading(false);
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
          <Grid container spacing={3}>
            {/* Левая колонка - форма */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h6" gutterBottom>Заполнение формы</Typography>
              <DynamicForm
                config={config}
                onSubmit={handleFormSubmit}
                onSaveDraft={handleSaveDraft}
                initialData={formData || undefined}
              />
            </Grid>

            {/* Правая колонка - Q/A помощник */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 2, position: 'sticky', top: 88 }}>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                  ❓ Помощник
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Задайте вопрос по оформлению
                </Typography>
                
                {/* Быстрые вопросы */}
                <Box mb={2}>
                  {['Как оформить тему?', 'Что в актуальности?', 'Пример плана'].map((q, idx) => (
                    <Chip
                      key={idx}
                      label={q}
                      size="small"
                      onClick={() => handleQASubmit(q)}
                      clickable
                      sx={{ mb: 0.5, mr: 0.5 }}
                    />
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* История Q/A */}
                <Box sx={{ maxHeight: 250, overflow: 'auto', mb: 2, bgcolor: 'grey.50', borderRadius: 1, p: 1 }}>
                  {qaHistory.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center">
                      👋 Здравствуйте! Задайте вопрос по оформлению документа.
                    </Typography>
                  ) : (
                    qaHistory.map((item: QAItem, idx: number) => (
                      <Box key={idx} mb={1}>
                        <Typography variant="caption" color="primary" display="block">
                          Вы: {item.q}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          🤖 {item.a}
                        </Typography>
                        {idx < qaHistory.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    ))
                  )}
                </Box>

                {/* Поле ввода вопроса */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ваш вопрос..."
                  value={qaQuestion}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQaQuestion(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' && qaQuestion.trim()) {
                      e.preventDefault();
                      handleQASubmit(qaQuestion);
                    }
                  }}
                  disabled={isQALoading}
                  InputProps={{
                    endAdornment: (
                      <IconButton 
                        size="small" 
                        onClick={() => handleQASubmit(qaQuestion)}
                        disabled={!qaQuestion.trim() || isQALoading}
                      >
                        {isQALoading ? '...' : <SendIcon fontSize="small" />}
                      </IconButton>
                    ),
                  }}
                />
              </Paper>
            </Grid>
          </Grid>
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
      {activeStep !== 1 && (
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