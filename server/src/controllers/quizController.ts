import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { BadRequestError } from '../utils/errors';

// ─── Cricketer stats / trivia MCQ bank ───────────────────────────────────────
const STAT_QUESTIONS = [
  {
    id: 's1',
    quote: 'How many international centuries did Sachin Tendulkar score across all formats?',
    speaker: '100',
    options: ['100', '89', '96', '108'],
    explanation: 'Sachin Tendulkar scored exactly 100 international centuries — a record that still stands.',
    category: 'Stats',
    difficulty: 'easy',
    type: 'stat',
  },
  {
    id: 's2',
    quote: 'Which bowler holds the record for the most wickets in Test cricket?',
    speaker: 'Muttiah Muralitharan',
    options: ['Muttiah Muralitharan', 'Shane Warne', 'Anil Kumble', 'James Anderson'],
    explanation: 'Muralitharan took 800 Test wickets, edging Shane Warne (708) into second place.',
    category: 'Records',
    difficulty: 'easy',
    type: 'stat',
  },
  {
    id: 's3',
    quote: "What is Brian Lara's highest individual score in Test cricket?",
    speaker: '400*',
    options: ['400*', '375', '380', '365*'],
    explanation: 'Brian Lara scored 400* against England in Antigua in 2004 — the highest individual Test score ever.',
    category: 'Stats',
    difficulty: 'medium',
    type: 'stat',
  },
  {
    id: 's4',
    quote: 'Who was the first batsman to score a double century in ODI cricket?',
    speaker: 'Sachin Tendulkar',
    options: ['Sachin Tendulkar', 'Rohit Sharma', 'Martin Guptill', 'Virender Sehwag'],
    explanation: 'Sachin Tendulkar scored 200* against South Africa in 2010, becoming the first ODI double centurion.',
    category: 'Milestones',
    difficulty: 'medium',
    type: 'stat',
  },
  {
    id: 's5',
    quote: 'How many sixes did Chris Gayle hit in his 175* in IPL (the highest T20 individual innings at the time)?',
    speaker: '17',
    options: ['17', '14', '20', '12'],
    explanation: 'Chris Gayle smashed 17 sixes in his 175* for RCB vs PWI in IPL 2013 — the then-highest T20 innings ever.',
    category: 'Stats',
    difficulty: 'hard',
    type: 'stat',
  },
  {
    id: 's6',
    quote: 'Which cricketer has scored the most runs in T20 International cricket?',
    speaker: 'Virat Kohli',
    options: ['Virat Kohli', 'Rohit Sharma', 'Martin Guptill', 'Babar Azam'],
    explanation: 'Virat Kohli is the all-time leading run-scorer in T20 Internationals with over 4,000 runs.',
    category: 'Records',
    difficulty: 'easy',
    type: 'stat',
  },
  {
    id: 's7',
    quote: 'How many World Cups did MS Dhoni win as India captain?',
    speaker: '2',
    options: ['2', '1', '3', '0'],
    explanation: 'MS Dhoni won the 2007 ICC T20 World Cup and the 2011 ICC Cricket World Cup as India captain.',
    category: 'Achievements',
    difficulty: 'easy',
    type: 'stat',
  },
  {
    id: 's8',
    quote: 'What is the fastest century in ODI cricket (in balls)?',
    speaker: 'AB de Villiers (31 balls)',
    options: ['AB de Villiers (31 balls)', 'Shahid Afridi (37 balls)', 'Corey Anderson (36 balls)', 'Mark Boucher (44 balls)'],
    explanation: 'AB de Villiers smashed a century off just 31 balls against West Indies in Johannesburg in 2015.',
    category: 'Records',
    difficulty: 'hard',
    type: 'stat',
  },
  {
    id: 's9',
    quote: 'Which team has won the most ICC Cricket World Cup titles?',
    speaker: 'Australia',
    options: ['Australia', 'West Indies', 'India', 'England'],
    explanation: 'Australia has won the ODI World Cup 6 times (1987, 1999, 2003, 2007, 2015, 2023).',
    category: 'Achievements',
    difficulty: 'medium',
    type: 'stat',
  },
  {
    id: 's10',
    quote: "What was Shoaib Akhtar's peak recorded bowling speed?",
    speaker: '161.3 km/h',
    options: ['161.3 km/h', '158.8 km/h', '163.1 km/h', '155.6 km/h'],
    explanation: 'Shoaib Akhtar bowled at 161.3 km/h (100.2 mph) against England at the 2003 Cricket World Cup.',
    category: 'Stats',
    difficulty: 'hard',
    type: 'stat',
  },
  {
    id: 's11',
    quote: 'Who holds the record for the most runs in a single Test innings?',
    speaker: 'Brian Lara',
    options: ['Brian Lara', 'Sachin Tendulkar', 'Matthew Hayden', 'Don Bradman'],
    explanation: 'Brian Lara scored 400* for West Indies vs England in 2004, the highest Test innings ever.',
    category: 'Records',
    difficulty: 'medium',
    type: 'stat',
  },
  {
    id: 's12',
    quote: "How many Test centuries did Don Bradman score in his career?",
    speaker: '29',
    options: ['29', '33', '25', '31'],
    explanation: "Bradman scored 29 Test centuries in just 80 innings — an extraordinary strike rate for centuries.",
    category: 'Stats',
    difficulty: 'hard',
    type: 'stat',
  },
  {
    id: 's13',
    quote: 'Which bowler took a hat-trick in the very first ball of a Test match?',
    speaker: 'None — it has never happened',
    options: ['None — it has never happened', 'Peter Siddle', 'Wasim Akram', 'Shoaib Akhtar'],
    explanation: 'No bowler has ever taken a hat-trick with the very first three balls of a Test match.',
    category: 'Trivia',
    difficulty: 'hard',
    type: 'stat',
  },
  {
    id: 's14',
    quote: 'Which cricketer scored the most runs in a single IPL season?',
    speaker: 'Virat Kohli (973 runs, 2016)',
    options: ['Virat Kohli (973 runs, 2016)', 'David Warner (848 runs, 2016)', 'Jos Buttler (863 runs, 2022)', 'Chris Gayle (733 runs, 2013)'],
    explanation: 'Virat Kohli scored 973 runs in the 2016 IPL season for RCB — a record that still stands.',
    category: 'IPL',
    difficulty: 'medium',
    type: 'stat',
  },
  {
    id: 's15',
    quote: 'How many balls does Rohit Sharma need on average per boundary in T20Is?',
    speaker: '3.6 balls',
    options: ['3.6 balls', '4.2 balls', '2.9 balls', '5.1 balls'],
    explanation: 'Rohit Sharma averages roughly one boundary (four or six) every 3-4 balls in T20I cricket, making him one of the most explosive openers.',
    category: 'Stats',
    difficulty: 'hard',
    type: 'stat',
  },
];

