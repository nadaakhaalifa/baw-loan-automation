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

  if (score <= 2) return { label: "Weak", color: "text-red-500", bar: "w-1/3 bg-red-500", valid: false };
  if (score <= 4) return { label: "Medium", color: "text-amber-500", bar: "w-2/3 bg-amber-500", valid: true };

  return { label: "Strong", color: "text-emerald-500", bar: "w-full bg-emerald-500", valid: true };
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

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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

      localStorage.setItem("currentUser", JSON.stringify(user));

      if (user.role === "MANAGER") navigate("/manager");
      else if (user.role === "FINANCE") navigate("/finance");
      else navigate("/dashboard");
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
      setError("Password is weak. Use uppercase, lowercase, number, special character, and at least 8 characters.");
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
      setError(err?.response?.data?.detail || "Registration failed. Email or phone may already exist.");
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
        setMessage("Verification code sent successfully.");
        return;
      }

      if (!newPasswordStrength.valid) {
        setError("New password is weak. Use uppercase, lowercase, number, special character, and at least 8 characters.");
        return;
      }

      await resetPassword(email, phoneNumber, verificationCode, newPassword);

      setMessage("Password reset successfully. You can now login.");
      changeMode("LOGIN");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to process password reset request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb,transparent_30%),radial-gradient(circle_at_bottom_right,#7c3aed,transparent_35%)] opacity-80" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />

      <div className="relative min-h-screen grid lg:grid-cols-2">
        <section className="hidden lg:flex flex-col justify-between p-12 text-white">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Secure BAW Workflow Portal
            </div>

            <h1 className="mt-10 text-6xl font-black leading-tight">
              Loan automation,
              <br />
              redesigned.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-300 leading-relaxed">
              A professional enterprise platform for customer onboarding,
              approvals, finance disbursement, notifications, audit logs, and
              role-based workflow control.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FeatureCard title="RBAC" text="Role-based access" />
            <FeatureCard title="OTP" text="Real SMS verification" />
            <FeatureCard title="SMTP" text="Live email alerts" />
            <FeatureCard title="Audit" text="Full workflow history" />
          </div>
        </section>

        <section className="flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-[2rem] bg-white/95 shadow-2xl border border-white/40 backdrop-blur p-8">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-2xl shadow-lg">
                ◈
              </div>

              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                Enterprise Access
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-900">
                {mode === "LOGIN" && "Welcome back"}
                {mode === "REGISTER" && "Create account"}
                {mode === "FORGOT_PASSWORD" && "Recover access"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {mode === "LOGIN" && "Sign in to continue to your dashboard."}
                {mode === "REGISTER" && "Create a secure account with phone recovery."}
                {mode === "FORGOT_PASSWORD" && "Verify your phone and reset your password."}
              </p>
            </div>

            <div className="grid grid-cols-3 p-1 mb-6 rounded-2xl bg-slate-100">
              <TabButton active={mode === "LOGIN"} onClick={() => changeMode("LOGIN")}>Login</TabButton>
              <TabButton active={mode === "REGISTER"} onClick={() => changeMode("REGISTER")}>Register</TabButton>
              <TabButton active={mode === "FORGOT_PASSWORD"} onClick={() => changeMode("FORGOT_PASSWORD")}>Reset</TabButton>
            </div>

            {message && <Alert type="success" text={message} />}
            {error && <Alert type="error" text={error} />}

            {mode === "LOGIN" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <InputField label="Email Address" type="email" placeholder="example@company.com" value={email} onChange={setEmail} />

                <PasswordField
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={setPassword}
                  visible={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />

                <div className="flex justify-end">
                  <button type="button" onClick={() => changeMode("FORGOT_PASSWORD")} className="text-sm font-semibold text-blue-600 hover:text-violet-600">
                    Forgot password?
                  </button>
                </div>

                <PrimaryButton loading={loading} text="Login to Dashboard" loadingText="Signing in..." />
              </form>
            )}

            {mode === "REGISTER" && (
              <form onSubmit={handleRegister} className="space-y-5">
                <InputField label="Full Name" type="text" placeholder="Example: Nada Khalifa" value={fullName} onChange={setFullName} />
                <InputField label="Email Address" type="email" placeholder="example@company.com" value={email} onChange={setEmail} />
                <InputField label="Phone Number" type="tel" placeholder="+2010XXXXXXXX" value={phoneNumber} onChange={setPhoneNumber} />

                <PasswordField
                  label="Password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={setPassword}
                  visible={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />

                <PasswordStrength strength={passwordStrength} />

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
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

                <PrimaryButton loading={loading} text="Create Secure Account" loadingText="Creating account..." />
              </form>
            )}

            {mode === "FORGOT_PASSWORD" && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <InputField label="Registered Email Address" type="email" placeholder="example@company.com" value={email} onChange={setEmail} />
                <InputField label="Registered Mobile Number" type="tel" placeholder="+2010XXXXXXXX" value={phoneNumber} onChange={setPhoneNumber} />

                {codeSent && (
                  <>
                    <InputField label="Verification Code" type="text" placeholder="Enter SMS code" value={verificationCode} onChange={setVerificationCode} />

                    <PasswordField
                      label="New Password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={setNewPassword}
                      visible={showNewPassword}
                      onToggle={() => setShowNewPassword(!showNewPassword)}
                    />

                    <PasswordStrength strength={newPasswordStrength} />
                  </>
                )}

                <PrimaryButton
                  loading={loading}
                  text={codeSent ? "Reset Password" : "Send Verification Code"}
                  loadingText="Processing..."
                />

                <button
                  type="button"
                  onClick={() => changeMode("LOGIN")}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3 font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl bg-white/10 border border-white/15 p-5 backdrop-blur hover:bg-white/15 transition">
      <p className="text-3xl font-black">{title}</p>
      <p className="mt-2 text-sm text-slate-300">{text}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl p-2 text-sm font-bold transition ${
        active
          ? "bg-white text-blue-600 shadow"
          : "text-slate-500 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function Alert({ type, text }: { type: "success" | "error"; text: string }) {
  return (
    <div
      className={`mb-4 rounded-2xl p-4 text-sm font-semibold ${
        type === "success"
          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
          : "bg-red-50 text-red-700 border border-red-100"
      }`}
    >
      {text}
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
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-none transition focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 pr-12 outline-none transition focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-lg hover:bg-slate-200 transition"
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? "🙈" : "👁️"}
        </button>
      </div>
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
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${strength.bar}`} />
      </div>

      <p className={`mt-2 text-xs font-bold ${strength.color}`}>
        Password strength: {strength.label}
      </p>
    </div>
  );
}

function PrimaryButton({
  loading,
  text,
  loadingText,
}: {
  loading: boolean;
  text: string;
  loadingText: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-3 font-black text-white shadow-lg shadow-blue-500/25 transition hover:scale-[1.01] hover:shadow-xl disabled:opacity-60"
    >
      <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      <span className="relative">{loading ? loadingText : text}</span>
    </button>
  );
}

export default LoginPage;