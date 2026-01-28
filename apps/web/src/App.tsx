import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/Home';
import UploadPage from './pages/Upload';
import AnalysisPage from './pages/Analysis';
import ReportsPage from './pages/Reports';
import ChatPage from './pages/Chat';
import SettingsPage from './pages/Settings';
import DatabaseManagementPage from './pages/DatabaseManagement';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="databases" element={<DatabaseManagementPage />} />
      </Route>
    </Routes>
  );
}