// Cricket quotes bank — spicy, controversial, iconic
const QUOTES = [
  {
    id: 'q1',
    quote:
      "Cricket is a game which the English, not being a spiritual people, have invented in order to give themselves some conception of eternity.",
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
    quote:
      "I have been asked by many people why I never sledged. My answer has always been simple: I respected my opponents too much.",
    speaker: 'Sachin Tendulkar',
    options: ['Sachin Tendulkar', 'Brian Lara', 'Ricky Ponting', 'Jacques Kallis'],
    explanation: 'Sachin Tendulkar spoke about his philosophy of playing cricket with respect.',
    category: 'Sportsmanship',
    difficulty: 'medium',
  },
  {
    id: 'q4',
    quote:
      "If you want to be a champion, you have to take the toughest blows without whimpering.",
    speaker: 'Steve Waugh',
    options: ['Steve Waugh', 'Allan Border', 'Mark Taylor', 'Ian Chappell'],
    explanation: 'Steve Waugh — arguably the toughest Australian captain — lived by this mantra.',
    category: 'Mindset',
    difficulty: 'medium',
  },
  {
    id: 'q5',
    quote:
      "I never wanted to be just a cricketer. I wanted to be an entertainer, an icon. And I have done it.",
    speaker: 'Shahid Afridi',
    options: ['Shahid Afridi', 'Shoaib Akhtar', 'Inzamam-ul-Haq', 'Wasim Akram'],
    explanation: "Boom Boom Afridi's self-belief has always been unmistakable.",
    category: 'Confidence',
    difficulty: 'easy',
  },
  {
    id: 'q6',
    quote:
      "Pressure is a privilege — it only comes to those who earn it.",
    speaker: 'Billie Jean King',
    options: ['MS Dhoni', 'Billie Jean King', 'Sachin Tendulkar', 'Ricky Ponting'],
    explanation: "Though not a cricket quote originally, MS Dhoni adopted this as a personal motto often quoted in cricket contexts.",
    category: 'Pressure',
    difficulty: 'hard',
  },
  {
    id: 'q7',
    quote:
      "I don't go to the press with problems. I go to the press to tell them what I've achieved.",
    speaker: 'Kevin Pietersen',
    options: ['Kevin Pietersen', 'Andrew Flintoff', 'Michael Vaughan', 'Alastair Cook'],
    explanation: 'KP was famously at odds with the England dressing room and media for much of his career.',
    category: 'Controversy',
    difficulty: 'easy',
  },
  {
    id: 'q8',
    quote:
      "The crowd's excitement gives me energy. I feed off the roar of the stadium.",
    speaker: 'Shoaib Akhtar',
    options: ['Shoaib Akhtar', 'Brett Lee', 'Dale Steyn', 'Waqar Younis'],
    explanation: "The Rawalpindi Express always thrived on crowd energy at his home ground.",
    category: 'Performance',
    difficulty: 'easy',
  },
  {
    id: 'q9',
    quote:
      "People throw stones at you and you convert them into milestones.",
    speaker: 'Sachin Tendulkar',
    options: ['Sachin Tendulkar', 'Rahul Dravid', 'VVS Laxman', 'Sourav Ganguly'],
    explanation: 'Tendulkar reflected on overcoming criticism and adversity throughout his legendary career.',
    category: 'Resilience',
    difficulty: 'medium',
  },
  {
    id: 'q10',
    quote:
      "Cricket is a sport. It's not a matter of life and death. It is more important than that.",
    speaker: 'W.G. Grace',
    options: ['W.G. Grace', 'Don Bradman', 'Len Hutton', 'Jack Hobbs'],
    explanation: 'A paraphrase attributed to early cricket legends expressing the game\'s cultural weight.',
    category: 'Philosophy',
    difficulty: 'hard',
  },
  {
    id: 'q11',
    quote:
      "I've always believed that if you put in the work, the results will come.",
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
    quote:
      "Winning is a habit. Unfortunately, so is losing.",
    speaker: 'Vince Lombardi',
    options: ['MS Dhoni', 'Vince Lombardi', 'Ricky Ponting', 'Imran Khan'],
    explanation: 'This quote from Vince Lombardi has been widely adopted and quoted in cricket dressing rooms, including by MS Dhoni.',
    category: 'Mindset',
    difficulty: 'hard',
  },
  {
    id: 'q14',
    quote:
      "I was a street fighter. Cricket gave me direction.",
    speaker: 'Imran Khan',
    options: ['Imran Khan', 'Javed Miandad', 'Zaheer Abbas', 'Wasim Akram'],
    explanation: 'Imran Khan often spoke about how the game transformed him from a restless youth to a world champion captain.',
    category: 'Journey',
    difficulty: 'medium',
  },
  {
    id: 'q15',
    quote:
      "I see cricket as a religion. You must treat it with devotion, not just profession.",
    speaker: 'Rahul Dravid',
    options: ['Rahul Dravid', 'Anil Kumble', 'VVS Laxman', 'Saurav Ganguly'],
    explanation: 'The Wall — known for his dedication and technique — expressed this view in a post-retirement interview.',
    category: 'Philosophy',
    difficulty: 'medium',
  },
];

