import { useState } from "react";
import { useLocation } from "wouter";
import { Upload, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Convertir les SVG en PNG (Gemini n'accepte pas SVG)
        if (file.type === "image/svg+xml") {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(img.naturalWidth || 512, 512);
            canvas.height = Math.max(img.naturalHeight || 512, 512);
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setLogoPreview(canvas.toDataURL("image/png"));
          };
          img.src = dataUrl;
        } else {
          setLogoPreview(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleContinue = () => {
    if (logoFile && logoPreview) {
      // Stocker le logo dans le state global ou localStorage pour la page suivante
      localStorage.setItem("logoPreview", logoPreview);
      setLocation("/prepare");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{t("header.title")}</h1>
              <p className="text-xs text-muted-foreground">{t("header.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            {isAuthenticated && user ? (
              <Button variant="outline" size="sm" onClick={() => setLocation("/account")}>
                <User className="w-4 h-4 mr-2" />
                {user.name || t("header.account")}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => window.location.href = getLoginUrl()}>
                {t("header.login")}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 animate-fade-in">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            {t("home.hero.title")}
            <br />
            <span className="text-primary">{t("home.hero.subtitle")}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("home.hero.description")}
            <br />
            {t("home.hero.tech")}
          </p>
        </div>

        {/* Upload Area */}
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 border-2 border-dashed transition-all duration-300 hover:border-primary/50">
            {!logoPreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative ${isDragging ? "scale-105" : ""} transition-transform duration-200`}
              >
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload"
                  className="flex flex-col items-center justify-center py-16 cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t("home.upload.title")}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t("home.upload.subtitle")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("home.upload.formats")}
                  </p>
                </label>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain bg-white p-4"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                    >
                      {t("home.upload.change")}
                    </Button>
                    <Button
                      onClick={handleContinue}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 shadow-lg"
                    >
                      {t("home.upload.button")}
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Premier essai offert</h4>
              <p className="text-sm text-muted-foreground">
                Testez gratuitement sans inscription
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Qualité professionnelle</h4>
              <p className="text-sm text-muted-foreground">
                Rendu haute définition prêt à produire
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Personnalisation avancée</h4>
              <p className="text-sm text-muted-foreground">
                Multiples textures et options
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
