"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATTRIBUTES = void 0;
exports.startBattle = startBattle;
exports.playRound = playRound;
exports.calculateRewards = calculateRewards;
exports.ATTRIBUTES = ['batting', 'bowling', 'fielding', 'captaincy', 'pressure'];
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function getAttributeValue(card, attr) {
    return card[attr] ?? 80;
}
function clamp(val, min = 60, max = 99) {
    return Math.max(min, Math.min(max, val));
}
function roleBaseStats(role, difficulty) {
    const rnd = () => Math.floor(Math.random() * 10) - 5;
    if (role === 'Batsman' || role === 'Wicketkeeper-Batsman') {
        return {
            batting: clamp(difficulty + rnd()),
            bowling: clamp(20 + Math.floor(difficulty * 0.25) + rnd(), 15, 55),
            fielding: clamp(65 + Math.floor(difficulty * 0.2) + rnd()),
            captaincy: clamp(50 + Math.floor(difficulty * 0.3) + rnd()),
            pressure: clamp(60 + Math.floor(difficulty * 0.3) + rnd()),
        };
    }
    if (role === 'Bowler') {
        return {
            batting: clamp(15 + Math.floor(difficulty * 0.25) + rnd(), 10, 55),
            bowling: clamp(difficulty + rnd()),
            fielding: clamp(60 + Math.floor(difficulty * 0.2) + rnd()),
            captaincy: clamp(45 + Math.floor(difficulty * 0.3) + rnd()),
            pressure: clamp(65 + Math.floor(difficulty * 0.3) + rnd()),
        };
    }
    // All-rounder
    return {
        batting: clamp(difficulty - 10 + rnd()),
        bowling: clamp(difficulty - 10 + rnd()),
        fielding: clamp(70 + Math.floor(difficulty * 0.15) + rnd()),
        captaincy: clamp(55 + Math.floor(difficulty * 0.25) + rnd()),
        pressure: clamp(65 + Math.floor(difficulty * 0.25) + rnd()),
    };
}
function generateAISquad(playerCards) {
    const roles = ['Batsman', 'Bowler', 'All-rounder', 'Batsman', 'Bowler'];
    // Large enough pool so we never repeat — shuffled and sliced to 5
    const aiNames = [
        'Shaheen Afridi', 'Mitchell Starc', 'Trent Boult', 'Kagiso Rabada', 'Rashid Khan',
        'David Warner', 'Quinton de Kock', 'AB de Villiers', 'Pat Cummins', 'Jasprit Bumrah',
        'Ben Stokes', 'Steve Smith', 'Kane Williamson', 'Babar Azam', 'Rohit Sharma',
        'Jos Buttler', 'Rishabh Pant', 'Glenn Maxwell', 'Hardik Pandya', 'Suryakumar Yadav',
        'Tim Southee', 'Anrich Nortje', 'Lockie Ferguson', 'Mark Wood', 'Wanindu Hasaranga',
    ];
    // Shuffle and take exactly 5 unique names
    const shuffledNames = shuffleArray(aiNames).slice(0, 5);
    const playerAvg = playerCards.reduce((sum, c) => {
        const attrSum = exports.ATTRIBUTES.reduce((s, a) => s + getAttributeValue(c, a), 0);
        return sum + (attrSum / exports.ATTRIBUTES.length);
    }, 0) / playerCards.length;
    const difficulty = Math.max(60, Math.min(95, playerAvg + Math.floor(Math.random() * 15) - 5));
    return roles.map((role, i) => {
        const base = roleBaseStats(role, difficulty);
        const avg = Math.round(exports.ATTRIBUTES.reduce((s, a) => s + base[a], 0) / exports.ATTRIBUTES.length);
        return {
            aiId: `ai_${i}`,
            name: shuffledNames[i],
            role,
            ...base,
            overall: avg,
        };
    });
}
function startBattle(playerCards) {
    const aiCards = generateAISquad(playerCards);
    const attributeOrder = shuffleArray(exports.ATTRIBUTES);
    const playerHand = playerCards.map((card) => {
        const avg = Math.round(exports.ATTRIBUTES.reduce((s, a) => s + getAttributeValue(card, a), 0) / exports.ATTRIBUTES.length);
        return {
            userCardId: card._id.toString(),
            name: card.name,
            role: card.role,
            batting: card.batting,
            bowling: card.bowling,
            fielding: card.fielding,
            captaincy: card.captaincy ?? 70,
            pressure: card.pressure ?? 70,
            overall: avg,
        };
    });
    return { aiCards, playerHand, attributeOrder };
}
function playRound(battle, aiCards, playerCardId) {
    const roundNumber = battle.rounds.length + 1;
    const playerCard = battle.playerSquad.find((c) => c.toString() === playerCardId || c._id?.toString() === playerCardId);
    const aiIndex = Math.floor(Math.random() * aiCards.length);
    const computerCard = aiCards.splice(aiIndex, 1)[0];
    const attribute = battle.attributeOrder[roundNumber - 1] || exports.ATTRIBUTES[roundNumber - 1] || 'batting';
    const playerStat = getAttributeValue(playerCard, attribute);
    const computerStat = getAttributeValue(computerCard, attribute);
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
    const cc = computerCard && typeof computerCard.toObject === 'function' ? computerCard.toObject() : computerCard;
    return {
        roundNumber,
        attribute,
        playerCard: { name: playerCard.name, stat: playerStat, attribute },
        computerCard: { ...cc, stat: computerStat, attribute },
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