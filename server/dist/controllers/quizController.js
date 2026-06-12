"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuizQuestions = getQuizQuestions;
exports.submitQuizAnswer = submitQuizAnswer;
const User_1 = __importDefault(require("../models/User"));
const errors_1 = require("../utils/errors");
// Cricket quotes bank — spicy, controversial, iconic
const QUOTES = [
    {
        id: 'q1',
        quote: "Cricket is a game which the English, not being a spiritual people, have invented in order to give themselves some conception of eternity.",
        speaker: 'Nasser Hussain',
        options: ['Nasser Hussain', 'Ricky Ponting', 'Steve Waugh', 'Michael Atherton'],
        explanation: 'Nasser Hussain famously made this philosophical observation about the game.',
        category: 'Philosophy',
        difficulty: 'hard',
    },
    {
        id: 'q2',
        quote: "I want to play against the best. I want to beat the best. I don't want to win by default.",
        speaker: 'Virat Kohli',
        options: ['Virat Kohli', 'MS Dhoni', 'Rohit Sharma', 'Sachin Tendulkar'],
        explanation: 'Kohli said this during a press conference reflecting his competitive mindset.',
        category: 'Mindset',
        difficulty: 'medium',
    },
    {
        id: 'q3',
        quote: "I have been asked by many people why I never sledged. My answer has always been simple: I respected my opponents too much.",
        speaker: 'Sachin Tendulkar',
        options: ['Sachin Tendulkar', 'Brian Lara', 'Ricky Ponting', 'Jacques Kallis'],
        explanation: 'Sachin Tendulkar spoke about his philosophy of playing cricket with respect.',
        category: 'Sportsmanship',
        difficulty: 'medium',
    },
    {
        id: 'q4',
        quote: "If you want to be a champion, you have to take the toughest blows without whimpering.",
        speaker: 'Steve Waugh',
        options: ['Steve Waugh', 'Allan Border', 'Mark Taylor', 'Ian Chappell'],
        explanation: 'Steve Waugh — arguably the toughest Australian captain — lived by this mantra.',
        category: 'Mindset',
        difficulty: 'medium',
    },
    {
        id: 'q5',
        quote: "I never wanted to be just a cricketer. I wanted to be an entertainer, an icon. And I have done it.",
        speaker: 'Shahid Afridi',
        options: ['Shahid Afridi', 'Shoaib Akhtar', 'Inzamam-ul-Haq', 'Wasim Akram'],
        explanation: "Boom Boom Afridi's self-belief has always been unmistakable.",
        category: 'Confidence',
        difficulty: 'easy',
    },
    {
        id: 'q6',
        quote: "Pressure is a privilege — it only comes to those who earn it.",
        speaker: 'Billie Jean King',
        options: ['MS Dhoni', 'Billie Jean King', 'Sachin Tendulkar', 'Ricky Ponting'],
        explanation: "Though not a cricket quote originally, MS Dhoni adopted this as a personal motto often quoted in cricket contexts.",
        category: 'Pressure',
        difficulty: 'hard',
    },
    {
        id: 'q7',
        quote: "I don't go to the press with problems. I go to the press to tell them what I've achieved.",
        speaker: 'Kevin Pietersen',
        options: ['Kevin Pietersen', 'Andrew Flintoff', 'Michael Vaughan', 'Alastair Cook'],
        explanation: 'KP was famously at odds with the England dressing room and media for much of his career.',
        category: 'Controversy',
        difficulty: 'easy',
    },
    {
        id: 'q8',
        quote: "The crowd's excitement gives me energy. I feed off the roar of the stadium.",
        speaker: 'Shoaib Akhtar',
        options: ['Shoaib Akhtar', 'Brett Lee', 'Dale Steyn', 'Waqar Younis'],
        explanation: "The Rawalpindi Express always thrived on crowd energy at his home ground.",
        category: 'Performance',
        difficulty: 'easy',
    },
    {
        id: 'q9',
        quote: "People throw stones at you and you convert them into milestones.",
        speaker: 'Sachin Tendulkar',
        options: ['Sachin Tendulkar', 'Rahul Dravid', 'VVS Laxman', 'Sourav Ganguly'],
        explanation: 'Tendulkar reflected on overcoming criticism and adversity throughout his legendary career.',
        category: 'Resilience',
        difficulty: 'medium',
    },
    {
        id: 'q10',
        quote: "Cricket is a sport. It's not a matter of life and death. It is more important than that.",
        speaker: 'W.G. Grace',
        options: ['W.G. Grace', 'Don Bradman', 'Len Hutton', 'Jack Hobbs'],
        explanation: 'A paraphrase attributed to early cricket legends expressing the game\'s cultural weight.',
        category: 'Philosophy',
        difficulty: 'hard',
    },
    {
        id: 'q11',
        quote: "I've always believed that if you put in the work, the results will come.",
        speaker: 'Michael Clarke',
        options: ['Michael Clarke', 'Ricky Ponting', 'Adam Gilchrist', 'Steve Smith'],
        explanation: 'Michael Clarke spoke about his work ethic after returning from multiple injuries.',
        category: 'Work Ethic',
        difficulty: 'medium',
    },
    {
        id: 'q12',
        quote: "My bat is the only weapon I need. And I'm very good at using it.",
        speaker: 'Virender Sehwag',
        options: ['Virender Sehwag', 'Chris Gayle', 'AB de Villiers', 'Brendon McCullum'],
        explanation: 'Sehwag — known for his brutal, no-nonsense hitting — summed up his philosophy perfectly.',
        category: 'Confidence',
        difficulty: 'easy',
    },
    {
        id: 'q13',
        quote: "Winning is a habit. Unfortunately, so is losing.",
        speaker: 'Vince Lombardi',
        options: ['MS Dhoni', 'Vince Lombardi', 'Ricky Ponting', 'Imran Khan'],
        explanation: 'This quote from Vince Lombardi has been widely adopted and quoted in cricket dressing rooms, including by MS Dhoni.',
        category: 'Mindset',
        difficulty: 'hard',
    },
    {
        id: 'q14',
        quote: "I was a street fighter. Cricket gave me direction.",
        speaker: 'Imran Khan',
        options: ['Imran Khan', 'Javed Miandad', 'Zaheer Abbas', 'Wasim Akram'],
        explanation: 'Imran Khan often spoke about how the game transformed him from a restless youth to a world champion captain.',
        category: 'Journey',
        difficulty: 'medium',
    },
    {
        id: 'q15',
        quote: "I see cricket as a religion. You must treat it with devotion, not just profession.",
        speaker: 'Rahul Dravid',
        options: ['Rahul Dravid', 'Anil Kumble', 'VVS Laxman', 'Saurav Ganguly'],
        explanation: 'The Wall — known for his dedication and technique — expressed this view in a post-retirement interview.',
        category: 'Philosophy',
        difficulty: 'medium',
    },
];
// GET /api/quiz/questions — returns all questions (shuffled, options included, no correct answer flagged)
async function getQuizQuestions(req, res, next) {
    try {
        const count = Math.min(parseInt(req.query.count || '10'), QUOTES.length);
        // Shuffle
        const shuffled = [...QUOTES].sort(() => Math.random() - 0.5).slice(0, count);
        const questions = shuffled.map((q) => ({
            id: q.id,
            quote: q.quote,
            options: [...q.options].sort(() => Math.random() - 0.5),
            category: q.category,
            difficulty: q.difficulty,
        }));
        res.json({ questions, total: QUOTES.length });
    }
    catch (error) {
        next(error);
    }
}
// POST /api/quiz/answer — { questionId, answer }
async function submitQuizAnswer(req, res, next) {
    try {
        const { questionId, answer } = req.body;
        if (!questionId || !answer) {
            throw new errors_1.BadRequestError('questionId and answer are required');
        }
        const question = QUOTES.find((q) => q.id === questionId);
        if (!question) {
            throw new errors_1.BadRequestError('Question not found');
        }
        const isCorrect = question.speaker.toLowerCase().trim() === answer.toLowerCase().trim();
        // Award coins for correct answer if user is logged in
        let coinsEarned = 0;
        if (isCorrect && req.userId) {
            const coinReward = question.difficulty === 'hard' ? 30 : question.difficulty === 'medium' ? 20 : 10;
            await User_1.default.findByIdAndUpdate(req.userId, { $inc: { coins: coinReward, xp: coinReward } });
            coinsEarned = coinReward;
        }
        res.json({
            isCorrect,
            correctAnswer: question.speaker,
            explanation: question.explanation,
            coinsEarned,
        });
    }
    catch (error) {
        next(error);
    }
}
// GET /api/quiz/leaderboard (optional: top scorers via quiz completion — stored in session-style)
// For now we expose just questions and answer checking, scores are tracked client-side
//# sourceMappingURL=quizController.js.map