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
  SHOP_SECTIONS,
  WEEKLY_REWARDS,
  applyOfferPurchase,
  claimWeeklyReward,
  formatTomans,
  getCurrentRewardState,
  type ShopSection,
} from "@/lib/shop";
import bannerImage from "@/assets/banner.png";
import coinImage from "@/assets/coin.png";
import coinStackImage from "@/assets/5coins.png";
import coinBagImage from "@/assets/bag of coins.png";
import coinChestImage from "@/assets/chest of coins.png";
import coinComboImage from "@/assets/chest and bag of coins.png";
import coinDoubleChestImage from "@/assets/2chests of coins.png";
import diamondImage from "@/assets/diamond.png";
import diamondTripleImage from "@/assets/3gems.png";
import diamondBagImage from "@/assets/bag of diamonds.png";
import diamondChestImage from "@/assets/chest of diamonds.png";
import diamondComboImage from "@/assets/chest and bag of diamonds.png";
import diamondDoubleChestImage from "@/assets/2chests of diamonds.png";
import merchantImage from "@/assets/merchant.png";
import merchantGirlImage from "@/assets/merchant girl.png";
import merchantTwoImage from "@/assets/merchant2.png";
import merchantGirlTwoImage from "@/assets/merchant girl2.png";
import merchantThreeImage from "@/assets/merchant3.png";
import merchantGirlThreeImage from "@/assets/merchant girl3.png";
import fireImage from "@/assets/fire.png";

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
  const rewardState = useMemo(
    () => getCurrentRewardState(user?.id),
    [user?.id, message]
  );
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const sectionKey = searchParams.get("section");
    if (!sectionKey) return;
    const target = sectionRefs.current[sectionParamMap[sectionKey]];
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  const handleOfferPurchase = (
    sectionId: ShopSection["id"],
    offerId: string
  ) => {
    applyOfferPurchase(user?.id, sectionId, offerId);
    setMessage(t("purchaseSuccess"));
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
    </AppPageShell>
  );
}
