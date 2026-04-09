import React, { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, User, Lock } from "lucide-react";

export default function Profile() {
  const { authAxios, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAxios.get('/profile');
        setProfile(prev => ({ ...prev, ...response.data, name: user.name, email: user.email }));
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(prev => ({ ...prev, name: user.name || "", email: user.email || "" }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [authAxios, user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await authAxios.put('/profile', { name: profile.name });
      toast.success("Perfil guardado correctamente");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Error al guardar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validaciones
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast.error("Por favor, completa todos los campos");
      return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    try {
      setChangingPassword(true);
      await authAxios.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      
      toast.success("Contraseña actualizada correctamente");
      
      // Limpiar campos
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.detail || "Error al cambiar contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="profile-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2" data-testid="save-profile-btn">
          {saving ? (
            <>
              <span className="spinner w-4 h-4" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar
            </>
          )}
        </Button>
      </div>

      {/* Personal Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Información Personal
          </CardTitle>
          <CardDescription>Tu información básica de usuario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="form-label">Nombre</Label>
            <Input
              type="text"
              placeholder="Tu nombre completo"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              data-testid="profile-name-input"
            />
          </div>
          <div className="space-y-2">
            <Label className="form-label">Email</Label>
            <Input
              type="email"
              placeholder="tu@email.com"
              value={profile.email}
              disabled
              className="bg-muted cursor-not-allowed"
              data-testid="profile-email-input"
            />
            <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="form-label">Contraseña actual</Label>
            <Input
              type="password"
              placeholder="Tu contraseña actual"
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              data-testid="current-password-input"
            />
          </div>
          <div className="space-y-2">
            <Label className="form-label">Nueva contraseña</Label>
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              data-testid="new-password-input"
            />
          </div>
          <div className="space-y-2">
            <Label className="form-label">Confirmar nueva contraseña</Label>
            <Input
              type="password"
              placeholder="Repite la nueva contraseña"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              data-testid="confirm-password-input"
            />
          </div>
          <Button 
            onClick={handleChangePassword} 
            disabled={changingPassword} 
            className="w-full gap-2"
            variant="secondary"
            data-testid="change-password-btn"
          >
            {changingPassword ? (
              <>
                <span className="spinner w-4 h-4" />
                Cambiando contraseña...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Cambiar Contraseña
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Bottom save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <span className="spinner w-4 h-4" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
