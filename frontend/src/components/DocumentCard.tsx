import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import StatusBadge from './StatusBadge';
import type { Document } from '../types';

interface DocumentCardProps {
  document: Document;
  onDownload?: (id: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDownload }) => {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/documents/${document.id}`);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(document.id);
    }
    // TODO: реальная загрузка файла
    alert(`Скачивание документа: ${document.title}`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
      onClick={handleView}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography variant="h6" component="div" gutterBottom>
              {document.title}
            </Typography>
            
            <Box display="flex" gap={1} mb={1}>
              <StatusBadge status={document.status} />
              <Typography variant="body2" color="text.secondary">
                {document.typeName}
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Студент: {document.studentName}
            </Typography>
            
            {document.supervisorName && (
              <Typography variant="body2" color="text.secondary">
                Руководитель: {document.supervisorName}
              </Typography>
            )}
          </Box>

          <Box display="flex" gap={0.5}>
            <Tooltip title="Просмотреть">
              <IconButton size="small" onClick={handleView}>
                <ViewIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Скачать">
              <IconButton size="small" onClick={handleDownload}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Создан: {formatDate(document.createdAt)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Обновлён: {formatDate(document.updatedAt)}
          </Typography>
        </Box>

        {document.comments && document.comments.length > 0 && (
          <Box mt={1.5} p={1} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="caption" color="text.secondary">
              💬 {document.comments.length} комментари{document.comments.length === 1 ? 'й' : 'я'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentCard;