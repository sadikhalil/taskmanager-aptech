import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const TOKEN_KEY    = "token";
const USERNAME_KEY = "username";
const EXPIRY_KEY   = "token_expiry";

// ✅ 7 days — industry standard for small apps
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isTokenValid() {
  const token  = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);

  if (!token || !expiry) return false;

  if (Date.now() > parseInt(expiry)) {
    // Expired — clean up silently
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    return false;
  }

  return true;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => isTokenValid() ? localStorage.getItem(TOKEN_KEY) : null
  );
  const [username, setUsername] = useState(
    () => isTokenValid() ? localStorage.getItem(USERNAME_KEY) : null
  );

  // Check token validity every time user switches back to this tab
  useEffect(() => {
    const handleFocus = () => {
      if (!isTokenValid()) {
        setToken(null);
        setUsername(null);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const login = (t, u) => {
    const expiry = Date.now() + SESSION_DURATION_MS;
    localStorage.setItem(TOKEN_KEY,    t);
    localStorage.setItem(USERNAME_KEY, u);
    localStorage.setItem(EXPIRY_KEY,   expiry.toString());
    setToken(t);
    setUsername(u);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);