import { useLocation } from "wouter";
import { Sparkles, Download, CreditCard, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function Account() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const { data: generations, isLoading } = trpc.label.getUserGenerations.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: creditInfo } = trpc.credits.getBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success(t("account.logout.success"));
      setLocation("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `etiquette-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      toast.success(t("account.download.success"));
    } catch (error) {
      toast.error(t("account.download.error"));
    }
  };

  if (!isAuthenticated || !user) {
    setLocation("/");
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
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("header.home")}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {t("header.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 animate-fade-in">
        <div className="max-w-6xl mx-auto">
          {/* User Info */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-2">{t("account.title")}</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          {/* Credits Card */}
          <Card className="p-8 mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {t("account.yourCredits")}
                </h3>
                <p className="text-muted-foreground">
                  {creditInfo?.hasUsedFreeTrial
                    ? t("account.trialUsed")
                    : t("account.trialAvailable")}
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-primary mb-2">
                  {user.creditBalance}
                </div>
                <Button
                  onClick={() => setLocation("/credits")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t("result.buyCredits")}
                </Button>
              </div>
            </div>
          </Card>

          {/* Generations History */}
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-6">
              {t("account.myGenerations")}
            </h3>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t("account.loading")}</p>
              </div>
            ) : generations && generations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generations.map((gen) => (
                  <Card key={gen.id} className="overflow-hidden">
                    <div className="aspect-[2/1] relative bg-muted">
                      <img
                        src={gen.labelUrl}
                        alt="Étiquette générée"
                        className="w-full h-full object-cover"
                      />
                      {gen.isFreeTrial === 1 && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                          {t("account.freeTrial")}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {gen.textureType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(gen.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDownload(gen.labelUrl)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t("result.download")}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {t("account.noGenerations")}
                </p>
                <Button onClick={() => setLocation("/")}>
                  {t("account.createFirst")}
                </Button>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
