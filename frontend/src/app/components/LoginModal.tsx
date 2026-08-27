"use client";

import { useMutation } from "@apollo/client";
import { FormEvent, useState } from "react";
import { LOGIN, SIGNUP } from "@/graphql/operations";

interface LoginModalProps {
  onClose: () => void;
  onLogin: (userId?: string) => void;
}

export default function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginMutation] = useMutation(LOGIN);
  const [signupMutation] = useMutation(SIGNUP);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const result =
        mode === "login"
          ? await loginMutation({ variables: { email, password } })
          : await signupMutation({ variables: { email, password } });

      const userId = result.data?.login ?? result.data?.signup;
      if (userId) {
        onLogin(userId);
      }
    } catch (error) {
      console.error(error);
      alert("Login failed. Try a different email or password.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative z-50 bg-white p-6 rounded-xl w-80">
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
            {mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-3 text-sm text-blue-600"
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Log in"}
        </button>

        <button type="button" onClick={onClose} className="mt-3 text-sm">
          Close
        </button>
      </div>
    </div>
  );
}
