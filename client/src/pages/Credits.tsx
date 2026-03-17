import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Check, CreditCard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

type CreditPack = {
  id: string;
  credits: number;
  price: number;
  popular?: boolean;
  features: string[];
};

export default function Credits() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);

  const creditPacks: CreditPack[] = [
    {
      id: "starter",
      credits: 5,
      price: 10,
      features: [
        `5 ${t("credits.feature.generations")}`,
        t("credits.feature.textures"),
        t("credits.feature.download"),
        t("credits.feature.valid6m"),
      ],
    },
    {
      id: "pro",
      credits: 15,
      price: 20,
      popular: true,
      features: [
        `15 ${t("credits.feature.generations")}`,
        t("credits.feature.textures"),
        t("credits.feature.download"),
        t("credits.feature.advanced"),
        t("credits.feature.valid1y"),
      ],
    },
    {
      id: "premium",
      credits: 50,
      price: 50,
      features: [
        `50 ${t("credits.feature.generations")}`,
        t("credits.feature.textures"),
        t("credits.feature.download"),
        t("credits.feature.advanced"),
        t("credits.feature.support"),
        t("credits.feature.valid2y"),
      ],
    },
  ];

  const handlePurchase = (packId: string) => {
    if (!isAuthenticated) {
      toast.info(t("toast.loginRequired"));
      window.location.href = getLoginUrl();
      return;
    }

    setSelectedPack(packId);
    // TODO: Intégrer Stripe pour le paiement
    toast.info(t("toast.paymentInProgress"));
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
              {t("header.back")}
            </Button>
            {isAuthenticated && user && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t("header.credits")}: </span>
                <span className="font-semibold text-primary">{user.creditBalance}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 animate-fade-in">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-foreground mb-4">
              {t("credits.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("credits.description")}
            </p>
          </div>

          {/* Credit Packs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {creditPacks.map((pack) => (
              <Card
                key={pack.id}
                className={`relative p-8 transition-all hover:shadow-xl ${
                  pack.popular
                    ? "border-2 border-primary shadow-lg scale-105"
                    : "border-2 border-border hover:border-primary/50"
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    {t("credits.popular")}
                  </div>
                )}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {pack.credits} {t("header.credits")}
                  </h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-primary">{pack.price}€</span>
                    <span className="text-muted-foreground">
                      ({(pack.price / pack.credits).toFixed(2)}{t("credits.perCredit")})
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {pack.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(pack.id)}
                  className={`w-full ${
                    pack.popular
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : ""
                  }`}
                  variant={pack.popular ? "default" : "outline"}
                  disabled={selectedPack === pack.id}
                >
                  {selectedPack === pack.id ? t("credits.processing") : t("credits.buy")}
                </Button>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <Card className="p-8 bg-muted/30">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              {t("credits.faq.title")}
            </h3>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {t("credits.faq.q1")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("credits.faq.a1")}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {t("credits.faq.q2")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("credits.faq.a2")}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  {t("credits.faq.q3")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("credits.faq.a3")}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
