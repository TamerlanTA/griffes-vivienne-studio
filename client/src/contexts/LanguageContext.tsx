import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "fr" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved === "en" || saved === "fr") ? saved : "fr";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translations = language === "fr" ? translationsFr : translationsEn;
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Translations
const translationsFr: Record<string, string> = {
  // Header
  "header.title": "La Méthode",
  "header.subtitle": "Griffes Vivienne",
  "header.login": "Login",
  "header.account": "Mon compte",
  "header.back": "Retour",
  "header.home": "Accueil",
  "header.logout": "Déconnexion",
  "header.credits": "Crédits",

  // Home page
  "home.hero.title": "Transformer votre logo",
  "home.hero.subtitle": "en étiquette haut de gamme",
  "home.hero.description": "Générez une étiquette tissée professionnelle à partir de votre logo.",
  "home.hero.tech": "Technologie IA avancée pour un résultat impeccable.",
  "home.upload.title": "Déposez votre logo ici",
  "home.upload.subtitle": "ou cliquez pour sélectionner un fichier",
  "home.upload.formats": "PNG, JPG, SVG jusqu'à 10MB",
  "home.upload.change": "Changer le logo",
  "home.upload.button": "Voir mon étiquette",

  // Prepare page
  "prepare.title": "Votre logo est prêt.",
  "prepare.subtitle.line1": "Choisissez les bases",
  "prepare.subtitle.line2": "de votre étiquette avant génération.",
  "prepare.texture.hd": "HD",
  "prepare.texture.hd.desc": "Quadrillage serré haute définition",
  "prepare.texture.hdcoton": "HD Coton",
  "prepare.texture.hdcoton.desc": "Quadrillage serré aspect coton",
  "prepare.texture.satin": "Satin",
  "prepare.texture.satin.desc": "Léger drapé brillant orienté",
  "prepare.texture.taffetas": "Taffetas",
  "prepare.texture.taffetas.desc": "Tissage traditionnel standard",
  "prepare.options": "+ Options",
  "prepare.button": "Générer mon étiquette",
  "prepare.trial": "Premier essai offert.",
  "prepare.generating": "Génération en cours...",
  "prepare.creating": "Création de votre étiquette personnalisée avec IA...",

  // Result page
  "result.title": "Votre premier essai offert a été utilisé.",
  "result.subtitle": "Accéder à d'autres rendus nécessite des crédits.",
  "result.description": "Débloquez plus de libertés créatives en générant de nouvelles étiquettes à partir de votre logo, grâce à nos crédits.",
  "result.download": "Télécharger",
  "result.newLabel": "Nouvelle étiquette",
  "result.buyCredits": "Acheter des crédits",
  "result.explore": "Explorez librement en générant d'autres étiquettes avec",
  "result.yourCredits": "vos crédits.",
  "result.learnMore": "En savoir plus",

  // Credits page
  "credits.title": "Acheter des crédits",
  "credits.description": "Débloquez plus de libertés créatives en générant de nouvelles étiquettes à partir de votre logo, grâce à nos crédits.",
  "credits.popular": "Plus populaire",
  "credits.perCredit": "€/crédit",
  "credits.buy": "Acheter",
  "credits.processing": "Traitement...",
  "credits.faq.title": "Questions fréquentes",
  "credits.faq.q1": "Comment fonctionnent les crédits ?",
  "credits.faq.a1": "Chaque génération d'étiquette consomme 1 crédit. Vos crédits restent valables selon la durée indiquée dans votre pack.",
  "credits.faq.q2": "Puis-je télécharger mes anciennes générations ?",
  "credits.faq.a2": "Oui, toutes vos générations sont sauvegardées dans votre compte et peuvent être téléchargées à tout moment.",
  "credits.faq.q3": "Les crédits expirent-ils ?",
  "credits.faq.a3": "Oui, selon le pack choisi. Les crédits Starter sont valables 6 mois, Pro 1 an, et Premium 2 ans à partir de la date d'achat.",
  "credits.feature.generations": "générations d'étiquettes",
  "credits.feature.textures": "Toutes les textures disponibles",
  "credits.feature.download": "Téléchargement haute résolution",
  "credits.feature.advanced": "Options avancées incluses",
  "credits.feature.support": "Support prioritaire",
  "credits.feature.valid6m": "Valable 6 mois",
  "credits.feature.valid1y": "Valable 1 an",
  "credits.feature.valid2y": "Valable 2 ans",

  // Account page
  "account.title": "Mon compte",
  "account.credits.title": "Vos crédits",
  "account.credits.trialUsed": "Essai gratuit utilisé",
  "account.credits.trialAvailable": "Essai gratuit disponible",
  "account.generations.title": "Mes générations",
  "account.generations.loading": "Chargement...",
  "account.generations.empty": "Vous n'avez pas encore généré d'étiquettes",
  "account.generations.create": "Créer ma première étiquette",
  "account.generations.freeTrial": "Essai gratuit",
  "account.download.success": "Téléchargement démarré !",
  "account.download.error": "Erreur lors du téléchargement",
  "account.logout.success": "Déconnexion réussie",

  // Toasts
  "toast.loginRequired": "Veuillez vous connecter pour acheter des crédits",
  "toast.paymentInProgress": "Intégration du paiement en cours de développement",
};

