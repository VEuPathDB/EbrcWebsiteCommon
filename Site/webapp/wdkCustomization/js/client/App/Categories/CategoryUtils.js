import React from 'react';

export function getCategoryColor (category) {
  if (!category) return null;
  switch (category.toLowerCase()) {
    case 'enteric':
    case 'diarrhea':
      return '#6738ff';  //#8874a3'; more muted
    case 'malarial':
    case 'malaria':
      return '#ff6d0d';
    case 'respiratory':
      return '#00aedb';
    case 'schistosomiasis':
      return '#7bc043';
    case 'mixed':
      return '#00aedb';
    case 'human':
      return '#6738ff';
    case 'insect':
      return '#ff6d0d';
    case 'veterinary':
      return '#ffb6c1';
    case 'rodent':
      return '#7bc043';
    default:
      return '#9b9c9c';
  }
}

export function getCategoryName (category = '') {
  switch (category.toLowerCase()) {
    case 'malarial':
    case 'malaria':
      return <span>A <b>Malaria</b> Study</span>;
    case 'enteric':
      return <span>An <b>Enteric</b> Disease Study</span>;
    case 'respiratory':
      return <span>A <b>Respiratory</b> Disease Study</span>;
    case 'schistosomiasis':
      return <span>A <b>Schistosomiasis</b> Study</span>;
    default:
      return <span>An <b>Epidemiological</b> Study</span>;
  }
}
