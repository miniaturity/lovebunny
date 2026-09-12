import { goto } from "$app/navigation";
import { fetchMyScore, fetchScoreDistribution, submitScore } from "$lib/api/scores";
import { Game, MOVE_DICT, type GameParams, type MoveName } from "./game.svelte";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function shiftDate(dateStr: string, deltaDays: number): string {
    const t = new Date(`${dateStr}T00:00:00.000Z`).getTime();
    return new Date(t + deltaDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const TILE_SIZE = 16;

class GameManager {
    public gameParams = $state<GameParams>();
    public game = $state<Game>();
    public playbackGame = $state<Game>();
    public bestGame = $state<Game>();

    public today = $state<string>();
    public serverToday = $state<string>();
    public alreadyPlayedToday = $state(false);
    public scoreSubmitted = $state(false);
    public confirmedSubmission = $state(false);
    public submittingScore = $state(false);
    public loaded = $state(false);
    public distribution = $state<Record<string, number>>({});
    public totalPlayers = $state(0);

    public isNewUser = $state(false);
    public hasSeenTips = $state(true);
    public scoreMode = $state(true);

    public showIntroModal = $derived(this.isNewUser);
    public showWinModal = $derived(this.game?.status === "won" && this.scoreSubmitted);
    public showConfirmModal = $derived(this.game?.status === "won" && !this.scoreSubmitted);
    public canGoNext = $derived(
        this.today !== undefined &&
        this.serverToday !== undefined &&
        (this.today < this.serverToday || this.game?.status !== "playback")
    );

    initialize(gameParams: GameParams, today: string, serverToday: string) {
        this.gameParams = gameParams;
        this.today = today;
        this.serverToday = serverToday;

        this.game = new Game(...gameParams);
        this.bestGame = new Game(...gameParams);
        this.playbackGame = undefined;

        this.alreadyPlayedToday = false;
        this.scoreSubmitted = false;
        this.confirmedSubmission = false;
        this.submittingScore = false;
        this.loaded = false;

        void this.loadDayScore();
    }

    setReturningStatus(isReturningUser: boolean) {
        this.isNewUser = !isReturningUser;
        if (this.game && isReturningUser) {
            this.game.status = "playing";
        }
    }

    private async loadDayScore() {
        if (!this.today || !this.game) return;

        const existing = await fetchMyScore(this.today);

        if (existing) {
            this.alreadyPlayedToday = true;
            this.scoreSubmitted = true;
            this.loaded = true;
            await this.replayLockedSolution(existing.moves);
            void this.loadDistribution();
        } else {
            this.alreadyPlayedToday = false;
            this.scoreSubmitted = false;
            this.loaded = true;
            if (this.game.status !== "menu") this.game.status = "playing";
        }

        this.game.moves = existing?.moves ?? [];
    }

    async loadDistribution() {
        if (!this.today) return;
        try {
            const result = await fetchScoreDistribution(this.today);
            this.distribution = result.distribution;
            this.totalPlayers = result.totalPlayers;
        } catch (err) {
            console.error("Failed to load score distribution: " + err);
        }
    }

    async replayLockedSolution(existingMoves: MoveName[]) {
        if (!this.gameParams || !this.game) return;

        this.playbackGame = new Game(...this.gameParams);
        this.playbackGame.status = "playback";
        this.game.status = "playback";

        for (const move of existingMoves) {
            await sleep(150);
            this.stepPlayback(move);
        }

        this.playbackGame.status = "won";
        this.game.status = "won";
    }

    async playback(moves: MoveName[]) {
        if (!this.gameParams || !this.game || this.game.status !== "won") return;

        this.game.status = "playback";
        this.playbackGame = new Game(...this.gameParams);
        this.playbackGame.status = "playback";

        for (const move of moves) {
            await sleep(250);
            this.stepPlayback(move);
        }
    }

    private stepPlayback(move: MoveName) {
        if (!this.playbackGame) return;
        const { x, y } = MOVE_DICT[move];
        this.playbackGame.move(x, y);
    }

    mobileMove(move: MoveName) {
        if (!this.game) return;
        const { x, y } = MOVE_DICT[move];
        this.game.move(x, y);
    }

    play() {
        if (!this.game) return;
        this.game.status = "playing";
        this.isNewUser = false;
    }

    reset(playing = true) {
        if (!this.game || !this.gameParams) return;
        if (this.alreadyPlayedToday || (this.game.status === "won" && this.scoreSubmitted)) return;

        if (this.game.status === "won") {
            if (!this.bestGame) this.bestGame = new Game(...this.gameParams);
            if (this.bestGame.moves.length === 0 || this.bestGame.getScore() > this.game.getScore()) {
                this.bestGame.moves = [...this.game.moves];
                this.bestGame.a = { ...this.game.a };
                this.bestGame.b = { ...this.game.b };
            }
        }

        this.game = new Game(...this.gameParams);
        if (playing) this.game.status = "playing";
    }

    setToBest() {
        if (!this.game || !this.bestGame || this.bestGame.moves.length === 0) return;

        this.game.moves = [...this.bestGame.moves.slice(0, -1)];
        this.game.a = { ...this.bestGame.a };
        this.game.b = { ...this.bestGame.b };

        const lastMove = this.bestGame.moves[this.bestGame.moves.length - 1];
        const { x, y } = MOVE_DICT[lastMove];
        this.game.move(x, y);

        this.game.status = "won";
    }

    confirmSubmission() {
        this.confirmedSubmission = true;
        void this.trySubmitScore();
    }

    private async trySubmitScore() {
        if (!this.game || !this.today) return;
        if (this.game.status !== "won" || this.scoreSubmitted || this.submittingScore || !this.confirmedSubmission) return;

        this.submittingScore = true;
        const result = await submitScore(this.today, this.game.moves);
        this.submittingScore = false;

        if (result.ok || result.alreadyPlayed) {
            this.scoreSubmitted = true;
            void this.loadDistribution();
        } else {
            this.confirmedSubmission = false;
            alert("Couldn't submit your score. Don't try to cheat! If you aren't cheating, send a bug report to @miniaturity.");
        }
    }

    closeModal() {
        if (this.game?.status === "menu") this.game.status = "playing";
    }

    async lastDay() {
        await this.changeDay(-1);
    }

    async nextDay() {
        await this.changeDay(1);
    }

    private async changeDay(direction: -1 | 1) {
        if (!this.today || !this.game) return;
        if (direction === -1 && this.game.day === 1) return;
        if (!this.canGoNext) return;

        const target = shiftDate(this.today, direction);
        try {
            await goto(`/?date=${target}`);
        } catch (err) {
            console.error(err);
            await goto("/");
        }
    }
}

export const gameManager = new GameManager();