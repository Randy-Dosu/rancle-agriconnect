import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Demand, { DemandDetail } from './pages/Demand.jsx';
import Landing from './pages/Landing.jsx';
import ListingDetail from './pages/ListingDetail.jsx';
import Login from './pages/Login.jsx';
import Marketplace from './pages/Marketplace.jsx';
import NotFound from './pages/NotFound.jsx';
import Register from './pages/Register.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="page"><div className="container"><Spinner label="Checking your session…" /></div></div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="page"><div className="container"><Spinner label="Loading…" /></div></div>;
  }
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/demand" element={<Demand />} />
        <Route path="/demand/:id" element={<DemandDetail />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
