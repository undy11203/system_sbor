import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Tabs,
  Tab,
  Fab,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Description as DocumentIcon,
  CheckCircle as ApprovedIcon,
  HourglassEmpty as PendingIcon,
  Error as ReviewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DocumentCard from '../components/DocumentCard';
import { useAuth } from '../hooks/useAuth';
import { MOCK_DOCUMENTS } from '../api/mockData';
import type { DocumentStatus } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const isStudent = user?.role === 'student';

  // Фильтрация документов по роли
  const userDocuments = useMemo(() => {
    if (!user) return [];
    if (isStudent) {
      return MOCK_DOCUMENTS.filter(d => d.studentId === user.id);
    }
    return MOCK_DOCUMENTS.filter(d => d.supervisorId === user.id);
  }, [user, isStudent]);

  // Фильтрация по статусу
  const filteredDocuments = useMemo(() => {
    if (activeTab === 0) return userDocuments;
    const statuses: DocumentStatus[] = ['draft', 'pending', 'review', 'approved'];
    return userDocuments.filter(d => d.status === statuses[activeTab - 1]);
  }, [userDocuments, activeTab]);

  // Статистика
  const stats = useMemo(() => ({
    total: userDocuments.length,
    draft: userDocuments.filter(d => d.status === 'draft').length,
    pending: userDocuments.filter(d => d.status === 'pending').length,
    review: userDocuments.filter(d => d.status === 'review').length,
    approved: userDocuments.filter(d => d.status === 'approved').length,
  }), [userDocuments]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {/* Приветствие */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Добро пожаловать, {user?.fullName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isStudent 
            ? 'Здесь вы можете создавать и отслеживать свои документы ВКР' 
            : 'Управление документами студентов и проверка работ'}
        </Typography>
      </Box>

      {/* Статистика */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <DocumentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">{stats.total}</Typography>
            <Typography variant="body2" color="text.secondary">Всего документов</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
            <PendingIcon sx={{ fontSize: 40, mb: 1, color: 'warning.dark' }} />
            <Typography variant="h4">{stats.pending}</Typography>
            <Typography variant="body2">На рассмотрении</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
            <ReviewIcon sx={{ fontSize: 40, mb: 1, color: 'info.dark' }} />
            <Typography variant="h4">{stats.review}</Typography>
            <Typography variant="body2">На доработке</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
            <ApprovedIcon sx={{ fontSize: 40, mb: 1, color: 'success.dark' }} />
            <Typography variant="h4">{stats.approved}</Typography>
            <Typography variant="body2">Утверждено</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Фильтры */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`Все (${stats.total})`} />
          <Tab label={`Черновики (${stats.draft})`} />
          <Tab label={`На рассмотрении (${stats.pending})`} />
          <Tab label={`На доработке (${stats.review})`} />
          <Tab label={`Утверждено (${stats.approved})`} />
        </Tabs>
      </Paper>

      {/* Список документов */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            {isStudent ? 'Мои документы' : 'Документы студентов'}
          </Typography>
          {isStudent && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/documents/create')}
            >
              Создать документ
            </Button>
          )}
        </Box>

        {filteredDocuments.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              📭 Документов не найдено
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isStudent 
                ? 'Создайте свой первый документ, нажав кнопку выше' 
                : 'У вас пока нет документов на проверку'}
            </Typography>
          </Paper>
        ) : (
          filteredDocuments.map(doc => (
            <DocumentCard key={doc.id} document={doc} />
          ))
        )}
      </Box>

      {/* Плавающая кнопка для студентов */}
      {isStudent && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => navigate('/documents/create')}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default Dashboard;