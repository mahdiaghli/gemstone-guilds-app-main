import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

export default function AuthLanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#f5d47a]/30 bg-black/30 p-1">
      <Button
        type="button"
        variant={lang === "en" ? "default" : "ghost"}
        className="rounded-full px-4 py-1 text-xs"
        onClick={() => setLang("en")}
      >
        {t("english")}
      </Button>
      <Button
        type="button"
        variant={lang === "fa" ? "default" : "ghost"}
        className="rounded-full px-4 py-1 text-xs"
        onClick={() => setLang("fa")}
      >
        {t("persian")}
      </Button>
    </div>
  );
}
