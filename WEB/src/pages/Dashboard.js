import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toolsAPI } from '../services/api';
import { DashboardRenderer } from '../components/DashboardRenderer';
import { Settings, Users, FileText, Wrench, ArrowRight } from 'lucide-react';

// Иконки для инструментов
const toolIcons = {
  auth: Settings,
  documents: FileText,
  users: Users,
  default: Wrench,
};

export function Dashboard() {
  return <DashboardRenderer />;
} 