import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import GameHeader from "@/components/game/GameHeader";
import { LanguageProvider } from "@/hooks/useLanguage";

describe("Splendor game header", () => {
  it("shows a critical circular timer without the game or opponent name", () => {
    const html = renderToStaticMarkup(
      <LanguageProvider>
      <GameHeader
        gameMode="online"
        phase="idle"
        lang="fa"
        t={(key) => key}
        gameTitle=""
        stateCurrentPlayerIndex={1}
        humanPlayerCount={2}
        turnSecondsLeft={5}
        turnDurationSeconds={15}
        getPlayerDisplayName={() => "Opponent Name"}
        isCurrentPlayerMe={() => false}
        isAIPlayer={() => false}
        onShowQuickRules={() => undefined}
        onExit={() => undefined}
        socket={null}
        roomId="room"
        playerId="player"
        playerName="Me"
        roomPlayers={{}}
      />
      </LanguageProvider>,
    );

    expect(html).not.toContain("Splendor");
    expect(html).not.toContain("Opponent Name");
    expect(html).toContain('role="timer"');
    expect(html).toContain('aria-label="turnTimeLeft: 5 secondsShort"');
    expect(html).toContain("text-red-300");
  });
});
