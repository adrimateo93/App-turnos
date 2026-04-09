import React, { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate("/");
    }
  };

  const handleDemoAccess = async () => {
    setLoading(true);
    // Login con cuenta demo
    const success = await login("demo@seguriturno.com", "Demo123456");
    setLoading(false);
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="login-page">
      <div className="w-full max-w-md">
        {/* Logo Grande */}
        <div className="text-center mb-8">
          <img 
            src="/logo-recortado.png" 
            alt="SeguriTurno" 
            className="h-52 sm:h-64 w-auto mx-auto"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Card de Login */}
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-2 pb-4">
            <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
            <CardDescription className="text-base">Accede a tu cuenta de SeguriTurno</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="form-label">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                data-testid="login-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="form-label">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                data-testid="login-password-input"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner w-4 h-4" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">o</span>
              </div>
            </div>
            
            <Button 
              type="button"
              variant="outline"
              className="w-full" 
              onClick={handleDemoAccess}
              disabled={loading}
              data-testid="demo-access-btn"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Sin Registro
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-primary hover:underline" data-testid="register-link">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