// GET /api/quiz/questions — returns a mix of quote + stat questions (shuffled)
export async function getQuizQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const totalRequested = Math.min(parseInt((req.query.count as string) || '10'), 20);

    // Split roughly 50/50 between quotes and stat questions
    const quoteCount = Math.ceil(totalRequested / 2);
    const statCount = totalRequested - quoteCount;

    const shuffledQuotes = [...QUOTES].sort(() => Math.random() - 0.5).slice(0, quoteCount);
    const shuffledStats = [...STAT_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, statCount);

    // Interleave and shuffle the combined set
    const combined = [...shuffledQuotes, ...shuffledStats].sort(() => Math.random() - 0.5);

    const questions = combined.map((q) => ({
      id: q.id,
      quote: q.quote,
      options: [...q.options].sort(() => Math.random() - 0.5),
      category: q.category,
      difficulty: q.difficulty,
      type: (q as any).type ?? 'quote',
    }));

    res.json({ questions, total: QUOTES.length + STAT_QUESTIONS.length });
  } catch (error) {
    next(error);
  }
}

// POST /api/quiz/answer — { questionId, answer }
export async function submitQuizAnswer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { questionId, answer } = req.body;
    if (!questionId || !answer) {
      throw new BadRequestError('questionId and answer are required');
    }

    const question = [...QUOTES, ...STAT_QUESTIONS].find((q) => q.id === questionId);
    if (!question) {
      throw new BadRequestError('Question not found');
    }

    const isCorrect = question.speaker.toLowerCase().trim() === answer.toLowerCase().trim();

    // Award coins for correct answer if user is logged in
    let coinsEarned = 0;
    if (isCorrect && req.userId) {
      const coinReward = question.difficulty === 'hard' ? 30 : question.difficulty === 'medium' ? 20 : 10;
      await User.findByIdAndUpdate(req.userId, { $inc: { coins: coinReward, xp: coinReward } });
      coinsEarned = coinReward;
    }

    res.json({
      isCorrect,
      correctAnswer: question.speaker,
      explanation: question.explanation,
      coinsEarned,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/quiz/leaderboard (optional: top scorers via quiz completion — stored in session-style)
// For now we expose just questions and answer checking, scores are tracked client-side
