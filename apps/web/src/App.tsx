import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AnalysisPage from './pages/Analysis';
import ChatPage from './pages/Chat';
import DatabaseManagementPage from './pages/DatabaseManagement';
import HomePage from './pages/Home';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';
import SignInPage from './pages/SignIn';
import UploadPage from './pages/Upload';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="sign-in" element={<SignInPage />} />
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
