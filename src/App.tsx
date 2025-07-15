import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { AccountDetails } from './pages/AccountDetails';
import { AccountsProvider } from './context/AccountsProvider';
export function App() {
  return <div className="w-full min-h-screen bg-gray-50">
    <BrowserRouter>
      <AccountsProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/account/:type/:id" element={<AccountDetails />} />
        </Routes>
      </AccountsProvider>
    </BrowserRouter>
  </div>;
}