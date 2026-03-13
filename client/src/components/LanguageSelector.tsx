import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("fr")}
        className={language === "fr" ? "font-semibold" : "text-muted-foreground"}
      >
        FR
      </Button>
      <span className="text-muted-foreground">/</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("en")}
        className={language === "en" ? "font-semibold" : "text-muted-foreground"}
      >
        EN
      </Button>
    </div>
  );
}
