import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

type TextureType = "hd" | "hdcoton" | "satin" | "taffetas";

export default function Prepare() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedTexture, setSelectedTexture] = useState<TextureType>("hd");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("logoPreview");
    if (!stored) {
      setLocation("/");
    } else {
      setLogoPreview(stored);
    }
  }, [setLocation]);

  const textures = [
    {
      id: "hd" as TextureType,
      name: t("prepare.texture.hd"),
      description: t("prepare.texture.hd.desc"),
    },
    {
      id: "hdcoton" as TextureType,
      name: t("prepare.texture.hdcoton"),
      description: t("prepare.texture.hdcoton.desc"),
    },
    {
      id: "satin" as TextureType,
      name: t("prepare.texture.satin"),
      description: t("prepare.texture.satin.desc"),
    },
    {
      id: "taffetas" as TextureType,
      name: t("prepare.texture.taffetas"),
      description: t("prepare.texture.taffetas.desc"),
    },
  ];

  // Patterns CSS pour chaque texture
  const getTexturePattern = (texture: TextureType) => {
    switch (texture) {
      case "hd":
        // HD: quadrillage très serré (2x plus fin que taffetas)
        return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIiIGhlaWdodD0iMiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCAyIDAgTCAyIDIgTCAwIDIgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAuMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==";
      case "hdcoton":
        // HD Coton: quadrillage serré intermédiaire (1.5x plus fin que taffetas)
        return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iMi42NyIgaGVpZ2h0PSIyLjY3IiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHBhdGggZD0iTSAwIDAgTCAyLjY3IDAgTCAyLjY3IDIuNjcgTCAwIDIuNjcgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAuMzUiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPgo8L3N2Zz4K";
      case "satin":
        // Satin: quadrillage orienté avec brillance
        return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZGlhZ29uYWwiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgyMCkiPjxsaW5lIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSI0IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMC40Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2RpYWdvbmFsKSIvPjwvc3ZnPg==";
      case "taffetas":
      default:
        // Taffetas: quadrillage standard
        return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQiIGhlaWdodD0iNCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDAgTCA0IDAgTCA0IDQgTCAwIDQgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==";
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    // Stocker les options pour la page de résultat
    localStorage.setItem("selectedTexture", selectedTexture);
    
    // Simuler un délai de génération
    setTimeout(() => {
      setLocation("/result");
    }, 2000);
  };

  if (!logoPreview) {
    return null;
  }

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
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              {t("header.back")}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <p className="text-sm text-primary font-medium mb-2">{t("prepare.title")}</p>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              {t("prepare.subtitle.line1")}
              <br />
              {t("prepare.subtitle.line2")}
            </h2>
          </div>

          {/* Preview Card */}
          <Card className="p-8 mb-8 border-2 border-primary/20">
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-[2/1] rounded-xl overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-muted/30 to-muted/10 mb-6">
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </div>
                {/* Simulation de texture d'étiquette avec changement dynamique */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply transition-all duration-500"
                  style={{
                    backgroundImage: `url('${getTexturePattern(selectedTexture)}')`,
                  }}
                />
                {/* Effet de drapé brillant pour le satin */}
                {selectedTexture === 'satin' && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-30 transition-opacity duration-500"
                    style={{
                      background: `
                        radial-gradient(ellipse 80% 50% at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 40%),
                        radial-gradient(ellipse 70% 40% at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 40%),
                        linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 30%, rgba(255,255,255,0.1) 60%, transparent 100%)
                      `,
                      mixBlendMode: 'overlay'
                    }}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Texture Selection */}
          <Card className="p-8 mb-6">
            <RadioGroup value={selectedTexture} onValueChange={(value) => setSelectedTexture(value as TextureType)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {textures.map((texture) => (
                  <div key={texture.id} className="relative">
                    <RadioGroupItem
                      value={texture.id}
                      id={texture.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={texture.id}
                      className="flex flex-col p-6 rounded-lg border-2 border-border cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">{texture.name}</h4>
                          <p className="text-sm text-muted-foreground">{texture.description}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-border peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary flex items-center justify-center ml-4">
                          {selectedTexture === texture.id && (
                            <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </Card>

          {/* Advanced Options */}
          <Collapsible open={isOptionsOpen} onOpenChange={setIsOptionsOpen} className="mb-8">
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-center gap-2 mb-4"
              >
                {t("prepare.options")}
                <ChevronDown className={`w-4 h-4 transition-transform ${isOptionsOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground text-center">
                  Options avancées disponibles prochainement
                  <br />
                  (couleurs personnalisées, dimensions, finitions spéciales)
                </p>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Generate Button */}
          <div className="text-center">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t("prepare.generating")}
                </>
              ) : (
                <>
                  {t("prepare.button")}
                  <Sparkles className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              {t("prepare.trial")}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
