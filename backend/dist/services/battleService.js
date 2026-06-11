"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBattle = startBattle;
exports.playRound = playRound;
exports.calculateRewards = calculateRewards;
function getMainStat(player) {
    if (player.role === 'Batsman' || player.role === 'Wicketkeeper-Batsman') {
        return player.batting;
    }
    if (player.role === 'Bowler') {
        return player.bowling;
    }
    return Math.round((player.batting + player.bowling) / 2);
}
function generateAISquad(playerCards) {
    const roles = ['Batsman', 'Bowler', 'All-rounder', 'Batsman', 'Bowler'];
    const aiNames = [
        'Shaheen Afridi', 'Mitchell Starc', 'Trent Boult', 'Kagiso Rabada', 'Rashid Khan',
        'David Warner', 'Quinton de Kock', 'AB de Villiers',
    ];
    const playerAvg = playerCards.reduce((sum, c) => sum + getMainStat(c), 0) / playerCards.length;
    const difficulty = Math.max(60, Math.min(95, playerAvg + Math.floor(Math.random() * 15) - 5));
    return roles.map((role, i) => ({
        name: aiNames[Math.floor(Math.random() * aiNames.length)],
        role,
        stat: role === 'Bowler'
            ? Math.max(60, Math.min(99, difficulty + Math.floor(Math.random() * 10) - 5))
            : Math.max(60, Math.min(99, difficulty + Math.floor(Math.random() * 10) - 5)),
    }));
}
function startBattle(playerCards) {
    const aiCards = generateAISquad(playerCards);
    const playerHand = playerCards.map((card) => {
        const stat = getMainStat(card);
        return {
            userCardId: card._id.toString(),
            name: card.name,
            role: card.role,
            stat,
        };
    });
    return { aiCards, playerHand };
}
function playRound(battle, aiCards, playerCardId) {
    const roundNumber = battle.rounds.length + 1;
    const playerCard = battle.playerSquad.find((c) => c.toString() === playerCardId || c._id?.toString() === playerCardId);
    const aiIndex = Math.floor(Math.random() * aiCards.length);
    const computerCard = aiCards.splice(aiIndex, 1)[0];
    const playerPlayer = playerCard;
    const playerStat = getMainStat(playerPlayer);
    const computerStat = computerCard.stat;
    let winner;
    if (playerStat > computerStat) {
        winner = 'player';
    }
    else if (computerStat > playerStat) {
        winner = 'computer';
    }
    else {
        winner = 'tie';
    }
    const playerScore = battle.playerScore + (winner === 'player' ? 1 : 0);
    const computerScore = battle.computerScore + (winner === 'computer' ? 1 : 0);
    const isOver = roundNumber >= 5 || playerCardId === 'last';
    let battleResult = null;
    let trophiesEarned = 0;
    let xpEarned = 0;
    if (isOver) {
        if (playerScore > computerScore) {
            battleResult = 'player';
            trophiesEarned = 20 + Math.floor(Math.random() * 10);
            xpEarned = 50 + Math.floor(Math.random() * 20);
        }
        else if (computerScore > playerScore) {
            battleResult = 'computer';
            trophiesEarned = 5;
            xpEarned = 15;
        }
        else {
            battleResult = 'tie';
            trophiesEarned = 10;
            xpEarned = 30;
        }
    }
    return {
        roundNumber,
        playerCard: { name: playerPlayer.name, stat: playerStat },
        computerCard,
        winner,
        playerScore,
        computerScore,
        isOver,
        battleResult,
        trophiesEarned,
        xpEarned,
    };
}
async function calculateRewards(battleResult) {
    if (battleResult === 'player') {
        return {
            coins: 100 + Math.floor(Math.random() * 50),
            xp: 50 + Math.floor(Math.random() * 20),
            trophies: 20 + Math.floor(Math.random() * 10),
        };
    }
    if (battleResult === 'computer') {
        return {
            coins: 20,
            xp: 15,
            trophies: 5,
        };
    }
    return {
        coins: 50,
        xp: 30,
        trophies: 10,
    };
}
//# sourceMappingURL=battleService.js.map