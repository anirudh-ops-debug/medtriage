import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Cross, Eye, EyeOff, Zap, UserPlus } from "lucide-react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const roles = [
    { id: "admin", label: t("roles.admin"), description: t("roles.adminDesc") },
    { id: "doctor", label: t("roles.doctor"), description: t("roles.doctorDesc") },
    { id: "nurse", label: t("roles.nurse"), description: t("roles.nurseDesc") },
    { id: "organ_committee", label: t("roles.organ_committee"), description: t("roles.organCommitteeDesc") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignUp) {
      if (!fullName.trim()) { setError(t("auth.fullNameRequired")); setLoading(false); return; }
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
          <h2 className="text-lg font-bold text-foreground">{t("auth.checkEmail")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("auth.confirmationSent")} <strong>{email}</strong>. {t("auth.verifyEmail")}
          </p>
          <button onClick={() => { setSignUpSuccess(false); setIsSignUp(false); }} className="text-primary text-sm hover:underline">
            {t("auth.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>
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
            {t("app.tagline")}
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {t("app.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          {isSignUp && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.fullName")}</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={t("auth.enterFullName")}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.email")}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t("auth.enterEmail")}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.password")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={isSignUp ? t("auth.createPassword") : t("auth.enterPassword")}
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
              <><UserPlus className="inline w-4 h-4 mr-2 -mt-0.5" />{t("auth.createAccount")}</>
            ) : (
              <><Shield className="inline w-4 h-4 mr-2 -mt-0.5" />{t("auth.secureLogin")}</>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="w-full border border-primary/40 text-primary rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-primary/10"
          >
            {isSignUp ? t("auth.alreadyHaveAccount") : t("auth.newUser")}
          </button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground mt-8">
          {t("app.encryption")}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