const translationsEn: Record<string, string> = {
  // Header
  "header.title": "The Method",
  "header.subtitle": "Griffes Vivienne",
  "header.login": "Login",
  "header.account": "My account",
  "header.back": "Back",
  "header.home": "Home",
  "header.logout": "Logout",
  "header.credits": "Credits",

  // Home page
  "home.hero.title": "Transform your logo",
  "home.hero.subtitle": "into a premium label",
  "home.hero.description": "Generate a professional woven label from your logo.",
  "home.hero.tech": "Advanced AI technology for an impeccable result.",
  "home.upload.title": "Drop your logo here",
  "home.upload.subtitle": "or click to select a file",
  "home.upload.formats": "PNG, JPG, SVG up to 10MB",
  "home.upload.change": "Change logo",
  "home.upload.button": "View my label",

  // Prepare page
  "prepare.title": "Your logo is ready.",
  "prepare.subtitle.line1": "Choose the basics",
  "prepare.subtitle.line2": "of your label before generation.",
  "prepare.texture.hd": "HD",
  "prepare.texture.hd.desc": "Tight high-definition weave",
  "prepare.texture.hdcoton": "HD Cotton",
  "prepare.texture.hdcoton.desc": "Tight weave with cotton aspect",
  "prepare.texture.satin": "Satin",
  "prepare.texture.satin.desc": "Light oriented shiny drape",
  "prepare.texture.taffetas": "Taffeta",
  "prepare.texture.taffetas.desc": "Standard traditional weave",
  "prepare.options": "+ Options",
  "prepare.button": "Generate my label",
  "prepare.trial": "First try offered.",
  "prepare.generating": "Generating...",
  "prepare.creating": "Creating your custom label with AI...",

  // Result page
  "result.title": "Your first free trial has been used.",
  "result.subtitle": "Access to other renders requires credits.",
  "result.description": "Unlock more creative freedom by generating new labels from your logo, thanks to our credits.",
  "result.download": "Download",
  "result.newLabel": "New label",
  "result.buyCredits": "Buy credits",
  "result.explore": "Explore freely by generating other labels with",
  "result.yourCredits": "your credits.",
  "result.learnMore": "Learn more",

  // Credits page
  "credits.title": "Buy credits",
  "credits.description": "Unlock more creative freedom by generating new labels from your logo, thanks to our credits.",
  "credits.popular": "Most popular",
  "credits.perCredit": "€/credit",
  "credits.buy": "Buy",
  "credits.processing": "Processing...",
  "credits.faq.title": "Frequently asked questions",
  "credits.faq.q1": "How do credits work?",
  "credits.faq.a1": "Each label generation consumes 1 credit. Your credits remain valid according to the duration indicated in your pack.",
  "credits.faq.q2": "Can I download my old generations?",
  "credits.faq.a2": "Yes, all your generations are saved in your account and can be downloaded at any time.",
  "credits.faq.q3": "Do credits expire?",
  "credits.faq.a3": "Yes, depending on the pack chosen. Starter credits are valid for 6 months, Pro for 1 year, and Premium for 2 years from the date of purchase.",
  "credits.feature.generations": "label generations",
  "credits.feature.textures": "All textures available",
  "credits.feature.download": "High resolution download",
  "credits.feature.advanced": "Advanced options included",
  "credits.feature.support": "Priority support",
  "credits.feature.valid6m": "Valid for 6 months",
  "credits.feature.valid1y": "Valid for 1 year",
  "credits.feature.valid2y": "Valid for 2 years",

  // Account page
  "account.title": "My account",
  "account.credits.title": "Your credits",
  "account.credits.trialUsed": "Free trial used",
  "account.credits.trialAvailable": "Free trial available",
  "account.generations.title": "My generations",
  "account.generations.loading": "Loading...",
  "account.generations.empty": "You haven't generated any labels yet",
  "account.generations.create": "Create my first label",
  "account.generations.freeTrial": "Free trial",
  "account.download.success": "Download started!",
  "account.download.error": "Download error",
  "account.logout.success": "Logout successful",

  // Toasts
  "toast.loginRequired": "Please log in to buy credits",
  "toast.paymentInProgress": "Payment integration in progress",
};
