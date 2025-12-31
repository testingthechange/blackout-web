import { useEffect, useState } from "react";

const TOKEN_KEY = "authToken";
const EMAIL_KEY = "authEmail";

export function useAuth() {
  const [isAuthed, setIsAuthed] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [email, setEmail] = useState(localStorage.getItem(EMAIL_KEY) || "");

  useEffect(() => {
    function onStorage(e) {
      if (e.key === TOKEN_KEY || e.key === EMAIL_KEY) {
        setIsAuthed(Boolean(localStorage.getItem(TOKEN_KEY)));
        setEmail(localStorage.getItem(EMAIL_KEY) || "");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function login({ email }) {
    localStorage.setItem(TOKEN_KEY, "dev");
    localStorage.setItem(EMAIL_KEY, email || "");
    setIsAuthed(true);
    setEmail(email || "");
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setIsAuthed(false);
    setEmail("");
  }

  return { isAuthed, email, login, logout };
}
