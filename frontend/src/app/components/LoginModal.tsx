"use client";

import { FormEvent, useState } from "react";

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export default function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (email === "admin@test.com" && password === "password") {
      onLogin();
    } else {
      alert("Try admin@test.com / password");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-xl w-80">
        <h2 className="text-xl font-bold mb-4">Login</h2>

        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full border p-2 rounded"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border p-2 rounded"
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded"
          >
            Login
          </button>
        </form>

        <button type="button" onClick={onClose} className="mt-3 text-sm">
          Close
        </button>
      </div>
    </div>
  );
}
