import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { generateAuthToken, apiService } from "../lib/apiService";
import { getSigner } from "../lib/contracts";

interface OnboardingPageProps {
  onCompleted?: () => void;
  onBack?: () => void;
}

interface FormState {
  username: string;
  displayName: string;
  bio: string;
}

interface FormErrors {
  username?: string;
  displayName?: string;
  global?: string;
  image?: string;
}

export function OnboardingPage({ onCompleted, onBack }: OnboardingPageProps) {
  const { isConnecting, connect } = useWallet();
  const [form, setForm] = useState<FormState>({
    username: "",
    displayName: "",
    bio: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mode, setMode] = useState<"signup" | "signin">("signup");

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validate = (): boolean => {
    if (mode === "signin") {
      // En modo inicio de sesión no validamos datos de perfil
      setErrors({});
      return true;
    }

    const nextErrors: FormErrors = {};

    if (!form.username.trim()) {
      nextErrors.username = "El nombre de usuario es obligatorio";
    }
    if (!form.displayName.trim()) {
      nextErrors.displayName = "El nombre visible es obligatorio";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (loading || isConnecting) return;
    if (!validate()) return;

    try {
      setLoading(true);
      setErrors({});

      // 1) Conectar wallet
      await connect();

      // 2) Obtener signer y dirección
      const signer = await getSigner();
      const addr = await signer.getAddress();

      if (mode === "signin") {
        // MODO LOGIN: solo verificamos que el usuario exista
        const existing = await apiService.getUser(addr);
        if (!existing) {
          setErrors({
            global:
              "No encontramos un perfil asociado a esta wallet. Crea una cuenta nueva.",
          });
          setLoading(false);
          return;
        }

        if (onCompleted) {
          onCompleted();
        }
        return;
      }

      const authToken = await generateAuthToken(addr, signer);

      // 3) Subir imagen de perfil (si hay)
      let profileImageUrl: string | undefined = undefined;
      if (imageFile) {
        try {
          const uploadResult = await apiService.uploadImage(
            imageFile,
            "profile",
            authToken
          );
          profileImageUrl = uploadResult.url;
        } catch (uploadError: any) {
          console.error("Error subiendo imagen de perfil:", uploadError);
          setErrors((prev) => ({
            ...prev,
            image:
              uploadError?.message ||
              "Error al subir la imagen de perfil. Intenta con otra imagen.",
          }));
          setLoading(false);
          return;
        }
      }

      // 4) Crear/actualizar usuario (sign up)
      await apiService.upsertUser(
        {
          username: form.username.trim(),
          display_name: form.displayName.trim(),
          bio: form.bio.trim() || undefined,
          profile_image_url: profileImageUrl,
          is_creator: false,
        },
        authToken
      );

      if (onCompleted) {
        onCompleted();
      }
    } catch (e: any) {
      console.error("Error en onboarding:", e);
      setErrors((prev) => ({
        ...prev,
        global: e?.message || "Error al conectar wallet o crear usuario",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-16 flex justify-center">
      <div className="w-full max-w-xl px-6 py-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-6 text-sm text-slate-400 hover:text-slate-200"
          >
            ← Volver al inicio
          </button>
        )}

        <h1 className="text-2xl font-semibold text-white mb-2">
          {mode === "signup" ? "Crea tu perfil en Uvote" : "Inicia sesión en Uvote"}
        </h1>
        <p className="text-sm text-slate-400 mb-4">
          {mode === "signup"
            ? "Antes de conectar tu wallet necesitamos algunos datos básicos para tu cuenta. Estos datos, junto con tu foto de perfil (opcional), se guardarán asociados a la dirección de tu wallet."
            : "Si ya creaste tu cuenta antes, solo conecta la misma wallet para continuar donde lo dejaste."}
        </p>

        <div className="inline-flex items-center gap-2 mb-6 rounded-full bg-slate-900/60 border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrors({});
            }}
            className={`px-4 py-1.5 text-xs rounded-full transition-colors ${
              mode === "signup"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrors({});
            }}
            className={`px-4 py-1.5 text-xs rounded-full transition-colors ${
              mode === "signin"
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Ya tengo cuenta
          </button>
        </div>

        {errors.global && (
          <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-700/40 rounded-lg px-3 py-2">
            {errors.global}
          </div>
        )}

        <div className="space-y-5">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Foto de perfil (opcional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500">
                    {imagePreview ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <img
                        src={imagePreview}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>Sin foto</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setImageFile(file || null);
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setImagePreview(url);
                        } else {
                          setImagePreview(null);
                        }
                        setErrors((prev) => ({ ...prev, image: undefined }));
                      }}
                      disabled={loading}
                      className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
                    />
                    {errors.image && (
                      <p className="mt-1 text-xs text-red-400">{errors.image}</p>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Recomendado: imagen cuadrada, máximo ~2MB.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nombre de usuario *
                </label>
                <Input
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="ej: realmadridking"
                  className="bg-slate-900/70 border-slate-700/70 text-slate-100 placeholder:text-slate-500"
                  disabled={loading}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-400">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nombre visible *
                </label>
                <Input
                  value={form.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder="ej: El Rey de las Predicciones"
                  className="bg-slate-900/70 border-slate-700/70 text-slate-100 placeholder:text-slate-500"
                  disabled={loading}
                />
                {errors.displayName && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.displayName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Bio (opcional)
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="Cuenta quién eres o qué tipo de predicciones haces."
                  className="w-full min-h-[100px] rounded-md bg-slate-900/70 border border-slate-700/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  disabled={loading}
                />
              </div>
            </>
          )}

          {mode === "signin" && (
            <div className="text-sm text-slate-400">
              Conecta tu wallet para recuperar tu perfil existente. Asegúrate de
              usar la misma dirección con la que te registraste.
            </div>
          )}

          {mode === "signup" && (
            <></>
          )}

          {/* Este bloque vacío mantiene la estructura de spacing */}

          {/* Inputs específicos de signup ya se gestionan arriba */}

          {/* Dejamos este div para compatibilidad con el diseño anterior */}
          <div className="hidden">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nombre de usuario *
            </label>
            <Input
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              placeholder="ej: realmadridking"
              className="bg-slate-900/70 border-slate-700/70 text-slate-100 placeholder:text-slate-500"
              disabled={loading}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-400">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nombre visible *
            </label>
            <Input
              value={form.displayName}
              onChange={(e) => handleChange("displayName", e.target.value)}
              placeholder="ej: El Rey de las Predicciones"
              className="bg-slate-900/70 border-slate-700/70 text-slate-100 placeholder:text-slate-500"
              disabled={loading}
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-red-400">{errors.displayName}</p>
            )}
          </div>

        </div>

        <div className="mt-8 flex flex-col gap-2">
          <Button
            onClick={handleSubmit}
            disabled={loading || isConnecting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {loading || isConnecting
              ? "Conectando wallet..."
              : mode === "signup"
              ? "Guardar datos y conectar wallet"
              : "Conectar wallet"}
          </Button>
          <p className="text-[11px] text-slate-500 text-center">
            {mode === "signup"
              ? "Al continuar se abrirá tu wallet para firmar y vincular esta cuenta a tu dirección."
              : "Al continuar se abrirá tu wallet y recuperaremos tu perfil asociado a esa dirección."}
          </p>
        </div>
      </div>
    </div>
  );
}


