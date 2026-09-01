import { useEffect, useMemo, useRef, useState } from "react";
import { Check, PlayCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

import AppPageShell from "@/components/game/AppPageShell";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// 👇 این خط اضافه شد تا مشکل Button حل شود
import { Button } from "@/components/ui/button"; 
import { shellBackgrounds } from "@/lib/pageBackgrounds";
import {
  PREMIUM_PLANS,
  SHOP_SECTIONS,
  WEEKLY_REWARDS,
  applyOfferPurchase,
  canGrantPaidReward,
  claimWeeklyReward,
  formatTomans,
  getCurrentRewardState,
  getPremiumStatus,
  purchasePremiumPlan,
  type PremiumPlanId,
  type ShopSection,
  type StoreProvider,
} from "@/lib/shop";
import { getNativePlatform, isAndroidApp, isIosApp } from "@/lib/nativeApp";
import bannerImage from "@/assets/banner.webp";
import coinImage from "@/assets/coin.webp";
import coinStackImage from "@/assets/5coins.webp";
import coinBagImage from "@/assets/bag of coins.webp";
import coinChestImage from "@/assets/chest of coins.webp";
import coinComboImage from "@/assets/chest and bag of coins.webp";
import coinDoubleChestImage from "@/assets/2chests of coins (1).webp";
import diamondImage from "@/assets/diamond.webp";
import diamondTripleImage from "@/assets/3gems.webp";
import diamondBagImage from "@/assets/bag of diamonds.webp";
import diamondChestImage from "@/assets/chest of diamonds.webp";
import diamondComboImage from "@/assets/chest and bag of diamonds.webp";
import diamondDoubleChestImage from "@/assets/2chests of diamonds.webp";
import merchantImage from "@/assets/merchant.webp";
import merchantGirlImage from "@/assets/merchant girl.webp";
import merchantTwoImage from "@/assets/merchant2.webp";
import merchantGirlTwoImage from "@/assets/merchant girl2.webp";
import merchantThreeImage from "@/assets/merchant3.webp";
import merchantGirlThreeImage from "@/assets/merchant girl3.webp";
import fireImage from "@/assets/fire.webp";

const sectionParamMap: Record<string, ShopSection["id"]> = {
  coins: "coins",
  diamonds: "diamonds",
  stickers: "stickers",
  avatars: "avatars",
};

const rewardImageMap = {
  coins: coinImage,
  gems: diamondImage,
  sticker: fireImage,
  avatar: merchantImage,
};

const offerImageMap: Record<ShopSection["id"], string[]> = {
  coins: [
    coinImage,
    coinStackImage,
    coinBagImage,
    coinChestImage,
    coinComboImage,
    coinDoubleChestImage,
  ],
  diamonds: [
    diamondImage,
    diamondTripleImage,
    diamondBagImage,
    diamondChestImage,
    diamondComboImage,
    diamondDoubleChestImage,
  ],
  stickers: [fireImage, fireImage, fireImage, fireImage, fireImage, fireImage],
  avatars: [
    merchantImage,
    merchantGirlImage,
    merchantTwoImage,
    merchantGirlTwoImage,
    merchantThreeImage,
    merchantGirlThreeImage,
  ],
};

export default function Shop() {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlanId | null>(null);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const isFa = dir === "rtl";
  const nativePlatform = getNativePlatform();
  const availableProviders: StoreProvider[] = isIosApp()
    ? ["app-store"]
    : isAndroidApp()
      ? ["cafe-bazaar", "myket"]
      : ["app-store", "cafe-bazaar", "myket"];
  const rewardState = useMemo(
    () => getCurrentRewardState(user?.id),
    [user?.id, message]
  );
  const premiumStatus = useMemo(
    () => getPremiumStatus(user?.id),
    [user?.id, message]
  );
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const sectionKey = searchParams.get("section");
    if (!sectionKey || sectionKey === "premium") return;
    const target = sectionRefs.current[sectionParamMap[sectionKey]];
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("reason") !== "premium-required") return;
    setMessage(
      isFa
        ? "برای بازی محلی یا آنلاین باید یکی از اشتراک‌های پرمیوم را بخرید."
        : "A premium subscription is required before local or online play.",
    );
  }, [isFa, searchParams]);

  const handleOfferPurchase = (
    sectionId: ShopSection["id"],
    offerId: string
  ) => {
    const result = applyOfferPurchase(user?.id, sectionId, offerId);
    setMessage(result.ok ? t("purchaseSuccess") : (isFa
      ? "خرید فقط در فروشگاه برنامه در دسترس است."
      : "Purchases are only available in the app stores."));
  };

  const handleClaimReward = () => {
    const rewardIndex = rewardState.rewardIndex;
    const avatarChoice =
      rewardIndex === 3
        ? window.confirm(`${t("merchantGirl")}؟`)
          ? "merchantGirl"
          : "merchant"
        : undefined;
    const reward = claimWeeklyReward(user?.id, avatarChoice);
    setMessage(reward ? t("dailyRewardSuccess") : t("dailyRewardClaimed"));
  };

  const handlePremiumPurchase = async (provider: StoreProvider) => {
    if (!selectedPlan || isProcessingPurchase) return;

    setIsProcessingPurchase(true);
    const result = await purchasePremiumPlan(user?.id, selectedPlan, provider);
    setIsProcessingPurchase(false);
    setSelectedPlan(null);

    setMessage(
      result.ok
        ? isFa
          ? "اشتراک پرمیوم فعال شد. ۲۰ الماس اضافه هم به حساب شما اضافه شد."
          : "Premium activated. 20 bonus diamonds were added to your account."
        : isFa
          ? "خرید کامل نشد. دوباره تلاش کنید."
          : "The purchase did not complete. Please try again.",
    );
  };

  const getProviderLabel = (provider: StoreProvider) => {
    if (provider === "app-store") return "App Store";
    if (provider === "cafe-bazaar") return "Cafe Bazaar";
    return "Myket";
  };

  const getPremiumPlanText = (planId: PremiumPlanId) => {
    if (planId === "premium-monthly") {
      return isFa
        ? { title: "پرمیوم یک‌ماهه", subtitle: "۹۹ تومان", duration: "۳۰ روز" }
        : { title: "1-Month Premium", subtitle: "99 tomans", duration: "30 days" };
    }

    if (planId === "premium-quarterly") {
      return isFa
        ? { title: "پرمیوم سه‌ماهه", subtitle: "۱۹۹ تومان", duration: "۹۰ روز" }
        : { title: "3-Month Premium", subtitle: "199 tomans", duration: "90 days" };
    }

    return isFa
      ? { title: "پرمیوم یک‌ساله", subtitle: "۵۹۹ تومان", duration: "۳۶۵ روز" }
      : { title: "1-Year Premium", subtitle: "599 tomans", duration: "365 days" };
  };

  const avatarNameKeys = [
    "avatarName1",
    "avatarName2",
    "avatarName3",
    "avatarName4",
    "avatarName5",
    "avatarName6",
  ] as const;

  /** -----------------------------
   *  کارت Offer تقریباً مربعی
   *  ----------------------------- */
  const renderOfferCard = (
    sectionId: ShopSection["id"],
    offer: ShopSection["offers"][number],
    index: number
  ) => {
    const image =
      offerImageMap[sectionId][index] || rewardImageMap[offer.rewardType];
    const amountLabel =
      sectionId === "avatars" ? t(avatarNameKeys[index]) : `${offer.amount}`;
    const costLabel =
      offer.price === 0 ? t("watchAd") : formatTomans(offer.price);

    const hasDiscount = offer.discount && offer.discount > 0;

    return (
      <motion.button
        key={offer.id}
        type="button"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        onClick={() => handleOfferPurchase(sectionId, offer.id)}
        disabled={offer.price > 0 && !canGrantPaidReward(window.GemstoneNativeBilling)}
        className={[
          "group relative flex flex-col items-center justify-between",
          // نسبت نزدیک به مربعی (کمی پهن‌تر برای زیبایی)
          "aspect-[4/5]",
          "overflow-visible rounded-[24px] border border-primary/20",
          "bg-[linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]",
          "p-3.5 text-center shadow-lg",
          "transition-all hover:-translate-y-1 hover:border-primary/40",
        ].join(" ")}
      >
        {/* نوار نور بالا */}
        <div className="absolute inset-x-3 top-1 h-[2px] rounded-full bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0" />

        {/* Badge تخفیف (فقط اگر تخفیف داشت) */}
        {hasDiscount && (
          <div
            className={[
              "absolute -top-2 rounded-full border border-primary/40 bg-card px-2 py-0.5",
              "text-[10px] font-semibold text-primary shadow-lg",
              dir === "rtl" ? "-left-1" : "-right-1",
            ].join(" ")}
          >
            %{offer.discount}
          </div>
        )}

        {/* مقدار / نام آواتار */}
        <div className="mt-1 text-sm font-bold text-primary">
          {amountLabel}
        </div>

        {/* تصویر - کمی کوچک‌تر نسبت به قبل */}
        <div className="flex flex-1 items-center justify-center py-2">
          <img
            src={image}
            alt={amountLabel}
            className={[
              "object-contain drop-shadow-[0_10px_26px_rgba(0,0,0,0.35)]",
              sectionId === "avatars"
                ? "h-20 w-16 rounded-2xl"
                : "h-16 w-16",
            ].join(" ")}
          />
        </div>

        {/* دکمه قیمت ؛ ارتفاع کم‌تر */}
        <div
          className={[
            "mt-1 flex w-full items-center justify-center gap-1.5 rounded-2xl",
            "border border-primary/15 bg-background/55 px-2.5 py-1.5",
            "text-xs font-semibold",
            dir === "rtl" ? "text-center" : "",
          ].join(" ")}
        >
          {offer.price === 0 && (
            <PlayCircle className="h-3.5 w-3.5 text-primary" />
          )}
          <span>{costLabel}</span>
        </div>
      </motion.button>
    );
  };
