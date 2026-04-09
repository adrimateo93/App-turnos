import React, { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validaciones
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    
    if (!email.trim()) {
      setError("El email es obligatorio");
      return;
    }
    
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const success = await register(email, password, name);
      if (success) {
        navigate("/");
      }
    } catch (err) {
      setError("Error al registrar. Por favor, intenta de nuevo.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="register-page">
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

        {/* Card de Registro */}
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-2 pb-4">
            <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
            <CardDescription className="text-base">Regístrate en SeguriTurno</CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="form-label">Nombre</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                data-testid="register-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="form-label">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                data-testid="register-email-input"
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
                data-testid="register-password-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                data-testid="register-confirm-password-input"
              />
            </div>
            
            {error && (
              <p className="text-sm text-destructive" data-testid="register-error">{error}</p>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="register-submit-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner w-4 h-4" />
                  Registrando...
                </span>
              ) : (
                "Crear Cuenta"
              )}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            <p className="text-xs text-muted-foreground text-center mb-2">
              ¿Problemas para registrarte? Prueba la aplicación sin registro:
            </p>
            <Button 
              variant="outline"
              className="w-full" 
              onClick={() => navigate("/login")}
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ir a Acceso Demo
            </Button>
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-primary hover:underline" data-testid="login-link">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
