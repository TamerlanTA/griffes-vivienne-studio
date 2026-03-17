import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sparkles, Download, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { isPreviewMode } from "@/utils/isPreviewMode";
import { mockGeneration } from "@/utils/mockGeneration";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const PREVIEW_MODE_MESSAGE =
  "Preview mode: AI generation is disabled in this demo environment.";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Une erreur est survenue";
}

function isBackendUnavailableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("failed to fetch") ||
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("unable to transform response") ||
    message.includes("unexpected token") ||
    message.includes("json") ||
    message.includes("not found") ||
    message.includes("404")
  );
}

export default function Result() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedTexture, setSelectedTexture] = useState<string>("");
  const [generatedLabel, setGeneratedLabel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);

  const generateMutation = trpc.label.generate.useMutation();

  useEffect(() => {
    const storedLogo = localStorage.getItem("logoPreview");
    const storedTexture = localStorage.getItem("selectedTexture");

    if (!storedLogo || !storedTexture) {
      setLocation("/");
      return;
    }

    setLogoPreview(storedLogo);
    setSelectedTexture(storedTexture);

    let isCancelled = false;

    async function safeGenerate(input: {
      logoDataUrl: string;
      textureType: "hd" | "hdcoton" | "satin" | "taffetas";
    }) {
      try {
        return await generateMutation.mutateAsync(input);
      } catch (error) {
        // Preview mode on Vercel should still attempt the real Express/tRPC
        // generation path first. We only fall back to a mock when the API is
        // actually unreachable, which keeps demo deploys safe without hiding
        // a working backend from client testing.
        if (isPreviewMode() && isBackendUnavailableError(error)) {
          console.warn("Preview mode: backend unavailable", error);
          return mockGeneration();
        }

        throw error;
      }
    }

    const runGeneration = async () => {
      try {
        const data = await safeGenerate({
          logoDataUrl: storedLogo,
          textureType: storedTexture as "hd" | "hdcoton" | "satin" | "taffetas",
        });
        const usedPreviewFallback = data.labelUrl === mockGeneration().labelUrl;

        if (isCancelled) return;

        setGeneratedLabel(data.labelUrl);
        setGenerationMessage(usedPreviewFallback ? PREVIEW_MODE_MESSAGE : null);
        setIsLoading(false);

        if (data.isFreeTrial && !usedPreviewFallback) {
          toast.success(t("result.title"));
        }
      } catch (error) {
        if (isCancelled) return;

        // Keep API failures inside the page instead of escalating to the root
        // error boundary. This prevents demo deployments from hard-crashing.
        setGenerationMessage(getErrorMessage(error));
        toast.error(getErrorMessage(error));
        setIsLoading(false);
      }
    };

    void runGeneration();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleDownload = async () => {
    if (!generatedLabel) return;

    try {
      const response = await fetch(generatedLabel);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiquette-griffes-vivienne-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Téléchargement démarré !");
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
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
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("result.newLabel")}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 animate-fade-in">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse-gold">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {t("prepare.generating")}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t("prepare.creating")}
              </p>
              <div className="max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-shimmer"></div>
              </div>
            </div>
          ) : generatedLabel ? (
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <p className="text-sm text-primary font-medium mb-2">Votre premier essai offert.</p>
                <h2 className="text-4xl font-bold text-foreground mb-4">
                  Votre étiquette tissée
                </h2>
                {generationMessage ? (
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    {generationMessage}
                  </p>
                ) : null}
              </div>

              {/* Result Display */}
              <Card className="p-8 mb-8 border-2 border-primary/20">
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl mb-6">
                    <img
                      src={generatedLabel}
                      alt="Étiquette générée"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleDownload}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t("result.download")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        localStorage.clear();
                        setLocation("/");
                      }}
                    >
                      {t("result.newLabel")}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Credit Prompt */}
              <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {t("result.title")}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t("result.subtitle")}
                  </p>
                  <p className="text-sm text-muted-foreground mb-8">
                    {t("result.description")}
                  </p>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-12"
                    onClick={() => setLocation("/credits")}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {t("result.buyCredits")}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    {t("result.explore")} <strong className="text-primary">{t("result.yourCredits")}</strong>
                  </p>
                  <button
                    className="text-sm text-primary hover:underline mt-2"
                    onClick={() => setLocation("/about")}
                  >
                    {t("result.learnMore")} →
                  </button>
                </div>
              </Card>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Une erreur est survenue</p>
              <Button onClick={() => setLocation("/")} className="mt-4">
                Retour à l'accueil
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
