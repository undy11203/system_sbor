import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Send as SendIcon,
  ExpandMore as ExpandIcon,
  Help as HelpIcon,
  School as SchoolIcon,
  Description as DocIcon,
} from '@mui/icons-material';
import { MOCK_QA_RESPONSES, mockDelay } from '../api/mockData';
import type { QAResponse } from '../types';

const FAQ_TOPICS = [
  {
    category: 'Тема ВКР',
    icon: <SchoolIcon />,
    questions: [
      { q: 'Как правильно сформулировать тему ВКР?', a: 'Тема должна начинаться с глагола, содержать объект и предмет исследования. Например: "Разработка системы управления базами данных для автоматизации учёта студентов"' },
      { q: 'Какая длина темы допустима?', a: 'Тема должна содержать от 10 до 200 символов. Оптимально - 50-100 символов.' },
      { q: 'Можно ли менять тему после утверждения?', a: 'Да, но необходимо подать новое заявление и получить повторное согласование руководителя и кафедры.' },
    ],
  },
  {
    category: 'Оформление документов',
    icon: <DocIcon />,
    questions: [
      { q: 'Какие шрифты использовать?', a: 'Основной текст - Times New Roman 14пт, межстрочный интервал 1.5. Заголовки - 16пт, полужирный.' },
      { q: 'Какие поля должны быть в документе?', a: 'Левое - 30мм, правое - 10-15мм, верхнее и нижнее - 20мм.' },
      { q: 'Нужны ли титульные листы?', a: 'Да, для каждого типа документа предусмотрен свой титульный лист по стандарту вуза.' },
    ],
  },
  {
    category: 'Процесс работы',
    icon: <HelpIcon />,
    questions: [
      { q: 'Как часто нужно встречаться с руководителем?', a: 'Рекомендуется не реже 1 раза в 2 недели на этапе активной работы.' },
      { q: 'Что делать, если руководитель не проверяет работу?', a: 'Обратитесь к заведующему кафедры или в методический отдел факультета.' },
      { q: 'Какие сроки сдачи документов?', a: 'Заявление - до 15 октября, план работы - до 1 ноября, черновик ВКР - за месяц до предзащиты.' },
    ],
  },
];

const QAPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<{ q: string; a: QAResponse }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    await mockDelay(800);

    const lowerQ = question.toLowerCase();
    let response: QAResponse;

    if (lowerQ.includes('тема') || lowerQ.includes('формат темы')) {
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ❓ Помощь и консультации
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Здесь вы можете получить ответы на вопросы по оформлению документов ВКР, 
        требованиям к содержанию и процессу работы.
      </Typography>

      {/* Часто задаваемые вопросы */}
      <Paper sx={{ mb: 3 }}>
        <Box p={2} bgcolor="primary.main" color="white">
          <Typography variant="h6">📚 Часто задаваемые вопросы</Typography>
        </Box>
        {FAQ_TOPICS.map((topic, idx) => (
          <Accordion key={idx} defaultExpanded={idx === 0}>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                {topic.icon}
                <Typography variant="subtitle1">{topic.category}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {topic.questions.map((item, qIdx) => (
                <Box key={qIdx} mb={2}>
                  <Typography variant="subtitle2" color="primary">
                    Q: {item.q}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    A: {item.a}
                  </Typography>
                  {qIdx < topic.questions.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Интерактивный чат */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🤖 Задать вопрос помощнику
        </Typography>

        {/* История сообщений */}
        {history.length > 0 && (
          <List sx={{ mb: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
            {history.map((item, idx) => (
              <React.Fragment key={idx}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" color="primary">
                        Вы: {item.q}
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="body1">
                        🤖 {item.a.answer}
                      </Typography>
                    }
                    secondary={
                      item.a.suggestions && (
                        <Box mt={1}>
                          <Typography variant="caption" color="text.secondary">
                            Рекомендации:
                          </Typography>
                          <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
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
                {idx < history.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Поле ввода */}
        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Например: Как правильно оформить тему ВКР?"
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
            startIcon={isLoading ? undefined : <SendIcon />}
          >
            {isLoading ? '...' : 'Спросить'}
          </Button>
        </Box>

        {/* Быстрые подсказки */}
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            Попробуйте спросить:
          </Typography>
          <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
            {['формат темы', 'актуальность', 'план работы', 'отзыв'].map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onClick={() => setQuestion(`Как правильно написать ${tag}?`)}
                clickable
              />
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default QAPage;