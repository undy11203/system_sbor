import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Lightbulb as TipIcon,
} from '@mui/icons-material';
import { MOCK_QA_RESPONSES, mockDelay } from '../api/mockData';
import type { QAResponse } from '../types';

interface QADialogProps {
  open: boolean;
  onClose: () => void;
  context?: string;
  documentType?: string;
}

const QADialog: React.FC<QADialogProps> = ({
  open,
  onClose,
  context,
  documentType,
}) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: QAResponse }[]>([]);

  // Быстрые подсказки
  const quickQuestions = [
    'Как правильно оформить тему ВКР?',
    'Что писать в актуальности?',
    'Какие требования к плану работы?',
    'Формат отзыва руководителя',
  ];

  const handleSend = async () => {
    if (!question.trim()) return;

    setIsLoading(true);

    // Имитация API запроса
    await mockDelay(1000);

    // Простой поиск по ключевым словам
    const lowerQ = question.toLowerCase();
    let response: QAResponse;

    if (lowerQ.includes('тема') || lowerQ.includes('формат')) {
      response = MOCK_QA_RESPONSES['формат темы'];
    } else if (lowerQ.includes('актуальность')) {
      response = MOCK_QA_RESPONSES['актуальность'];
    } else {
      response = MOCK_QA_RESPONSES.default;
    }

    setHistory([...history, { q: question, a: response }]);
    setQuestion('');
    setIsLoading(false);
  };

  const handleQuickQuestion = (q: string) => {
    setQuestion(q);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <BotIcon color="primary" />
          <Typography variant="h6">Помощник по оформлению документов</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Контекст */}
        {context && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              Контекст: {context}
            </Typography>
          </Paper>
        )}

        {/* Быстрые вопросы */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            <TipIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
            Популярные вопросы:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {quickQuestions.map((q, idx) => (
              <Chip
                key={idx}
                label={q}
                onClick={() => handleQuickQuestion(q)}
                clickable
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* История сообщений */}
        <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
          {history.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="👋 Здравствуйте! Я помогу вам с оформлением документов ВКР."
                secondary="Задайте вопрос или выберите из списка популярных."
              />
            </ListItem>
          ) : (
            history.map((item, idx) => (
              <Box key={idx}>
                <ListItem alignItems="flex-start">
                  <PersonIcon color="primary" sx={{ mr: 1, mt: 0.5 }} />
                  <ListItemText primary={item.q} />
                </ListItem>
                <ListItem alignItems="flex-start">
                  <BotIcon color="secondary" sx={{ mr: 1, mt: 0.5 }} />
                  <ListItemText
                    primary={item.a.answer}
                    secondary={
                      item.a.suggestions && (
                        <Box mt={1}>
                          <Typography variant="caption" color="text.secondary">
                            Рекомендации:
                          </Typography>
                          <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
                            {item.a.suggestions.map((s, i) => (
                              <li key={i}>
                                <Typography variant="caption">{s}</Typography>
                              </li>
                            ))}
                          </ul>
                        </Box>
                      )
                    }
                  />
                </ListItem>
                {idx < history.length - 1 && <Divider component="li" />}
              </Box>
            ))
          )}
        </List>

        {/* Поле ввода */}
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Введите ваш вопрос..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={isLoading || !question.trim()}
            sx={{ minWidth: 100 }}
          >
            {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QADialog;