const renderRewardCard = (
  reward: (typeof WEEKLY_REWARDS)[number],
  actualIndex: number
) => {
  const isTodayReward = actualIndex === rewardState.rewardIndex;
  const isClaimed = rewardState.claimedToday && isTodayReward;
  const image =
    actualIndex === 0
      ? coinImage
      : actualIndex === 1
      ? diamondImage
      : actualIndex === 2
      ? coinImage
      : actualIndex === 3
      ? merchantGirlImage
      : actualIndex === 4
      ? coinStackImage
      : actualIndex === 5
      ? diamondTripleImage
      : coinStackImage;

  const amountLabel =
    reward.type === "coins"
      ? `${reward.amount}`
      : reward.type === "gems"
      ? `${reward.amount}`
      : "1";

  return (
    <button
      key={reward.day}
      type="button"
      onClick={() => {
        if (isTodayReward && !isClaimed) {
          handleClaimReward();
        }
      }}
      disabled={!isTodayReward || isClaimed}
      className={[
        "relative flex flex-col items-center justify-between",
        // مثل کارت‌های Offer: مستطیل بلندِ نزدیک به مربع
        "aspect-[4/5]",
        "rounded-[24px] border p-3.5 text-center transition-all",
        isTodayReward
          ? "border-primary/45 bg-primary/10 shadow-[0_0_0_1px_rgba(240,185,11,0.14)]"
          : "border-primary/10 bg-background/40",
        isClaimed ? "opacity-80" : "",
      ].join(" ")}
    >
      {isClaimed && (
        <div
          className={`absolute top-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 p-1 text-emerald-300 ${
            dir === "rtl" ? "left-2" : "right-2"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
        </div>
      )}

      {/* مقدار جایزه */}
      <div className="mt-0.5 text-sm font-bold text-primary">
        {amountLabel}
      </div>

      {/* تصویر – کمی کوچک‌تر تا فرم کارت کشیده بماند */}
      <div className="flex flex-1 items-center justify-center py-2">
        <img
          src={image}
          alt={`${reward.amount}`}
          className="h-14 w-14 rounded-2xl object-contain"
        />
      </div>

      {/* روز */}
      <div className="mb-0.5 text-xs font-semibold text-muted-foreground">
        {t("dayLabel")} {reward.day}
      </div>
    </button>
  );
};


  return (
    <AppPageShell currentPath="/shop" showHeader={false} backgroundImage={shellBackgrounds.shop}>
      <div className="space-y-6 pt-2" dir={dir}>
        <div className="rounded-[32px] bg-[radial-gradient(circle_at_top_right,rgba(107,216,255,0.18),transparent_34%),linear-gradient(145deg,rgba(14,26,52,0.96),rgba(12,20,40,0.92))] p-5 shadow-2xl">
          <div className="relative mb-5 overflow-hidden rounded-3xl">
            <img
              src={bannerImage}
              alt={isFa ? "اشتراک پرمیوم" : "Premium Subscription"}
              className="h-28 w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/60" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-primary">
              <h2 className="font-cinzel text-xl">
                {isFa ? "اشتراک پرمیوم" : "Premium Subscription"}
              </h2>
              <p className="mt-2 text-xs text-slate-100/85">
                {isFa
                  ? "برای شروع بازی محلی یا آنلاین باید اول اشتراک فعال داشته باشید. با هر خرید، ۲۰ الماس اضافه هم می‌گیرید."
                  : "Local and online play require an active subscription. Every purchase also grants 20 bonus diamonds."}
              </p>
              <p className="mt-1 text-[11px] text-slate-200/70">
                {isFa
                  ? nativePlatform === "ios"
                    ? "در آیفون پرداخت از طریق App Store انجام می‌شود."
                    : nativePlatform === "android"
                      ? "در اندروید پرداخت از طریق بازار یا مایکت انجام می‌شود."
                      : "برای تست وب، هر سه درگاه به‌صورت شبیه‌سازی‌شده در دسترس هستند."
                  : nativePlatform === "ios"
                    ? "On iPhone, purchases go through the App Store."
                    : nativePlatform === "android"
                      ? "On Android, purchases go through Cafe Bazaar or Myket."
                      : "In web testing, all providers remain available as simulated options."}
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-3xl border border-primary/20 bg-background/30 px-4 py-3 text-sm text-slate-100/90">
            {premiumStatus.active
              ? isFa
                ? `اشتراک فعال است. ${premiumStatus.remainingDays} روز دیگر باقی مانده است.`
                : `Premium is active. ${premiumStatus.remainingDays} day(s) remaining.`
              : isFa
                ? "هنوز اشتراک فعالی ندارید."
                : "No active premium subscription yet."}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PREMIUM_PLANS.map((plan) => {
              const copy = getPremiumPlanText(plan.id);
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className="rounded-[28px] border border-primary/25 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 text-center shadow-lg transition-all hover:-translate-y-1 hover:border-primary/50"
                >
                  <div className="mb-2 text-lg font-bold text-primary">{copy.title}</div>
                  <div className="mb-1 text-sm text-slate-100">{copy.subtitle}</div>
                  <div className="text-xs text-slate-300">{copy.duration}</div>
                  <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    {isFa ? "۲۰ الماس جایزه" : "20 bonus diamonds"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {SHOP_SECTIONS.map((section) => (
          <div
            key={section.id}
            ref={(node) => {
              sectionRefs.current[section.id] = node;
            }}
            className="rounded-[32px] bg-[radial-gradient(circle_at_top_right,rgba(255,215,120,0.16),transparent_32%),linear-gradient(145deg,rgba(21,24,40,0.95),rgba(26,31,48,0.88))] p-5 shadow-2xl"
          >
            <div className="relative mb-5 overflow-hidden rounded-3xl">
              <img
                src={bannerImage}
                alt={t(section.bannerTitleKey)}
                className="h-24 w-full object-cover"
              />
              <div className="absolute inset-0 bg-background/35" />
              <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-primary">
                <h2 className="font-cinzel text-xl">
                  {t(section.bannerTitleKey)}
                </h2>
              </div>
            </div>

            {/* کارت‌ها در گرید سه‌ستونی؛ خود کارت‌ها aspect-[4/5] هستند */}
            <div className="grid grid-cols-3 gap-4">
              {section.offers.map((offer, index) =>
                renderOfferCard(section.id, offer, index)
              )}
            </div>
          </div>
        ))}

        <div className="rounded-[32px] bg-[radial-gradient(circle_at_top_right,rgba(107,216,255,0.16),transparent_36%),linear-gradient(145deg,rgba(15,30,44,0.95),rgba(22,42,63,0.88))] p-3 shadow-2xl">
          <div className="relative mb-5 overflow-hidden rounded-3xl">
            <img
              src={bannerImage}
              alt={t("weeklyRewards")}
              className="h-24 w-full object-cover"
            />
            <div className="absolute inset-0 bg-background/35" />
            <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-primary">
              <h2 className="font-cinzel text-xl">{t("weeklyRewards")}</h2>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {WEEKLY_REWARDS.slice(0, 4).map((reward, index) =>
              renderRewardCard(reward, index)
            )}
          </div>
          <div className="mt-3 flex justify-center">
            <div className="grid grid-cols-3 gap-3">
              {WEEKLY_REWARDS.slice(4).map((reward, index) =>
                renderRewardCard(reward, index + 4)
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(message)} onOpenChange={(open) => !open && setMessage(null)}>
        <DialogContent className="max-w-sm rounded-[28px]" dir={dir}>
          <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
            <DialogTitle>{t("shopTitle")}</DialogTitle>
          </DialogHeader>
          <p className={dir === "rtl" ? "text-right" : ""}>{message}</p>
          <Button onClick={() => setMessage(null)}>{t("continueLabel")}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedPlan)} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="max-w-sm rounded-[28px]" dir={dir}>
          <DialogHeader className={dir === "rtl" ? "text-right" : ""}>
            <DialogTitle>{isFa ? "انتخاب مارکت" : "Choose a store"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className={dir === "rtl" ? "text-right text-sm" : "text-sm"}>
              {isFa
                ? "پرداخت داخل برنامه را از فروشگاه مناسب دستگاه شروع کنید."
                : "Start the in-app purchase with the store for this device."}
            </p>
            {availableProviders.map((provider, index) => (
              <Button
                key={provider}
                disabled={isProcessingPurchase}
                variant={index === 0 ? "default" : "secondary"}
                onClick={() => handlePremiumPurchase(provider)}
              >
                {isProcessingPurchase
                  ? (isFa ? "در حال اتصال..." : "Connecting...")
                  : getProviderLabel(provider)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppPageShell>
  );
}
