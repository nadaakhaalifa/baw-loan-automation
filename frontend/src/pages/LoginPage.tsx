import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getCurrentUser,
  login,
  registerUser,
  sendForgotPasswordCode,
  resetPassword,
} from "../api/authApi";

import { saveToken } from "../utils/authStorage";

type AuthMode = "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return {
      label: "Weak",
      color: "text-red-600",
      bar: "bg-red-500 w-1/3",
      valid: false,
    };
  }

  if (score <= 4) {
    return {
      label: "Medium",
      color: "text-yellow-600",
      bar: "bg-yellow-500 w-2/3",
      valid: true,
    };
  }

  return {
    label: "Strong",
    color: "text-green-600",
    bar: "bg-green-500 w-full",
    valid: true,
  };
}

function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>("LOGIN");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("nada@test.com");
  const [password, setPassword] = useState("123456");
  const [role, setRole] = useState("CUSTOMER");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordStrength = getPasswordStrength(password);
  const newPasswordStrength = getPasswordStrength(newPassword);

  function resetAlerts() {
    setError("");
    setMessage("");
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    resetAlerts();
    setCodeSent(false);
    setVerificationCode("");
    setNewPassword("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      resetAlerts();

      const response = await login(email, password);

      saveToken(response.access_token);

      const user = await getCurrentUser(response.access_token);

      if (user.role === "MANAGER") {
        navigate("/manager");
      } else if (user.role === "FINANCE") {
        navigate("/finance");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!passwordStrength.valid) {
      setError(
        "Password is weak. Use at least 8 characters with uppercase, lowercase, number, and special character."
      );
      return;
    }

    try {
      setLoading(true);
      resetAlerts();

      await registerUser({
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        password,
        role,
      });

      setMessage("Account created successfully. You can now login.");
      changeMode("LOGIN");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Registration failed. This email or phone number may already be registered."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      resetAlerts();

      if (!codeSent) {
        await sendForgotPasswordCode(email, phoneNumber);

        setCodeSent(true);
        setMessage("Verification code sent successfully to your phone.");
        return;
      }

      if (!newPasswordStrength.valid) {
        setError(
          "New password is weak. Use at least 8 characters with uppercase, lowercase, number, and special character."
        );
        return;
      }

      await resetPassword(email, phoneNumber, verificationCode, newPassword);

      setMessage("Password reset successfully. You can now login.");
      changeMode("LOGIN");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Failed to process password reset request."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <div className="hidden lg:flex w-1/2 bg-slate-950 text-white p-12 flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
            Secure Enterprise Access
          </div>

          <div className="text-4xl font-bold mb-4">BAW Loan Automation</div>

          <p className="text-slate-300 text-lg max-w-lg leading-relaxed">
            Professional workflow automation platform for loan processing,
            approvals, finance disbursement, audit tracking, and role-based task
            management.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            ["BAW", "Inspired workflow orchestration"],
            ["RBAC", "Role-based task access"],
            ["Audit", "Full workflow tracking"],
            ["Async", "Celery background tasks"],
          ].map(([title, description]) => (
            <div
              key={title}
              className="bg-white/10 p-5 rounded-2xl border border-white/10"
            >
              <p className="text-3xl font-bold">{title}</p>
              <p className="text-slate-300 text-sm mt-2">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-blue-600 mb-2">
              Enterprise Workflow Portal
            </p>

            <h1 className="text-3xl font-bold text-slate-800">
              {mode === "LOGIN" && "Welcome Back"}
              {mode === "REGISTER" && "Create Account"}
              {mode === "FORGOT_PASSWORD" && "Recover Access"}
            </h1>

            <p className="text-gray-500 mt-2">
              {mode === "LOGIN" && "Login to access your workflow dashboard."}
              {mode === "REGISTER" &&
                "Create a secure account with email and phone recovery."}
              {mode === "FORGOT_PASSWORD" &&
                "Verify your phone number and reset your password securely."}
            </p>
          </div>

          <div className="grid grid-cols-3 bg-slate-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => changeMode("LOGIN")}
              className={`p-2 rounded-lg text-sm font-semibold ${
                mode === "LOGIN"
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-500"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => changeMode("REGISTER")}
              className={`p-2 rounded-lg text-sm font-semibold ${
                mode === "REGISTER"
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-500"
              }`}
            >
              Register
            </button>

            <button
              type="button"
              onClick={() => changeMode("FORGOT_PASSWORD")}
              className={`p-2 rounded-lg text-sm font-semibold ${
                mode === "FORGOT_PASSWORD"
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-500"
              }`}
            >
              Reset
            </button>
          </div>

          {message && (
            <div className="mb-4 bg-green-100 text-green-700 p-4 rounded-xl text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-100 text-red-700 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          {mode === "LOGIN" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <InputField
                label="Email Address"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={setEmail}
              />

              <InputField
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
              />

              <button
                type="button"
                onClick={() => changeMode("FORGOT_PASSWORD")}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-3 rounded-xl font-semibold transition"
              >
                {loading ? "Signing in..." : "Login to Dashboard"}
              </button>
            </form>
          )}

          {mode === "REGISTER" && (
            <form onSubmit={handleRegister} className="space-y-5">
              <InputField
                label="Full Name"
                type="text"
                placeholder="Example: Nada Khalifa"
                value={fullName}
                onChange={setFullName}
              />

              <InputField
                label="Email Address"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={setEmail}
              />

              <InputField
                label="Phone Number"
                type="tel"
                placeholder="+2010XXXXXXXX"
                value={phoneNumber}
                onChange={setPhoneNumber}
              />

              <InputField
                label="Password"
                type="password"
                placeholder="Create a secure password"
                value={password}
                onChange={setPassword}
              />

              <PasswordStrength strength={passwordStrength} />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role
                </label>

                <select
                  className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="MANAGER">Manager</option>
                  <option value="FINANCE">Finance</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white p-3 rounded-xl font-semibold transition"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}

          {mode === "FORGOT_PASSWORD" && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <InputField
                label="Registered Email Address"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={setEmail}
              />

              <InputField
                label="Registered Mobile Number"
                type="tel"
                placeholder="+2010XXXXXXXX"
                value={phoneNumber}
                onChange={setPhoneNumber}
              />

              {codeSent && (
                <>
                  <InputField
                    label="Verification Code"
                    type="text"
                    placeholder="Enter SMS code"
                    value={verificationCode}
                    onChange={setVerificationCode}
                  />

                  <InputField
                    label="New Password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={setNewPassword}
                  />

                  <PasswordStrength strength={newPasswordStrength} />
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-3 rounded-xl font-semibold transition"
              >
                {loading
                  ? "Processing..."
                  : codeSent
                  ? "Reset Password"
                  : "Send Verification Code"}
              </button>

              <button
                type="button"
                onClick={() => changeMode("LOGIN")}
                className="w-full border border-gray-300 hover:bg-gray-50 p-3 rounded-xl font-semibold transition"
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}

function PasswordStrength({
  strength,
}: {
  strength: {
    label: string;
    color: string;
    bar: string;
    valid: boolean;
  };
}) {
  return (
    <div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${strength.bar}`} />
      </div>

      <p className={`text-xs mt-2 font-semibold ${strength.color}`}>
        Password strength: {strength.label}
      </p>
    </div>
  );
}

export default LoginPage;