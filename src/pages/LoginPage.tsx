import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Cross, Eye, EyeOff, Zap, UserPlus } from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";

const roles = [
  { id: "admin", label: "Admin", description: "Full system access" },
  { id: "doctor", label: "Doctor", description: "Patient & triage access" },
  { id: "nurse", label: "Nurse", description: "Patient monitoring" },
  { id: "organ_committee", label: "Organ Committee", description: "Transplant management" },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignUp) {
      if (!fullName.trim()) { setError("Full name is required"); setLoading(false); return; }
      const result = await signUp(email, password, fullName, selectedRole);
      if (result.error) { setError(result.error); } else { setSignUpSuccess(true); }
    } else {
      const result = await signIn(email, password);
      if (result.error) { setError(result.error); } else { navigate("/dashboard"); }
    }
    setLoading(false);
  };

  if (signUpSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md px-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Check Your Email</h2>
          <p className="text-sm text-muted-foreground">
            We've sent a confirmation link to <strong>{email}</strong>. Please verify your email to login.
          </p>
          <button onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }} className="text-primary text-sm hover:underline">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, hsl(352 82% 38% / 0.3) 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-up">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 glow-red">
              <Cross className="w-10 h-10 text-primary" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground text-center leading-tight">
            AI-Driven Smart Triage
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Hospital Intelligence System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection - only for signup */}
          {isSignUp && (
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id as UserRole)}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                    selectedRole === role.id
                      ? "border-primary/50 bg-primary/10 glow-red-border"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <span className={`text-xs font-semibold block ${selectedRole === role.id ? "text-primary" : "text-foreground"}`}>
                    {role.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{role.description}</span>
                </button>
              ))}
            </div>
          )}

          {/* Full Name - only for signup */}
          {isSignUp && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Email ID</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isSignUp ? "Create a password (min 6 chars)" : "Enter your password"}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all pr-10"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 glow-red disabled:opacity-50"
          >
            {isSignUp ? (
              <><UserPlus className="inline w-4 h-4 mr-2 -mt-0.5" />Create Account</>
            ) : (
              <><Shield className="inline w-4 h-4 mr-2 -mt-0.5" />Secure Login</>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="w-full border border-primary/40 text-primary rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-primary/10"
          >
            {isSignUp ? "Already have an account? Login" : "New user? Create Account"}
          </button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground mt-8">
          Secured with AES-256 Encryption · HIPAA Compliant
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
