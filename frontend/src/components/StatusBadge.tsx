import React from 'react';
import { Chip } from '@mui/material';
import { STATUS_LABELS, type DocumentStatus } from '../types';

interface StatusBadgeProps {
  status: DocumentStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { label, color } = STATUS_LABELS[status];

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        backgroundColor: color,
        color: '#fff',
        fontWeight: 'bold',
        '& .MuiChip-label': {
          px: 1.5,
        },
      }}
    />
  );
};

export default StatusBadge;