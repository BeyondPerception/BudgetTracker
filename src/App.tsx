import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard, AccountDetails } from './components/Dashboard';
export function App() {
  return <div className="w-full min-h-screen bg-gray-50">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/account/:type/:id" element={<AccountDetails />} />
      </Routes>
    </BrowserRouter>
  </div>;
}