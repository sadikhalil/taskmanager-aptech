import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";

function AppInner() {
  const { token } = useAuth();
  const [page, setPage] = useState("login"); // login | signup | forgot

  if (token) return <Dashboard />;

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="bg-orb orb1" />
        <div className="bg-orb orb2" />
        <div className="bg-orb orb3" />
        <div className="bg-grid" />
      </div>
      <div className="auth-container">
        {page === "login"  && <Login onSwitch={setPage} />}
        {page === "signup" && <Signup onSwitch={setPage} />}
        {page === "forgot" && <ForgotPassword onSwitch={setPage} />}
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}