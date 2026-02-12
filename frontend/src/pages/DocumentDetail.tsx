import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import StatusBadge from '../components/StatusBadge';
import { MOCK_DOCUMENTS } from '../api/mockData';
import { useAuth } from '../hooks/useAuth';

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Поиск документа в моковых данных
  const document = MOCK_DOCUMENTS.find((d) => d.id === id);

  if (!document) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
        >
          Назад
        </Button>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Документ не найден
          </Typography>
        </Paper>
      </Box>
    );
  }

  const isStudent = user?.role === 'student';
  const canEdit = isStudent && document.status === 'draft';
  const canComment = !isStudent || document.status !== 'draft';

  return (
    <Box>
      {/* Навигация */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2 }}
      >
        Назад к списку
      </Button>

      <Typography variant="h4" gutterBottom>
        {document.title}
      </Typography>

      <Grid container spacing={3}>
        {/* Основная информация */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Chip label={document.typeName} size="small" sx={{ mr: 1 }} />
                <StatusBadge status={document.status} />
              </Box>
              <Box>
                <IconButton>
                  <DownloadIcon />
                </IconButton>
                {canEdit && (
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Данные документа */}
            {document.content && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Содержание документа
                </Typography>
                {Object.entries(document.content).map(([key, value]) => (
                  <Box key={key} mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {key}:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {typeof value === 'boolean' ? (value ? 'Да' : 'Нет') : String(value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>

          {/* Комментарии */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              💬 Комментарии и замечания
            </Typography>

            {document.comments && document.comments.length > 0 ? (
              <List>
                {document.comments.map((comment: { id: string; authorRole: 'teacher' | 'student'; authorName: string; createdAt: string; text: string }) => (
                  <ListItem
                    key={comment.id}
                    alignItems="flex-start"
                    sx={{
                      bgcolor: comment.authorRole === 'teacher' ? 'primary.50' : 'grey.50',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="subtitle2">
                            {comment.authorRole === 'teacher' ? '👨‍🏫 ' : '👨‍🎓 '}
                            {comment.authorName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
                          </Typography>
                        </Box>
                      }
                      secondary={comment.text}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Пока нет комментариев
              </Typography>
            )}

            {/* Добавление комментария */}
            {canComment && (
              <Box mt={2}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Добавить комментарий..."
                  sx={{ mb: 1 }}
                />
                <Button variant="outlined" size="small" startIcon={<SendIcon />}>
                  Отправить
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Боковая панель */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Информация
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Студент
              </Typography>
              <Typography variant="body1">{document.studentName}</Typography>
            </Box>
            {document.supervisorName && (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Руководитель
                </Typography>
                <Typography variant="body1">{document.supervisorName}</Typography>
              </Box>
            )}
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Создан
              </Typography>
              <Typography variant="body1">
                {new Date(document.createdAt).toLocaleDateString('ru-RU')}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Обновлён
              </Typography>
              <Typography variant="body1">
                {new Date(document.updatedAt).toLocaleDateString('ru-RU')}
              </Typography>
            </Box>
          </Paper>

          {/* Действия */}
          {!isStudent && document.status === 'pending' && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Действия
              </Typography>
              <Button
                variant="contained"
                color="success"
                fullWidth
                sx={{ mb: 1 }}
              >
                ✅ Утвердить
              </Button>
              <Button
                variant="outlined"
                color="error"
                fullWidth
              >
                ❌ На доработку
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentDetail;