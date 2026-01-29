import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

interface SystemInfo {
  os: string;
  os_version: string;
  arch: string;
  memory_total: number;
  cpu_cores: number;
}

export default function App() {
  const [appVersion, setAppVersion] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    // Load app info on startup
    invoke<string>('get_app_version').then(setAppVersion).catch(console.error);
    invoke<SystemInfo>('get_system_info').then(setSystemInfo).catch(console.error);
  }, []);

  return (
    <Layout appVersion={appVersion} systemInfo={systemInfo}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}
