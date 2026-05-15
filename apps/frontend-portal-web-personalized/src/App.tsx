import { Route, Routes } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import Success from './pages/Success';
import Support from './pages/Support';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Infoconso from './pages/Infoconso';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/infoconso" element={<Infoconso />} />
      <Route>
        <Route
          path="/success"
          element={
            <RequireAuth>
              <Success />
            </RequireAuth>
          }
        />
        <Route path="/support" element={<Support />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Route>
    </Routes>
  );
}
