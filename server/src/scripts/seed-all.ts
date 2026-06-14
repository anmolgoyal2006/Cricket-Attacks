import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player';
import { config } from '../config';

dotenv.config();

interface PlayerSeed {
  name: string;
  role: string;
  country: string;
  batting: number;
  bowling: number;
  fielding: number;
  captaincy: number;
  pressure: number;
  overall: number;
  specialty: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legend';
  image: string;
  battingHand?: string;
  bowlingStyle?: string;
  iplTeam?: string;
  debutYear?: number;
  age?: number;
  formats: {
    odi: { matches: number; runs: number; avg: number; sr: number; hundreds: number; fifties: number; wickets: number; economy: number; bestScore?: string };
    test: { matches: number; runs: number; avg: number; sr: number; hundreds: number; fifties: number; wickets: number; economy: number; bestScore?: string };
    t20: { matches: number; runs: number; avg: number; sr: number; hundreds: number; fifties: number; wickets: number; economy: number; bestScore?: string };
    worldCup: { matches: number; runs: number; avg: number; sr: number; hundreds: number; fifties: number; wickets: number; economy: number; bestScore?: string };
    knockouts: { matches: number; runs: number; avg: number; sr: number; hundreds: number; fifties: number; wickets: number; economy: number; bestScore?: string };
    bilateral: { matches: number; runs: number; avg: number; sr: number; hundreds: number; fifties: number; wickets: number; economy: number; bestScore?: string };
  };
}

const playersData = [
  {
    name: "Virat Kohli", role: "Batsman", country: "India",
    batting: 96, bowling: 25, fielding: 92, captaincy: 88, pressure: 90, overall: 78,
    specialty: "Chase Master", rarity: "Legend",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c616517/virat-kohli.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 295, runs: 13906, avg: 57.31, sr: 93.17, hundreds: 51, fifties: 72, wickets: 4, economy: 6.21, bestScore: "183" },
      test: { matches: 113, runs: 8848, avg: 49.16, sr: 55.37, hundreds: 29, fifties: 30, wickets: 0, economy: 0, bestScore: "254*" },
      t20: { matches: 125, runs: 4188, avg: 52.35, sr: 138.02, hundreds: 1, fifties: 38, wickets: 0, economy: 0, bestScore: "122*" },
      worldCup: { matches: 37, runs: 1795, avg: 59.83, sr: 88.20, hundreds: 5, fifties: 12, wickets: 0, economy: 0 },
      knockouts: { matches: 25, runs: 1342, avg: 67.1, sr: 91.4, hundreds: 6, fifties: 7, wickets: 0, economy: 0 },
      bilateral: { matches: 230, runs: 11053, avg: 56.6, sr: 94.2, hundreds: 39, fifties: 53, wickets: 4, economy: 6.21 }
    }
  }
,
  {
    name: "Rohit Sharma", role: "Batsman", country: "India",
    batting: 94, bowling: 28, fielding: 85, captaincy: 82, pressure: 85, overall: 75,
    specialty: "Hitman", rarity: "Legend",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c616514/rohit-sharma.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 267, runs: 10920, avg: 48.96, sr: 90.30, hundreds: 31, fifties: 55, wickets: 8, economy: 5.29, bestScore: "264" },
      test: { matches: 59, runs: 4301, avg: 46.77, sr: 58.82, hundreds: 11, fifties: 16, wickets: 2, economy: 7.44, bestScore: "212" },
      t20: { matches: 159, runs: 4198, avg: 32.34, sr: 140.61, hundreds: 5, fifties: 31, wickets: 1, economy: 7.62, bestScore: "121*" },
      worldCup: { matches: 28, runs: 1575, avg: 60.58, sr: 95.12, hundreds: 7, fifties: 7, wickets: 0, economy: 0 },
      knockouts: { matches: 18, runs: 920, avg: 51.11, sr: 93.4, hundreds: 3, fifties: 4, wickets: 0, economy: 0 },
      bilateral: { matches: 210, runs: 8400, avg: 47.2, sr: 88.5, hundreds: 21, fifties: 44, wickets: 8, economy: 5.29 }
    }
  }
,
  {
    name: "Shubman Gill", role: "Batsman", country: "India",
    batting: 88, bowling: 20, fielding: 82, captaincy: 60, pressure: 72, overall: 64,
    specialty: "Elegant Stroker", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c616515/shubman-gill.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 47, runs: 2328, avg: 58.20, sr: 103.5, hundreds: 7, fifties: 13, wickets: 0, economy: 0, bestScore: "208" },
      test: { matches: 28, runs: 1494, avg: 33.22, sr: 65.1, hundreds: 4, fifties: 6, wickets: 0, economy: 0, bestScore: "128" },
      t20: { matches: 18, runs: 362, avg: 24.13, sr: 141.3, hundreds: 0, fifties: 2, wickets: 0, economy: 0, bestScore: "63*" },
      worldCup: { matches: 9, runs: 420, avg: 52.5, sr: 102.4, hundreds: 2, fifties: 2, wickets: 0, economy: 0 },
      knockouts: { matches: 4, runs: 145, avg: 36.25, sr: 98.6, hundreds: 0, fifties: 1, wickets: 0, economy: 0 },
      bilateral: { matches: 34, runs: 1690, avg: 56.3, sr: 104.2, hundreds: 4, fifties: 10, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Yashasvi Jaiswal", role: "Batsman", country: "India",
    batting: 85, bowling: 15, fielding: 78, captaincy: 50, pressure: 70, overall: 60,
    specialty: "Aggressive Opener", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c591942/yashasvi-jaiswal.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 10, runs: 502, avg: 55.78, sr: 112.3, hundreds: 2, fifties: 2, wickets: 0, economy: 0, bestScore: "149" },
      test: { matches: 19, runs: 1478, avg: 46.19, sr: 68.4, hundreds: 4, fifties: 8, wickets: 0, economy: 0, bestScore: "214*" },
      t20: { matches: 23, runs: 581, avg: 27.67, sr: 148.5, hundreds: 0, fifties: 4, wickets: 0, economy: 0, bestScore: "93" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 2, runs: 68, avg: 34.0, sr: 108.5, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 8, runs: 415, avg: 59.3, sr: 114.8, hundreds: 2, fifties: 1, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Sai Sudharsan", role: "Batsman", country: "India",
    batting: 78, bowling: 15, fielding: 75, captaincy: 40, pressure: 65, overall: 55,
    specialty: "Technically Sound", rarity: "Rare",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c717782/sai-sudharsan.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 3, runs: 127, avg: 42.33, sr: 98.5, hundreds: 0, fifties: 1, wickets: 0, economy: 0, bestScore: "62" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 5, runs: 118, avg: 29.5, sr: 142.3, hundreds: 0, fifties: 1, wickets: 0, economy: 0, bestScore: "43" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 3, runs: 127, avg: 42.3, sr: 98.5, hundreds: 0, fifties: 1, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Suryakumar Yadav", role: "Batsman", country: "India",
    batting: 90, bowling: 18, fielding: 88, captaincy: 55, pressure: 82, overall: 67,
    specialty: "360 Player", rarity: "Legend",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846028/suryakumar-yadav.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 37, runs: 773, avg: 25.77, sr: 105.3, hundreds: 0, fifties: 4, wickets: 0, economy: 0, bestScore: "72" },
      test: { matches: 1, runs: 8, avg: 4.0, sr: 21.6, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "8" },
      t20: { matches: 70, runs: 2341, avg: 45.90, sr: 167.9, hundreds: 4, fifties: 20, wickets: 0, economy: 0, bestScore: "117" },
      worldCup: { matches: 8, runs: 155, avg: 22.14, sr: 108.4, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 5, runs: 112, avg: 28.0, sr: 135.2, hundreds: 0, fifties: 1, wickets: 0, economy: 0 },
      bilateral: { matches: 24, runs: 506, avg: 24.1, sr: 102.8, hundreds: 0, fifties: 3, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Shreyas Iyer", role: "Batsman", country: "India",
    batting: 84, bowling: 22, fielding: 80, captaincy: 68, pressure: 75, overall: 66,
    specialty: "Spin Basher", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c616518/shreyas-iyer.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 62, runs: 2383, avg: 47.66, sr: 99.2, hundreds: 5, fifties: 15, wickets: 0, economy: 0, bestScore: "128*" },
      test: { matches: 14, runs: 811, avg: 36.86, sr: 59.4, hundreds: 1, fifties: 6, wickets: 0, economy: 0, bestScore: "105" },
      t20: { matches: 51, runs: 1104, avg: 30.67, sr: 135.8, hundreds: 0, fifties: 8, wickets: 0, economy: 0, bestScore: "74*" },
      worldCup: { matches: 11, runs: 530, avg: 58.89, sr: 113.5, hundreds: 2, fifties: 3, wickets: 0, economy: 0 },
      knockouts: { matches: 6, runs: 225, avg: 45.0, sr: 108.2, hundreds: 0, fifties: 2, wickets: 0, economy: 0 },
      bilateral: { matches: 45, runs: 1628, avg: 44.0, sr: 96.8, hundreds: 3, fifties: 10, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Rinku Singh", role: "Batsman", country: "India",
    batting: 76, bowling: 20, fielding: 75, captaincy: 35, pressure: 78, overall: 57,
    specialty: "Finisher", rarity: "Rare",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846030/rinku-singh.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 2, runs: 55, avg: 55.0, sr: 110.0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "38" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 20, runs: 498, avg: 41.50, sr: 161.2, hundreds: 0, fifties: 3, wickets: 0, economy: 0, bestScore: "69*" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 1, runs: 24, avg: 24.0, sr: 150.0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 2, runs: 55, avg: 55.0, sr: 110.0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Tilak Varma", role: "Batsman", country: "India",
    batting: 77, bowling: 25, fielding: 76, captaincy: 40, pressure: 68, overall: 57,
    specialty: "Promising Talent", rarity: "Rare",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846029/tilak-varma.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 2, runs: 71, avg: 35.5, sr: 96.0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "42" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 17, runs: 425, avg: 38.64, sr: 145.5, hundreds: 0, fifties: 3, wickets: 0, economy: 0, bestScore: "55*" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 1, runs: 18, avg: 18.0, sr: 120.0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 2, runs: 71, avg: 35.5, sr: 96.0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Ruturaj Gaikwad", role: "Batsman", country: "India",
    batting: 80, bowling: 15, fielding: 78, captaincy: 62, pressure: 70, overall: 61,
    specialty: "Classy Opener", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c781069/ruturaj-gaikwad.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 1, runs: 5, avg: 5.0, sr: 35.7, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "5" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 23, runs: 679, avg: 35.74, sr: 138.9, hundreds: 0, fifties: 5, wickets: 0, economy: 0, bestScore: "80" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 2, runs: 45, avg: 22.5, sr: 125.0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 1, runs: 5, avg: 5.0, sr: 35.7, hundreds: 0, fifties: 0, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Rajat Patidar", role: "Batsman", country: "India",
    batting: 76, bowling: 15, fielding: 72, captaincy: 35, pressure: 65, overall: 53,
    specialty: "Middle Order", rarity: "Rare",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c760758/rajat-patidar.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 1, runs: 22, avg: 22.0, sr: 68.8, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "22" },
      test: { matches: 3, runs: 146, avg: 29.2, sr: 52.3, hundreds: 0, fifties: 1, wickets: 0, economy: 0, bestScore: "51" },
      t20: { matches: 2, runs: 40, avg: 20.0, sr: 133.3, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "22" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 1, runs: 22, avg: 22.0, sr: 68.8, hundreds: 0, fifties: 0, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Sarfaraz Khan", role: "Batsman", country: "India",
    batting: 74, bowling: 18, fielding: 68, captaincy: 30, pressure: 60, overall: 50,
    specialty: "Domestic Run Machine", rarity: "Rare",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c591955/sarfaraz-khan.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      test: { matches: 6, runs: 346, avg: 34.60, sr: 58.7, hundreds: 1, fifties: 2, wickets: 0, economy: 0, bestScore: "150" },
      t20: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Abhimanyu Easwaran", role: "Batsman", country: "India",
    batting: 70, bowling: 15, fielding: 70, captaincy: 45, pressure: 55, overall: 51,
    specialty: "Domestic Stalwart", rarity: "Common",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c591956/abhimanyu-easwaran.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      test: { matches: 1, runs: 35, avg: 17.5, sr: 41.2, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "35" },
      t20: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Karun Nair", role: "Batsman", country: "India",
    batting: 72, bowling: 20, fielding: 72, captaincy: 35, pressure: 58, overall: 52,
    specialty: "Triple Centurion", rarity: "Rare",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c717781/karun-nair.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 2, runs: 46, avg: 23.0, sr: 82.1, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "39" },
      test: { matches: 6, runs: 374, avg: 62.33, sr: 52.3, hundreds: 1, fifties: 1, wickets: 0, economy: 0, bestScore: "303*" },
      t20: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 2, runs: 46, avg: 23.0, sr: 82.1, hundreds: 0, fifties: 0, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Nitish Kumar Reddy", role: "All-rounder", country: "India",
    batting: 72, bowling: 65, fielding: 75, captaincy: 30, pressure: 68, overall: 62,
    specialty: "Pace All-rounder", rarity: "Rare",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c591947/nitish-kumar-reddy.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 2, runs: 52, avg: 26.0, sr: 98.2, hundreds: 0, fifties: 0, wickets: 2, economy: 5.80, bestScore: "38" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 8, runs: 112, avg: 22.4, sr: 148.2, hundreds: 0, fifties: 0, wickets: 5, economy: 8.50, bestScore: "36*" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 2, runs: 52, avg: 26.0, sr: 98.2, hundreds: 0, fifties: 0, wickets: 2, economy: 5.80 }
    }
  }
,
  {
    name: "Hardik Pandya", role: "All-rounder", country: "India",
    batting: 85, bowling: 78, fielding: 88, captaincy: 72, pressure: 80, overall: 81,
    specialty: "Dynamic All-rounder", rarity: "Legend",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846032/hardik-pandya.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 86, runs: 1869, avg: 34.80, sr: 110.4, hundreds: 0, fifties: 11, wickets: 84, economy: 5.63, bestScore: "92*" },
      test: { matches: 11, runs: 532, avg: 31.29, sr: 74.1, hundreds: 1, fifties: 4, wickets: 17, economy: 3.60, bestScore: "108" },
      t20: { matches: 98, runs: 1482, avg: 26.95, sr: 141.8, hundreds: 0, fifties: 5, wickets: 72, economy: 7.84, bestScore: "71*" },
      worldCup: { matches: 12, runs: 295, avg: 32.78, sr: 118.5, hundreds: 0, fifties: 2, wickets: 12, economy: 5.12 },
      knockouts: { matches: 8, runs: 182, avg: 30.33, sr: 125.6, hundreds: 0, fifties: 1, wickets: 8, economy: 5.45 },
      bilateral: { matches: 64, runs: 1353, avg: 33.0, sr: 107.8, hundreds: 0, fifties: 8, wickets: 64, economy: 5.82 }
    }
  }
,
  {
    name: "Shivam Dube", role: "All-rounder", country: "India",
    batting: 74, bowling: 68, fielding: 70, captaincy: 30, pressure: 65, overall: 61,
    specialty: "Power Hitter", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846034/shivam-dube.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 1, runs: 9, avg: 9.0, sr: 60.0, hundreds: 0, fifties: 0, wickets: 1, economy: 5.75, bestScore: "9" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 34, runs: 381, avg: 21.17, sr: 142.7, hundreds: 0, fifties: 2, wickets: 16, economy: 8.45, bestScore: "54*" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 2, runs: 35, avg: 17.5, sr: 125.0, hundreds: 0, fifties: 0, wickets: 1, economy: 8.20 },
      bilateral: { matches: 1, runs: 9, avg: 9.0, sr: 60.0, hundreds: 0, fifties: 0, wickets: 1, economy: 5.75 }
    }
  }
,
  {
    name: "Abhishek Sharma", role: "All-rounder", country: "India",
    batting: 76, bowling: 55, fielding: 74, captaincy: 35, pressure: 62, overall: 60,
    specialty: "Left-hand Dynamo", rarity: "Rare",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846031/abhishek-sharma.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 12, runs: 188, avg: 18.80, sr: 145.8, hundreds: 0, fifties: 1, wickets: 4, economy: 8.25, bestScore: "55*" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Ravindra Jadeja", role: "All-rounder", country: "India",
    batting: 82, bowling: 88, fielding: 92, captaincy: 60, pressure: 78, overall: 80,
    specialty: "Rockstar All-rounder", rarity: "Legend",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c616520/ravindra-jadeja.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 197, runs: 2756, avg: 32.42, sr: 85.4, hundreds: 2, fifties: 14, wickets: 220, economy: 4.89, bestScore: "77" },
      test: { matches: 71, runs: 2903, avg: 36.29, sr: 60.2, hundreds: 4, fifties: 19, wickets: 294, economy: 2.62, bestScore: "175*" },
      t20: { matches: 62, runs: 426, avg: 21.30, sr: 127.5, hundreds: 0, fifties: 0, wickets: 54, economy: 7.12, bestScore: "44*" },
      worldCup: { matches: 18, runs: 295, avg: 29.5, sr: 82.4, hundreds: 0, fifties: 2, wickets: 22, economy: 4.65 },
      knockouts: { matches: 12, runs: 182, avg: 36.4, sr: 88.5, hundreds: 0, fifties: 1, wickets: 15, economy: 4.12 },
      bilateral: { matches: 150, runs: 2144, avg: 31.5, sr: 86.2, hundreds: 2, fifties: 11, wickets: 168, economy: 4.95 }
    }
  }
,
  {
    name: "Shardul Thakur", role: "All-rounder", country: "India",
    batting: 68, bowling: 76, fielding: 72, captaincy: 30, pressure: 70, overall: 63,
    specialty: "Impact Player", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c352487/shardul-thakur.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 47, runs: 356, avg: 17.80, sr: 95.6, hundreds: 0, fifties: 2, wickets: 64, economy: 5.82, bestScore: "50*" },
      test: { matches: 11, runs: 326, avg: 21.73, sr: 76.9, hundreds: 0, fifties: 3, wickets: 35, economy: 3.48, bestScore: "67" },
      t20: { matches: 25, runs: 68, avg: 8.50, sr: 97.1, hundreds: 0, fifties: 0, wickets: 26, economy: 8.92, bestScore: "22*" },
      worldCup: { matches: 6, runs: 58, avg: 19.33, sr: 107.4, hundreds: 0, fifties: 0, wickets: 8, economy: 5.45 },
      knockouts: { matches: 4, runs: 38, avg: 19.0, sr: 95.0, hundreds: 0, fifties: 0, wickets: 5, economy: 5.82 },
      bilateral: { matches: 37, runs: 260, avg: 17.3, sr: 92.8, hundreds: 0, fifties: 2, wickets: 48, economy: 5.95 }
    }
  }
,
  {
    name: "Washington Sundar", role: "All-rounder", country: "India",
    batting: 68, bowling: 72, fielding: 74, captaincy: 40, pressure: 62, overall: 63,
    specialty: "Off-spin All-rounder", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c616522/washington-sundar.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 22, runs: 285, avg: 22.69, sr: 82.6, hundreds: 0, fifties: 2, wickets: 25, economy: 4.85, bestScore: "51" },
      test: { matches: 4, runs: 266, avg: 66.50, sr: 50.2, hundreds: 1, fifties: 2, wickets: 6, economy: 3.12, bestScore: "96" },
      t20: { matches: 48, runs: 142, avg: 14.20, sr: 118.3, hundreds: 0, fifties: 0, wickets: 42, economy: 7.25, bestScore: "33*" },
      worldCup: { matches: 2, runs: 18, avg: 9.0, sr: 75.0, hundreds: 0, fifties: 0, wickets: 2, economy: 4.50 },
      knockouts: { matches: 1, runs: 8, avg: 8.0, sr: 80.0, hundreds: 0, fifties: 0, wickets: 1, economy: 4.80 },
      bilateral: { matches: 18, runs: 259, avg: 24.5, sr: 84.2, hundreds: 0, fifties: 2, wickets: 20, economy: 4.92 }
    }
  }
,
  {
    name: "Axar Patel", role: "All-rounder", country: "India",
    batting: 76, bowling: 82, fielding: 80, captaincy: 50, pressure: 72, overall: 72,
    specialty: "Spin All-rounder", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846033/axar-patel.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 58, runs: 480, avg: 18.46, sr: 95.4, hundreds: 0, fifties: 2, wickets: 70, economy: 4.72, bestScore: "64*" },
      test: { matches: 14, runs: 640, avg: 35.56, sr: 58.2, hundreds: 1, fifties: 5, wickets: 55, economy: 2.52, bestScore: "84" },
      t20: { matches: 58, runs: 375, avg: 18.75, sr: 135.8, hundreds: 0, fifties: 1, wickets: 57, economy: 6.85, bestScore: "43*" },
      worldCup: { matches: 8, runs: 62, avg: 15.5, sr: 82.7, hundreds: 0, fifties: 0, wickets: 10, economy: 4.45 },
      knockouts: { matches: 5, runs: 42, avg: 14.0, sr: 85.6, hundreds: 0, fifties: 0, wickets: 7, economy: 4.28 },
      bilateral: { matches: 45, runs: 376, avg: 19.8, sr: 97.2, hundreds: 0, fifties: 2, wickets: 53, economy: 4.82 }
    }
  }
,
  {
    name: "Rishabh Pant", role: "Wicketkeeper-Batsman", country: "India",
    batting: 84, bowling: 15, fielding: 78, captaincy: 55, pressure: 78, overall: 62,
    specialty: "Fearless Batter", rarity: "Legend",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c616524/rishabh-pant.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 31, runs: 865, avg: 34.60, sr: 111.2, hundreds: 1, fifties: 5, wickets: 0, economy: 0, bestScore: "125*" },
      test: { matches: 33, runs: 2271, avg: 43.67, sr: 73.4, hundreds: 5, fifties: 11, wickets: 0, economy: 0, bestScore: "159*" },
      t20: { matches: 66, runs: 987, avg: 22.43, sr: 127.2, hundreds: 0, fifties: 4, wickets: 0, economy: 0, bestScore: "65*" },
      worldCup: { matches: 6, runs: 212, avg: 42.4, sr: 108.2, hundreds: 0, fifties: 2, wickets: 0, economy: 0 },
      knockouts: { matches: 4, runs: 148, avg: 49.33, sr: 118.5, hundreds: 0, fifties: 1, wickets: 0, economy: 0 },
      bilateral: { matches: 21, runs: 505, avg: 29.7, sr: 112.5, hundreds: 1, fifties: 2, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "KL Rahul", role: "Wicketkeeper-Batsman", country: "India",
    batting: 86, bowling: 18, fielding: 84, captaincy: 70, pressure: 72, overall: 66,
    specialty: "Elegant Wicketkeeper", rarity: "Legend",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c616523/kl-rahul.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 77, runs: 2851, avg: 47.52, sr: 88.2, hundreds: 7, fifties: 18, wickets: 0, economy: 0, bestScore: "112" },
      test: { matches: 50, runs: 2866, avg: 34.54, sr: 52.5, hundreds: 8, fifties: 14, wickets: 0, economy: 0, bestScore: "199" },
      t20: { matches: 72, runs: 2265, avg: 37.75, sr: 139.7, hundreds: 2, fifties: 22, wickets: 0, economy: 0, bestScore: "110*" },
      worldCup: { matches: 14, runs: 555, avg: 46.25, sr: 90.5, hundreds: 2, fifties: 3, wickets: 0, economy: 0 },
      knockouts: { matches: 8, runs: 285, avg: 40.71, sr: 88.2, hundreds: 0, fifties: 2, wickets: 0, economy: 0 },
      bilateral: { matches: 55, runs: 2011, avg: 48.2, sr: 87.5, hundreds: 5, fifties: 13, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Dhruv Jurel", role: "Wicketkeeper-Batsman", country: "India",
    batting: 68, bowling: 15, fielding: 74, captaincy: 30, pressure: 62, overall: 50,
    specialty: "Promising Wicketkeeper", rarity: "Common",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c591954/dhruv-jurel.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 1, runs: 23, avg: 23.0, sr: 92.0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "23" },
      test: { matches: 3, runs: 145, avg: 36.25, sr: 48.6, hundreds: 0, fifties: 1, wickets: 0, economy: 0, bestScore: "90" },
      t20: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 1, runs: 23, avg: 23.0, sr: 92.0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Sanju Samson", role: "Wicketkeeper-Batsman", country: "India",
    batting: 80, bowling: 15, fielding: 78, captaincy: 65, pressure: 68, overall: 61,
    specialty: "Flamboyant Batter", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846035/sanju-samson.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 16, runs: 510, avg: 36.43, sr: 99.6, hundreds: 0, fifties: 4, wickets: 0, economy: 0, bestScore: "86*" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 30, runs: 412, avg: 18.73, sr: 129.6, hundreds: 0, fifties: 2, wickets: 0, economy: 0, bestScore: "77" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 1, runs: 15, avg: 15.0, sr: 100.0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 15, runs: 495, avg: 38.1, sr: 100.2, hundreds: 0, fifties: 4, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Ishan Kishan", role: "Wicketkeeper-Batsman", country: "India",
    batting: 78, bowling: 15, fielding: 76, captaincy: 40, pressure: 64, overall: 55,
    specialty: "Aggressive Opener", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846036/ishan-kishan.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 27, runs: 933, avg: 38.88, sr: 102.5, hundreds: 1, fifties: 7, wickets: 0, economy: 0, bestScore: "210" },
      test: { matches: 2, runs: 78, avg: 19.5, sr: 47.6, hundreds: 0, fifties: 1, wickets: 0, economy: 0, bestScore: "52" },
      t20: { matches: 32, runs: 694, avg: 25.70, sr: 129.4, hundreds: 0, fifties: 5, wickets: 0, economy: 0, bestScore: "89" },
      worldCup: { matches: 2, runs: 57, avg: 28.5, sr: 90.5, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 1, runs: 12, avg: 12.0, sr: 80.0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 24, runs: 864, avg: 40.2, sr: 104.8, hundreds: 1, fifties: 7, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Mohammed Siraj", role: "Bowler", country: "India",
    batting: 15, bowling: 84, fielding: 60, captaincy: 20, pressure: 72, overall: 50,
    specialty: "Swing Bowler", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c591952/mohammed-siraj.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 43, runs: 53, avg: 8.83, sr: 49.1, hundreds: 0, fifties: 0, wickets: 71, economy: 4.92, bestScore: "9" },
      test: { matches: 27, runs: 108, avg: 7.20, sr: 29.4, hundreds: 0, fifties: 0, wickets: 86, economy: 3.12, bestScore: "16*" },
      t20: { matches: 10, runs: 12, avg: 6.0, sr: 85.7, hundreds: 0, fifties: 0, wickets: 12, economy: 8.45, bestScore: "5" },
      worldCup: { matches: 8, runs: 10, avg: 5.0, sr: 35.7, hundreds: 0, fifties: 0, wickets: 14, economy: 4.68 },
      knockouts: { matches: 5, runs: 8, avg: 4.0, sr: 40.0, hundreds: 0, fifties: 0, wickets: 8, economy: 4.85 },
      bilateral: { matches: 30, runs: 35, avg: 8.75, sr: 52.3, hundreds: 0, fifties: 0, wickets: 49, economy: 5.02 }
    }
  }
,
  {
    name: "Jasprit Bumrah", role: "Bowler", country: "India",
    batting: 12, bowling: 96, fielding: 55, captaincy: 25, pressure: 88, overall: 55,
    specialty: "Yorker Specialist", rarity: "Legend",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846037/jasprit-bumrah.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 89, runs: 35, avg: 5.83, sr: 44.9, hundreds: 0, fifties: 0, wickets: 149, economy: 4.52, bestScore: "16" },
      test: { matches: 38, runs: 48, avg: 3.43, sr: 16.3, hundreds: 0, fifties: 0, wickets: 155, economy: 2.52, bestScore: "6" },
      t20: { matches: 70, runs: 18, avg: 4.50, sr: 62.1, hundreds: 0, fifties: 0, wickets: 89, economy: 6.62, bestScore: "7" },
      worldCup: { matches: 15, runs: 8, avg: 2.67, sr: 25.0, hundreds: 0, fifties: 0, wickets: 28, economy: 4.15 },
      knockouts: { matches: 10, runs: 5, avg: 2.5, sr: 20.0, hundreds: 0, fifties: 0, wickets: 18, economy: 4.02 },
      bilateral: { matches: 62, runs: 22, avg: 5.5, sr: 40.0, hundreds: 0, fifties: 0, wickets: 103, economy: 4.65 }
    }
  }
,
  {
    name: "Prasidh Krishna", role: "Bowler", country: "India",
    batting: 15, bowling: 74, fielding: 58, captaincy: 20, pressure: 62, overall: 46,
    specialty: "Hit-the-deck Bowler", rarity: "Rare",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c591958/prasidh-krishna.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 17, runs: 2, avg: 1.0, sr: 25.0, hundreds: 0, fifties: 0, wickets: 29, economy: 5.28, bestScore: "2" },
      test: { matches: 2, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 5, economy: 3.85, bestScore: "0*" },
      t20: { matches: 2, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 3, economy: 8.50, bestScore: "0*" },
      worldCup: { matches: 3, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 6, economy: 5.02 },
      knockouts: { matches: 2, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 3, economy: 5.45 },
      bilateral: { matches: 12, runs: 2, avg: 1.0, sr: 25.0, hundreds: 0, fifties: 0, wickets: 20, economy: 5.35 }
    }
  }
,
  {
    name: "Akash Deep", role: "Bowler", country: "India",
    batting: 20, bowling: 72, fielding: 60, captaincy: 20, pressure: 60, overall: 46,
    specialty: "Seam Bowler", rarity: "Common",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c591951/akash-deep.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      test: { matches: 5, runs: 28, avg: 9.33, sr: 42.4, hundreds: 0, fifties: 0, wickets: 12, economy: 3.45, bestScore: "14" },
      t20: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Kuldeep Yadav", role: "Bowler", country: "India",
    batting: 18, bowling: 86, fielding: 62, captaincy: 25, pressure: 70, overall: 52,
    specialty: "Chinaman Bowler", rarity: "Legend",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846039/kuldeep-yadav.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 106, runs: 190, avg: 10.56, sr: 56.4, hundreds: 0, fifties: 0, wickets: 175, economy: 4.82, bestScore: "19" },
      test: { matches: 12, runs: 54, avg: 7.71, sr: 40.0, hundreds: 0, fifties: 0, wickets: 40, economy: 2.98, bestScore: "16" },
      t20: { matches: 35, runs: 18, avg: 4.50, sr: 56.3, hundreds: 0, fifties: 0, wickets: 42, economy: 7.45, bestScore: "6*" },
      worldCup: { matches: 11, runs: 10, avg: 5.0, sr: 33.3, hundreds: 0, fifties: 0, wickets: 21, economy: 4.28 },
      knockouts: { matches: 6, runs: 6, avg: 3.0, sr: 30.0, hundreds: 0, fifties: 0, wickets: 10, economy: 4.45 },
      bilateral: { matches: 85, runs: 170, avg: 11.33, sr: 58.5, hundreds: 0, fifties: 0, wickets: 140, economy: 4.92 }
    }
  }
,
  {
    name: "Arshdeep Singh", role: "Bowler", country: "India",
    batting: 15, bowling: 80, fielding: 62, captaincy: 20, pressure: 75, overall: 50,
    specialty: "Death Bowler", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846038/arshdeep-singh.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 8, runs: 8, avg: 4.0, sr: 53.3, hundreds: 0, fifties: 0, wickets: 15, economy: 5.45, bestScore: "5" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 60, runs: 18, avg: 4.50, sr: 75.0, hundreds: 0, fifties: 0, wickets: 95, economy: 7.82, bestScore: "7" },
      worldCup: { matches: 8, runs: 2, avg: 1.0, sr: 20.0, hundreds: 0, fifties: 0, wickets: 12, economy: 5.82 },
      knockouts: { matches: 4, runs: 2, avg: 1.0, sr: 20.0, hundreds: 0, fifties: 0, wickets: 6, economy: 6.12 },
      bilateral: { matches: 6, runs: 6, avg: 3.0, sr: 50.0, hundreds: 0, fifties: 0, wickets: 10, economy: 5.28 }
    }
  }
,
  {
    name: "Harshit Rana", role: "Bowler", country: "India",
    batting: 22, bowling: 70, fielding: 60, captaincy: 20, pressure: 60, overall: 46,
    specialty: "Pace Bowler", rarity: "Common",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c616529/harshit-rana.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 2, runs: 8, avg: 8.0, sr: 100.0, hundreds: 0, fifties: 0, wickets: 3, economy: 8.25, bestScore: "8" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 }
    }
  }
,
  {
    name: "Ravi Bishnoi", role: "Bowler", country: "India",
    batting: 18, bowling: 76, fielding: 65, captaincy: 25, pressure: 65, overall: 50,
    specialty: "Leg-spin Wizard", rarity: "Rare",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c226280/ravi-bishnoi.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 1, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 1, economy: 5.20, bestScore: "0*" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 27, runs: 12, avg: 6.0, sr: 75.0, hundreds: 0, fifties: 0, wickets: 38, economy: 7.35, bestScore: "5" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 1, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 1, economy: 7.00 },
      bilateral: { matches: 1, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 1, economy: 5.20 }
    }
  }
,
  {
    name: "Mukesh Kumar", role: "Bowler", country: "India",
    batting: 15, bowling: 72, fielding: 58, captaincy: 20, pressure: 58, overall: 45,
    specialty: "Medium Pacer", rarity: "Common",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c333872/mukesh-kumar.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 6, runs: 8, avg: 4.0, sr: 40.0, hundreds: 0, fifties: 0, wickets: 10, economy: 5.62, bestScore: "6" },
      test: { matches: 3, runs: 10, avg: 5.0, sr: 25.0, hundreds: 0, fifties: 0, wickets: 7, economy: 3.85, bestScore: "6" },
      t20: { matches: 10, runs: 4, avg: 2.0, sr: 40.0, hundreds: 0, fifties: 0, wickets: 12, economy: 8.12, bestScore: "3" },
      worldCup: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      knockouts: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0 },
      bilateral: { matches: 6, runs: 8, avg: 4.0, sr: 40.0, hundreds: 0, fifties: 0, wickets: 10, economy: 5.62 }
    }
  }
,
  {
    name: "Varun Chakaravarthy", role: "Bowler", country: "India",
    batting: 15, bowling: 78, fielding: 60, captaincy: 20, pressure: 68, overall: 48,
    specialty: "Mystery Spinner", rarity: "Epic",
    image: "https://static.cricbuzz.com/a/img/v1/i1/c846040/varun-chakaravarthy.jpg?d=low&p=gthumb152x152undefined",
    formats: {
      odi: { matches: 1, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 1, economy: 4.80, bestScore: "0*" },
      test: { matches: 0, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 0, economy: 0, bestScore: "" },
      t20: { matches: 25, runs: 10, avg: 3.33, sr: 55.6, hundreds: 0, fifties: 0, wickets: 38, economy: 7.15, bestScore: "5" },
      worldCup: { matches: 3, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 5, economy: 4.62 },
      knockouts: { matches: 2, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 3, economy: 5.00 },
      bilateral: { matches: 1, runs: 0, avg: 0, sr: 0, hundreds: 0, fifties: 0, wickets: 1, economy: 4.80 }
    }
  }
,
  {
    name: "Babar Azam", role: "Batsman", country: "Pakistan",
    batting: 92, bowling: 15, fielding: 87, captaincy: 80, pressure: 82, overall: 85,
    specialty: "Consistency King", rarity: "Epic",
    battingHand: "Right-handed",
    bowlingStyle: "Off Spin",
    iplTeam: "N/A",
    debutYear: 2015,
    age: 29,

    formats: {
      odi:      { matches: 138, runs: 6700,  avg: 56.78, sr: 88.14, hundreds: 22, fifties: 37, wickets: 0, economy: 0, bestScore: "158" },
      test:     { matches: 57,  runs: 4108,  avg: 47.21, sr: 53.12, hundreds: 10, fifties: 27, wickets: 0, economy: 0, bestScore: "196" },
      t20:      { matches: 130, runs: 4200,  avg: 40.78, sr: 129.80,hundreds: 4,  fifties: 35, wickets: 0, economy: 0, bestScore: "122" },
      worldCup: { matches: 19, runs: 811,   avg: 58.64, sr: 86.42, hundreds: 3,  fifties: 5, wickets: 0, economy: 0 },
      knockouts:{ matches: 15, runs: 612,   avg: 55.64, sr: 83.73, hundreds: 2,  fifties: 4, wickets: 0, economy: 0 },
      bilateral:{ matches: 108, runs: 5233, avg: 57.50, sr: 89.26, hundreds: 17, fifties: 28, wickets: 0, economy: 0 },
    },
  },
  {
    name: "Shaheen Afridi", role: "Bowler", country: "Pakistan",
    batting: 28, bowling: 92, fielding: 78, captaincy: 68, pressure: 84, overall: 84,
    specialty: "Swing Sultan", rarity: "Rare",
    battingHand: "Left-handed",
    bowlingStyle: "Left-arm Fast",
    iplTeam: "N/A",
    debutYear: 2018,
    age: 24,

    formats: {
      odi:      { matches: 73,  runs: 248,  avg: 13.78, sr: 71.26, hundreds: 0,  fifties: 0, wickets: 134, economy: 5.28, bestScore: "23" },
      test:     { matches: 37,  runs: 356,  avg: 13.69, sr: 52.12, hundreds: 0,  fifties: 0, wickets: 142, economy: 3.08, bestScore: "51" },
      t20:      { matches: 88,  runs: 84,   avg: 9.33,  sr: 98.82, hundreds: 0,  fifties: 0, wickets: 122, economy: 7.32, bestScore: "12" },
      worldCup: { matches: 16, runs: 36,   avg: 12.00, sr: 66.67, hundreds: 0,  fifties: 0, wickets: 26, economy: 5.58 },
      knockouts:{ matches: 11, runs: 22,   avg: 11.00, sr: 68.75, hundreds: 0,  fifties: 0, wickets: 17, economy: 5.76 },
      bilateral:{ matches: 50, runs: 184,  avg: 14.15, sr: 70.77, hundreds: 0,  fifties: 0, wickets: 89, economy: 5.04 },
    },
  },
  {
    name: "Mohammad Rizwan", role: "Wicketkeeper-Batsman", country: "Pakistan",
    batting: 88, bowling: 10, fielding: 90, captaincy: 75, pressure: 82, overall: 80,
    specialty: "Consistent Keeper-Bat", rarity: "Epic",
    battingHand: "Right-handed",
    bowlingStyle: "Off Spin",
    iplTeam: "N/A",
    debutYear: 2015,
    age: 31,

    formats: {
      odi:      { matches: 78,  runs: 2864, avg: 47.77, sr: 82.44, hundreds: 7,  fifties: 15, wickets: 0, economy: 0, bestScore: "131*" },
      test:     { matches: 45,  runs: 2850, avg: 46.72, sr: 50.76, hundreds: 7,  fifties: 14, wickets: 0, economy: 0, bestScore: "115*" },
      t20:      { matches: 100, runs: 3432, avg: 47.67, sr: 132.51,hundreds: 5,  fifties: 26, wickets: 0, economy: 0, bestScore: "104*" },
      worldCup: { matches: 11, runs: 544,  avg: 68.00, sr: 110.79,hundreds: 2,  fifties: 3, wickets: 0, economy: 0 },
      knockouts:{ matches: 7,  runs: 288,  avg: 57.60, sr: 104.72,hundreds: 0,  fifties: 3, wickets: 0, economy: 0 },
      bilateral:{ matches: 60, runs: 2215, avg: 46.15, sr: 80.12, hundreds: 5,  fifties: 12, wickets: 0, economy: 0 },
    },
  },
  {
    name: "Steve Smith", role: "Batsman", country: "Australia",
    batting: 92, bowling: 32, fielding: 85, captaincy: 86, pressure: 90, overall: 88,
    specialty: "Test Legend", rarity: "Epic",
    battingHand: "Right-handed",
    bowlingStyle: "Leg Spin",
    iplTeam: "RR",
    debutYear: 2010,
    age: 35,

    formats: {
      odi:      { matches: 157, runs: 5133, avg: 43.38, sr: 87.04, hundreds: 12, fifties: 29, wickets: 29, economy: 5.24, bestScore: "164" },
      test:     { matches: 112, runs: 9864, avg: 57.91, sr: 55.22, hundreds: 34, fifties: 40, wickets: 17, economy: 3.07, bestScore: "239" },
      t20:      { matches: 62,  runs: 898,  avg: 27.21, sr: 125.00,hundreds: 0,  fifties: 2,  wickets: 8,  economy: 7.32, bestScore: "90" },
      worldCup: { matches: 22, runs: 911,  avg: 50.61, sr: 91.18, hundreds: 2,  fifties: 6, wickets: 3, economy: 5.14 },
      knockouts:{ matches: 16, runs: 714,  avg: 59.50, sr: 88.42, hundreds: 2,  fifties: 4, wickets: 2, economy: 4.82 },
      bilateral:{ matches: 118, runs: 3532, avg: 40.60, sr: 86.74, hundreds: 9, fifties: 19, wickets: 24, economy: 5.32 },
    },
  },
  {
    name: "Pat Cummins", role: "Bowler", country: "Australia",
    batting: 44, bowling: 95, fielding: 86, captaincy: 89, pressure: 91, overall: 90,
    specialty: "Captain Pace Ace", rarity: "Epic",

    formats: {
      odi:      { matches: 97,  runs: 598,  avg: 17.59, sr: 85.10, hundreds: 0,  fifties: 1, wickets: 187, economy: 5.08, bestScore: "63" },
      test:     { matches: 71,  runs: 1136, avg: 19.59, sr: 55.16, hundreds: 0,  fifties: 3, wickets: 325, economy: 2.84, bestScore: "72" },
      t20:      { matches: 54,  runs: 89,   avg: 11.13, sr: 118.67,hundreds: 0,  fifties: 0, wickets: 63,  economy: 7.22, bestScore: "18*" },
      worldCup: { matches: 22, runs: 121,  avg: 17.29, sr: 88.32, hundreds: 0,  fifties: 0, wickets: 38, economy: 4.70 },
      knockouts:{ matches: 12, runs: 74,   avg: 14.80, sr: 89.16, hundreds: 0,  fifties: 0, wickets: 22, economy: 4.48 },
      bilateral:{ matches: 62, runs: 411,  avg: 18.68, sr: 87.84, hundreds: 0,  fifties: 1, wickets: 128, economy: 5.26 },
    },
  },
  {
    name: "Mitchell Starc", role: "Bowler", country: "Australia",
    batting: 38, bowling: 92, fielding: 80, captaincy: 60, pressure: 84, overall: 83,
    specialty: "Left-arm Thunder", rarity: "Rare",

    formats: {
      odi:      { matches: 120, runs: 713,  avg: 14.85, sr: 87.68, hundreds: 0,  fifties: 1, wickets: 256, economy: 5.22, bestScore: "52" },
      test:     { matches: 91,  runs: 1901, avg: 18.46, sr: 65.02, hundreds: 0,  fifties: 6, wickets: 375, economy: 3.18, bestScore: "99" },
      t20:      { matches: 62,  runs: 116,  avg: 11.60, sr: 130.34,hundreds: 0,  fifties: 0, wickets: 75,  economy: 7.28, bestScore: "25" },
      worldCup: { matches: 30, runs: 92,   avg: 13.14, sr: 85.19, hundreds: 0,  fifties: 0, wickets: 71, economy: 4.78 },
      knockouts:{ matches: 16, runs: 48,   avg: 12.00, sr: 80.00, hundreds: 0,  fifties: 0, wickets: 36, economy: 4.60 },
      bilateral:{ matches: 76, runs: 588,  avg: 16.89, sr: 88.29, hundreds: 0,  fifties: 1, wickets: 174, economy: 5.42 },
    },
  },
  {
    name: "David Warner", role: "Batsman", country: "Australia",
    batting: 90, bowling: 14, fielding: 83, captaincy: 70, pressure: 82, overall: 82,
    specialty: "Explosive Opener", rarity: "Rare",

    formats: {
      odi:      { matches: 161, runs: 6932, avg: 45.30, sr: 97.26, hundreds: 22, fifties: 33, wickets: 0, economy: 0, bestScore: "179" },
      test:     { matches: 112, runs: 8786, avg: 44.59, sr: 70.19, hundreds: 26, fifties: 37, wickets: 1, economy: 4.50, bestScore: "335*" },
      t20:      { matches: 110, runs: 3283, avg: 33.50, sr: 142.47,hundreds: 1,  fifties: 28, wickets: 0, economy: 0, bestScore: "100*" },
      worldCup: { matches: 29, runs: 1527, avg: 56.56, sr: 105.44,hundreds: 6,  fifties: 7, wickets: 0, economy: 0 },
      knockouts:{ matches: 17, runs: 822,  avg: 54.80, sr: 102.88,hundreds: 3,  fifties: 4, wickets: 0, economy: 0 },
      bilateral:{ matches: 116, runs: 4631, avg: 42.49, sr: 95.48, hundreds: 14, fifties: 23, wickets: 0, economy: 0 },
    },
  },
  {
    name: "Joe Root", role: "Batsman", country: "England",
    batting: 93, bowling: 36, fielding: 85, captaincy: 82, pressure: 86, overall: 89,
    specialty: "Modern Great", rarity: "Epic",

    formats: {
      odi:      { matches: 171, runs: 6738, avg: 47.48, sr: 86.73, hundreds: 17, fifties: 39, wickets: 28, economy: 5.38, bestScore: "133*" },
      test:     { matches: 147, runs: 13610,avg: 51.36, sr: 53.28, hundreds: 37, fifties: 65, wickets: 5,  economy: 3.20, bestScore: "254*" },
      t20:      { matches: 32,  runs: 893,  avg: 35.72, sr: 126.37,hundreds: 0,  fifties: 5,  wickets: 3,  economy: 7.83, bestScore: "90*" },
      worldCup: { matches: 29, runs: 1323, avg: 51.88, sr: 88.60, hundreds: 3,  fifties: 8, wickets: 2, economy: 5.20 },
      knockouts:{ matches: 14, runs: 623,  avg: 51.92, sr: 85.32, hundreds: 1,  fifties: 5, wickets: 1, economy: 5.42 },
      bilateral:{ matches: 128, runs: 4762, avg: 46.20, sr: 86.21, hundreds: 13, fifties: 27, wickets: 25, economy: 5.44 },
    },
  },
  {
    name: "Ben Stokes", role: "All-rounder", country: "England",
    batting: 86, bowling: 82, fielding: 90, captaincy: 88, pressure: 94, overall: 89,
    specialty: "Match Winner", rarity: "Legend",

    formats: {
      odi:      { matches: 113, runs: 3017, avg: 38.94, sr: 93.20, hundreds: 3,  fifties: 21, wickets: 74, economy: 5.91, bestScore: "102*" },
      test:     { matches: 107, runs: 6549, avg: 35.82, sr: 58.12, hundreds: 14, fifties: 30, wickets: 203, economy: 3.14, bestScore: "258" },
      t20:      { matches: 43,  runs: 591,  avg: 22.73, sr: 135.78,hundreds: 0,  fifties: 2,  wickets: 28, economy: 8.32, bestScore: "63*" },
      worldCup: { matches: 23, runs: 719,  avg: 39.94, sr: 94.10, hundreds: 1,  fifties: 5, wickets: 15, economy: 6.12 },
      knockouts:{ matches: 14, runs: 512,  avg: 51.20, sr: 98.27, hundreds: 1,  fifties: 3, wickets: 9,  economy: 6.34 },
      bilateral:{ matches: 76, runs: 1882, avg: 37.26, sr: 91.80, hundreds: 2,  fifties: 14, wickets: 55, economy: 5.68 },
    },
  },
  {
    name: "Kane Williamson", role: "Batsman", country: "New Zealand",
    batting: 91, bowling: 30, fielding: 88, captaincy: 93, pressure: 90, overall: 88,
    specialty: "Captain Composed", rarity: "Legend",

    formats: {
      odi:      { matches: 163, runs: 6554, avg: 47.49, sr: 82.10, hundreds: 14, fifties: 43, wickets: 37, economy: 5.03, bestScore: "148" },
      test:     { matches: 101, runs: 9013, avg: 54.28, sr: 51.31, hundreds: 33, fifties: 36, wickets: 2,  economy: 3.91, bestScore: "251" },
      t20:      { matches: 91,  runs: 2443, avg: 32.81, sr: 124.12,hundreds: 0,  fifties: 18, wickets: 14, economy: 7.22, bestScore: "95" },
      worldCup: { matches: 24, runs: 1186, avg: 55.81, sr: 83.85, hundreds: 2,  fifties: 9, wickets: 3, economy: 4.92 },
      knockouts:{ matches: 16, runs: 742,  avg: 57.08, sr: 82.36, hundreds: 2,  fifties: 5, wickets: 2, economy: 5.18 },
      bilateral:{ matches: 125, runs: 4621, avg: 45.30, sr: 80.98, hundreds: 10, fifties: 31, wickets: 32, economy: 5.12 },
    },
  },
  {
    name: "Trent Boult", role: "Bowler", country: "New Zealand",
    batting: 30, bowling: 90, fielding: 78, captaincy: 56, pressure: 82, overall: 80,
    specialty: "Left-arm Swing King", rarity: "Rare",

    formats: {
      odi:      { matches: 117, runs: 412,  avg: 11.77, sr: 73.62, hundreds: 0,  fifties: 0, wickets: 199, economy: 5.13, bestScore: "32" },
      test:     { matches: 78,  runs: 1114, avg: 15.97, sr: 53.41, hundreds: 0,  fifties: 3, wickets: 317, economy: 2.85, bestScore: "52*" },
      t20:      { matches: 63,  runs: 67,   avg: 8.38,  sr: 108.06,hundreds: 0,  fifties: 0, wickets: 74,  economy: 7.82, bestScore: "14" },
      worldCup: { matches: 24, runs: 56,   avg: 9.33,  sr: 70.89, hundreds: 0,  fifties: 0, wickets: 38, economy: 4.85 },
      knockouts:{ matches: 14, runs: 34,   avg: 8.50,  sr: 68.00, hundreds: 0,  fifties: 0, wickets: 22, economy: 4.68 },
      bilateral:{ matches: 79, runs: 322,  avg: 12.77, sr: 75.29, hundreds: 0,  fifties: 0, wickets: 139, economy: 5.28 },
    },
  },
  {
    name: "Kagiso Rabada", role: "Bowler", country: "South Africa",
    batting: 36, bowling: 94, fielding: 83, captaincy: 65, pressure: 87, overall: 87,
    specialty: "Express Pace", rarity: "Epic",

    formats: {
      odi:      { matches: 107, runs: 492,  avg: 14.47, sr: 73.43, hundreds: 0,  fifties: 0, wickets: 168, economy: 4.93, bestScore: "31" },
      test:     { matches: 73,  runs: 1241, avg: 17.48, sr: 55.81, hundreds: 0,  fifties: 3, wickets: 340, economy: 3.22, bestScore: "56" },
      t20:      { matches: 75,  runs: 98,   avg: 8.17,  sr: 113.95,hundreds: 0,  fifties: 0, wickets: 103, economy: 7.38, bestScore: "15" },
      worldCup: { matches: 19, runs: 82,   avg: 13.67, sr: 72.57, hundreds: 0,  fifties: 0, wickets: 27, economy: 5.08 },
      knockouts:{ matches: 11, runs: 38,   avg: 12.67, sr: 69.09, hundreds: 0,  fifties: 0, wickets: 15, economy: 5.30 },
      bilateral:{ matches: 82, runs: 366,  avg: 14.88, sr: 74.24, hundreds: 0,  fifties: 0, wickets: 130, economy: 4.78 },
    },
  },
  {
    name: "AB de Villiers", role: "Batsman", country: "South Africa",
    batting: 96, bowling: 24, fielding: 96, captaincy: 78, pressure: 90, overall: 92,
    specialty: "Mr. 360", rarity: "Legend",

    formats: {
      odi:      { matches: 228, runs: 9577, avg: 53.50, sr: 101.09,hundreds: 25, fifties: 53, wickets: 0, economy: 0, bestScore: "176" },
      test:     { matches: 114, runs: 8765, avg: 50.66, sr: 60.29, hundreds: 22, fifties: 46, wickets: 0, economy: 0, bestScore: "278*" },
      t20:      { matches: 78,  runs: 1672, avg: 26.13, sr: 135.16,hundreds: 0,  fifties: 10, wickets: 0, economy: 0, bestScore: "79*" },
      worldCup: { matches: 23, runs: 1207, avg: 63.53, sr: 117.28,hundreds: 4,  fifties: 6, wickets: 0, economy: 0 },
      knockouts:{ matches: 15, runs: 724,  avg: 60.33, sr: 114.20,hundreds: 2,  fifties: 5, wickets: 0, economy: 0 },
      bilateral:{ matches: 190, runs: 7648, avg: 51.33, sr: 98.84, hundreds: 19, fifties: 42, wickets: 0, economy: 0 },
    },
  },
  {
    name: "Quinton de Kock", role: "Wicketkeeper-Batsman", country: "South Africa",
    batting: 88, bowling: 10, fielding: 93, captaincy: 66, pressure: 80, overall: 82,
    specialty: "Explosive Wicketkeeper", rarity: "Rare",

    formats: {
      odi:      { matches: 158, runs: 6770, avg: 44.55, sr: 96.28, hundreds: 19, fifties: 38, wickets: 0, economy: 0, bestScore: "178" },
      test:     { matches: 54,  runs: 3300, avg: 38.82, sr: 62.09, hundreds: 6,  fifties: 22, wickets: 0, economy: 0, bestScore: "141*" },
      t20:      { matches: 93,  runs: 2335, avg: 30.72, sr: 135.70,hundreds: 1,  fifties: 14, wickets: 0, economy: 0, bestScore: "79*" },
      worldCup: { matches: 25, runs: 1109, avg: 55.45, sr: 101.19,hundreds: 4,  fifties: 6, wickets: 0, economy: 0 },
      knockouts:{ matches: 13, runs: 512,  avg: 46.55, sr: 96.42, hundreds: 2,  fifties: 3, wickets: 0, economy: 0 },
      bilateral:{ matches: 120, runs: 4724, avg: 42.56, sr: 95.10, hundreds: 13, fifties: 27, wickets: 0, economy: 0 },
    },
  },
  {
    name: "Rashid Khan", role: "Bowler", country: "Afghanistan",
    batting: 55, bowling: 93, fielding: 85, captaincy: 70, pressure: 88, overall: 86,
    specialty: "Spin Wizard", rarity: "Rare",

    formats: {
      odi:      { matches: 107, runs: 1168, avg: 17.39, sr: 96.78, hundreds: 0,  fifties: 2, wickets: 191, economy: 4.25, bestScore: "60*" },
      test:     { matches: 10,  runs: 214,  avg: 26.75, sr: 79.26, hundreds: 0,  fifties: 1, wickets: 50,  economy: 3.28, bestScore: "51" },
      t20:      { matches: 100, runs: 529,  avg: 14.27, sr: 138.48,hundreds: 0,  fifties: 0, wickets: 168, economy: 6.22, bestScore: "60" },
      worldCup: { matches: 17, runs: 143,  avg: 17.88, sr: 93.46, hundreds: 0,  fifties: 0, wickets: 31, economy: 4.00 },
      knockouts:{ matches: 10, runs: 72,   avg: 14.40, sr: 88.89, hundreds: 0,  fifties: 0, wickets: 17, economy: 4.28 },
      bilateral:{ matches: 81, runs: 952,  avg: 17.31, sr: 97.34, hundreds: 0,  fifties: 2, wickets: 148, economy: 4.36 },
    },
  },
  {
    name: "MS Dhoni", role: "Wicketkeeper-Batsman", country: "India",
    batting: 90, bowling: 10, fielding: 96, captaincy: 98, pressure: 96, overall: 92,
    specialty: "Captain Cool", rarity: "Legend",

    formats: {
      odi:      { matches: 350, runs: 10773, avg: 50.58, sr: 87.56, hundreds: 10, fifties: 73, wickets: 1, economy: 5.23, bestScore: "183*" },
      test:     { matches: 90,  runs: 4876,  avg: 38.09, sr: 58.23, hundreds: 6,  fifties: 33, wickets: 0, economy: 0,    bestScore: "224" },
      t20:      { matches: 98,  runs: 1617,  avg: 37.60, sr: 126.13,hundreds: 0,  fifties: 2,  wickets: 0, economy: 0,    bestScore: "56" },
      worldCup: { matches: 50, runs: 1782,  avg: 59.40, sr: 88.65, hundreds: 1,  fifties: 15, wickets: 0, economy: 0 },
      knockouts:{ matches: 29, runs: 924,   avg: 61.60, sr: 86.44, hundreds: 0,  fifties: 8,  wickets: 0, economy: 0 },
      bilateral:{ matches: 273, runs: 8126, avg: 48.07, sr: 87.20, hundreds: 8,  fifties: 52, wickets: 1, economy: 5.23 },
    },
  },
  {
    name: "Sachin Tendulkar", role: "Batsman", country: "India",
    batting: 99, bowling: 30, fielding: 88, captaincy: 78, pressure: 96, overall: 96,
    specialty: "God of Cricket", rarity: "Legend",

    formats: {
      odi:      { matches: 463, runs: 18426, avg: 44.83, sr: 86.23, hundreds: 49, fifties: 96, wickets: 154, economy: 5.09, bestScore: "200*" },
      test:     { matches: 200, runs: 15921, avg: 53.79, sr: 54.04, hundreds: 51, fifties: 68, wickets: 46,  economy: 3.29, bestScore: "248*" },
      t20:      { matches: 1,   runs: 12,    avg: 12.00, sr: 109.09,hundreds: 0,  fifties: 0,  wickets: 0,   economy: 0,    bestScore: "12" },
      worldCup: { matches: 44, runs: 2278,  avg: 56.95, sr: 88.98, hundreds: 6,  fifties: 15, wickets: 6,  economy: 4.81 },
      knockouts:{ matches: 22, runs: 1098,  avg: 52.29, sr: 86.14, hundreds: 2,  fifties: 9,  wickets: 3,  economy: 5.02 },
      bilateral:{ matches: 380, runs: 14602, avg: 44.64, sr: 85.76, hundreds: 40, fifties: 78, wickets: 128, economy: 5.16 },
    },
  },
  {
    name: "Chris Gayle", role: "Batsman", country: "West Indies",
    batting: 93, bowling: 42, fielding: 72, captaincy: 68, pressure: 85, overall: 86,
    specialty: "Universe Boss", rarity: "Legend",
    battingHand: "Left-handed", bowlingStyle: "Off Spin", iplTeam: "RCB", debutYear: 1999, age: 44,

    formats: {
      odi:      { matches: 301, runs: 10480, avg: 37.13, sr: 86.80, hundreds: 25, fifties: 54, wickets: 167, economy: 4.68, bestScore: "215" },
      test:     { matches: 103, runs: 7214,  avg: 42.18, sr: 60.21, hundreds: 15, fifties: 37, wickets: 73,  economy: 3.44, bestScore: "333" },
      t20:      { matches: 79,  runs: 1899,  avg: 28.34, sr: 142.68,hundreds: 2,  fifties: 14, wickets: 18,  economy: 7.18, bestScore: "117" },
      worldCup: { matches: 35, runs: 1186,  avg: 38.26, sr: 93.34, hundreds: 3,  fifties: 7,  wickets: 15, economy: 4.52 },
      knockouts:{ matches: 18, runs: 612,   avg: 36.00, sr: 91.20, hundreds: 1,  fifties: 4,  wickets: 8,  economy: 4.80 },
      bilateral:{ matches: 236, runs: 8256, avg: 38.57, sr: 85.18, hundreds: 20, fifties: 43, wickets: 142, economy: 4.74 },
    },
  },
  {
    name: "Brian Lara", role: "Batsman", country: "West Indies",
    batting: 98, bowling: 10, fielding: 86, captaincy: 72, pressure: 92, overall: 95,
    specialty: "Prince of Port of Spain", rarity: "Legend",
    battingHand: "Left-handed", bowlingStyle: "Leg Spin", iplTeam: "N/A", debutYear: 1990, age: 55,

    formats: {
      odi:      { matches: 299, runs: 10405, avg: 40.48, sr: 79.47, hundreds: 19, fifties: 63, wickets: 4,  economy: 5.84, bestScore: "169" },
      test:     { matches: 131, runs: 11953, avg: 52.89, sr: 52.28, hundreds: 34, fifties: 48, wickets: 0,  economy: 0,    bestScore: "400*" },
      t20:      { matches: 0,   runs: 0,     avg: 0,     sr: 0,     hundreds: 0,  fifties: 0,  wickets: 0,  economy: 0,    bestScore: "" },
      worldCup: { matches: 33, runs: 1225,  avg: 42.24, sr: 76.89, hundreds: 2,  fifties: 9,  wickets: 0, economy: 0 },
      knockouts:{ matches: 14, runs: 548,   avg: 39.14, sr: 78.40, hundreds: 1,  fifties: 4,  wickets: 0, economy: 0 },
      bilateral:{ matches: 240, runs: 8210, avg: 38.74, sr: 79.12, hundreds: 15, fifties: 50, wickets: 4, economy: 5.84 },
    },
  },
  {
    name: "Vivian Richards", role: "Batsman", country: "West Indies",
    batting: 97, bowling: 44, fielding: 90, captaincy: 88, pressure: 96, overall: 96,
    specialty: "Master Blaster", rarity: "Legend",
    battingHand: "Right-handed", bowlingStyle: "Off Spin", iplTeam: "N/A", debutYear: 1974, age: 72,

    formats: {
      odi:      { matches: 187, runs: 6721, avg: 47.00, sr: 90.20, hundreds: 11, fifties: 45, wickets: 118, economy: 4.98, bestScore: "189*" },
      test:     { matches: 121, runs: 8540, avg: 50.24, sr: 70.30, hundreds: 24, fifties: 45, wickets: 32,  economy: 3.67, bestScore: "291" },
      t20:      { matches: 0,   runs: 0,    avg: 0,     sr: 0,     hundreds: 0,  fifties: 0,  wickets: 0,  economy: 0,    bestScore: "" },
      worldCup: { matches: 23, runs: 1013, avg: 63.31, sr: 90.09, hundreds: 3,  fifties: 5,  wickets: 8,  economy: 4.42 },
      knockouts:{ matches: 10, runs: 412,  avg: 51.50, sr: 88.41, hundreds: 1,  fifties: 3,  wickets: 3,  economy: 4.60 },
      bilateral:{ matches: 155, runs: 5426, avg: 44.48, sr: 88.74, hundreds: 8, fifties: 38, wickets: 100, economy: 5.02 },
    },
  },
  {
    name: "Kieron Pollard", role: "All-rounder", country: "West Indies",
    batting: 83, bowling: 76, fielding: 87, captaincy: 72, pressure: 82, overall: 78,
    specialty: "T20 Destroyer", rarity: "Epic",
    battingHand: "Right-handed", bowlingStyle: "Fast-medium", iplTeam: "MI", debutYear: 2007, age: 36,

    formats: {
      odi:      { matches: 101, runs: 2706, avg: 34.69, sr: 89.60, hundreds: 2,  fifties: 17, wickets: 58,  economy: 5.55, bestScore: "119*" },
      test:     { matches: 2,   runs: 45,   avg: 11.25, sr: 46.39, hundreds: 0,  fifties: 0,  wickets: 0,  economy: 0,    bestScore: "26" },
      t20:      { matches: 101, runs: 2318, avg: 32.63, sr: 152.93,hundreds: 0,  fifties: 13, wickets: 60,  economy: 8.68, bestScore: "72*" },
      worldCup: { matches: 18, runs: 412,  avg: 29.43, sr: 97.17, hundreds: 0,  fifties: 2,  wickets: 10, economy: 5.80 },
      knockouts:{ matches: 10, runs: 198,  avg: 28.29, sr: 101.02,hundreds: 0,  fifties: 1,  wickets: 5,  economy: 6.12 },
      bilateral:{ matches: 72, runs: 1886, avg: 32.52, sr: 87.62, hundreds: 2,  fifties: 12, wickets: 42, economy: 5.42 },
    },
  },
  {
    name: "Nicholas Pooran", role: "Wicketkeeper-Batsman", country: "West Indies",
    batting: 84, bowling: 10, fielding: 86, captaincy: 70, pressure: 76, overall: 74,
    specialty: "Six Machine", rarity: "Epic",
    battingHand: "Left-handed", bowlingStyle: "Off Spin", iplTeam: "LSG", debutYear: 2018, age: 28,

    formats: {
      odi:      { matches: 78,  runs: 1819, avg: 30.32, sr: 101.62,hundreds: 2,  fifties: 11, wickets: 0,  economy: 0,    bestScore: "118" },
      test:     { matches: 10,  runs: 452,  avg: 29.47, sr: 53.09, hundreds: 1,  fifties: 1,  wickets: 0,  economy: 0,    bestScore: "103" },
      t20:      { matches: 93,  runs: 1977, avg: 29.51, sr: 143.79,hundreds: 1,  fifties: 10, wickets: 0,  economy: 0,    bestScore: "98*" },
      worldCup: { matches: 12, runs: 312,  avg: 28.36, sr: 118.64,hundreds: 0,  fifties: 2,  wickets: 0,  economy: 0 },
      knockouts:{ matches: 7,  runs: 148,  avg: 24.67, sr: 110.45,hundreds: 0,  fifties: 1,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 58, runs: 1336, avg: 29.69, sr: 100.91,hundreds: 2,  fifties: 8,  wickets: 0,  economy: 0 },
    },
  },
  {
    name: "Kumar Sangakkara", role: "Wicketkeeper-Batsman", country: "Sri Lanka",
    batting: 96, bowling: 10, fielding: 94, captaincy: 85, pressure: 92, overall: 93,
    specialty: "Elegant Run Machine", rarity: "Legend",
    battingHand: "Left-handed", bowlingStyle: "Off Spin", iplTeam: "N/A", debutYear: 2000, age: 46,

    formats: {
      odi:      { matches: 404, runs: 14234, avg: 41.99, sr: 78.86, hundreds: 25, fifties: 93, wickets: 0,  economy: 0,    bestScore: "169" },
      test:     { matches: 134, runs: 12400, avg: 57.41, sr: 54.02, hundreds: 38, fifties: 52, wickets: 0,  economy: 0,    bestScore: "319" },
      t20:      { matches: 56,  runs: 1382,  avg: 28.81, sr: 122.19,hundreds: 0,  fifties: 9,  wickets: 0,  economy: 0,    bestScore: "78" },
      worldCup: { matches: 37, runs: 1532,  avg: 56.74, sr: 83.22, hundreds: 5,  fifties: 8,  wickets: 0,  economy: 0 },
      knockouts:{ matches: 16, runs: 698,   avg: 58.17, sr: 82.08, hundreds: 2,  fifties: 4,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 322, runs: 11281, avg: 41.02, sr: 77.44, hundreds: 18, fifties: 75, wickets: 0, economy: 0 },
    },
  },
  {
    name: "Mahela Jayawardene", role: "Batsman", country: "Sri Lanka",
    batting: 94, bowling: 18, fielding: 90, captaincy: 90, pressure: 88, overall: 91,
    specialty: "Elegant Captain", rarity: "Legend",
    battingHand: "Right-handed", bowlingStyle: "Off Spin", iplTeam: "N/A", debutYear: 1997, age: 46,

    formats: {
      odi:      { matches: 448, runs: 12650, avg: 33.38, sr: 78.96, hundreds: 19, fifties: 77, wickets: 4,  economy: 5.38, bestScore: "120*" },
      test:     { matches: 149, runs: 11814, avg: 49.84, sr: 52.41, hundreds: 34, fifties: 50, wickets: 1,  economy: 5.27, bestScore: "374" },
      t20:      { matches: 55,  runs: 1493,  avg: 31.77, sr: 128.77,hundreds: 0,  fifties: 12, wickets: 0,  economy: 0,    bestScore: "100" },
      worldCup: { matches: 40, runs: 1624,  avg: 47.76, sr: 80.94, hundreds: 4,  fifties: 11, wickets: 0,  economy: 0 },
      knockouts:{ matches: 18, runs: 742,   avg: 49.47, sr: 79.80, hundreds: 1,  fifties: 5,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 362, runs: 9844, avg: 31.26, sr: 78.12, hundreds: 13, fifties: 60, wickets: 4,  economy: 5.38 },
    },
  },
  {
    name: "Muttiah Muralitharan", role: "Bowler", country: "Sri Lanka",
    batting: 22, bowling: 99, fielding: 72, captaincy: 50, pressure: 88, overall: 92,
    specialty: "800 Club", rarity: "Legend",
    battingHand: "Right-handed", bowlingStyle: "Off Spin", iplTeam: "N/A", debutYear: 1992, age: 52,

    formats: {
      odi:      { matches: 350, runs: 674,  avg: 7.64,  sr: 53.43, hundreds: 0,  fifties: 0,  wickets: 534, economy: 3.93, bestScore: "33*" },
      test:     { matches: 133, runs: 1261, avg: 11.68, sr: 44.06, hundreds: 0,  fifties: 0,  wickets: 800, economy: 2.47, bestScore: "67" },
      t20:      { matches: 12,  runs: 14,   avg: 7.00,  sr: 87.50, hundreds: 0,  fifties: 0,  wickets: 13,  economy: 6.22, bestScore: "7" },
      worldCup: { matches: 40, runs: 72,   avg: 7.20,  sr: 47.37, hundreds: 0,  fifties: 0,  wickets: 68,  economy: 3.88 },
      knockouts:{ matches: 16, runs: 28,   avg: 5.60,  sr: 44.44, hundreds: 0,  fifties: 0,  wickets: 24,  economy: 3.72 },
      bilateral:{ matches: 280, runs: 548, avg: 7.51,  sr: 52.18, hundreds: 0,  fifties: 0,  wickets: 434, economy: 3.98 },
    },
  },
  {
    name: "Lasith Malinga", role: "Bowler", country: "Sri Lanka",
    batting: 20, bowling: 92, fielding: 68, captaincy: 48, pressure: 86, overall: 83,
    specialty: "Slingy Yorker Master", rarity: "Epic",
    battingHand: "Right-handed", bowlingStyle: "Fast", iplTeam: "MI", debutYear: 2004, age: 40,

    formats: {
      odi:      { matches: 226, runs: 401,  avg: 7.34,  sr: 60.94, hundreds: 0,  fifties: 0,  wickets: 338, economy: 5.12, bestScore: "27" },
      test:     { matches: 30,  runs: 272,  avg: 9.40,  sr: 55.51, hundreds: 0,  fifties: 0,  wickets: 101, economy: 3.24, bestScore: "64*" },
      t20:      { matches: 84,  runs: 92,   avg: 6.53,  sr: 84.40, hundreds: 0,  fifties: 0,  wickets: 107, economy: 7.73, bestScore: "14*" },
      worldCup: { matches: 30, runs: 48,   avg: 6.86,  sr: 57.83, hundreds: 0,  fifties: 0,  wickets: 56,  economy: 4.78 },
      knockouts:{ matches: 14, runs: 22,   avg: 5.50,  sr: 55.00, hundreds: 0,  fifties: 0,  wickets: 26,  economy: 4.92 },
      bilateral:{ matches: 174, runs: 318, avg: 7.27,  sr: 61.05, hundreds: 0,  fifties: 0,  wickets: 264, economy: 5.18 },
    },
  },
  {
    name: "Wanindu Hasaranga", role: "All-rounder", country: "Sri Lanka",
    batting: 62, bowling: 87, fielding: 76, captaincy: 54, pressure: 78, overall: 76,
    specialty: "Leg-spin All-rounder", rarity: "Rare",
    battingHand: "Right-handed", bowlingStyle: "Leg Spin", iplTeam: "RCB", debutYear: 2019, age: 26,

    formats: {
      odi:      { matches: 62,  runs: 640,  avg: 18.82, sr: 87.32, hundreds: 0,  fifties: 4,  wickets: 83,  economy: 5.22, bestScore: "49*" },
      test:     { matches: 16,  runs: 492,  avg: 22.36, sr: 58.50, hundreds: 0,  fifties: 4,  wickets: 45,  economy: 3.38, bestScore: "91" },
      t20:      { matches: 79,  runs: 539,  avg: 14.57, sr: 118.63,hundreds: 0,  fifties: 2,  wickets: 113, economy: 6.88, bestScore: "71*" },
      worldCup: { matches: 10, runs: 94,   avg: 15.67, sr: 97.92, hundreds: 0,  fifties: 0,  wickets: 14,  economy: 5.60 },
      knockouts:{ matches: 6,  runs: 46,   avg: 15.33, sr: 88.46, hundreds: 0,  fifties: 0,  wickets: 8,   economy: 5.88 },
      bilateral:{ matches: 48, runs: 494,  avg: 18.30, sr: 85.52, hundreds: 0,  fifties: 4,  wickets: 62,  economy: 5.32 },
    },
  },
  {
    name: "Shakib Al Hasan", role: "All-rounder", country: "Bangladesh",
    batting: 82, bowling: 86, fielding: 80, captaincy: 78, pressure: 82, overall: 82,
    specialty: "World's Best All-rounder", rarity: "Epic",
    battingHand: "Left-handed", bowlingStyle: "Left-arm Spin", iplTeam: "KKR", debutYear: 2006, age: 37,

    formats: {
      odi:      { matches: 246, runs: 7610, avg: 37.68, sr: 82.13, hundreds: 9,  fifties: 54, wickets: 317, economy: 4.70, bestScore: "134*" },
      test:     { matches: 70,  runs: 4608, avg: 38.72, sr: 53.28, hundreds: 8,  fifties: 33, wickets: 246, economy: 2.86, bestScore: "217" },
      t20:      { matches: 129, runs: 2524, avg: 23.36, sr: 122.94,hundreds: 0,  fifties: 13, wickets: 141, economy: 7.14, bestScore: "84" },
      worldCup: { matches: 32, runs: 1117, avg: 39.89, sr: 86.24, hundreds: 1,  fifties: 8,  wickets: 43,  economy: 4.88 },
      knockouts:{ matches: 14, runs: 434,  avg: 36.17, sr: 84.34, hundreds: 0,  fifties: 3,  wickets: 18,  economy: 4.92 },
      bilateral:{ matches: 188, runs: 5714, avg: 36.87, sr: 81.18, hundreds: 7, fifties: 41, wickets: 248, economy: 4.74 },
    },
  },
  {
    name: "Mushfiqur Rahim", role: "Wicketkeeper-Batsman", country: "Bangladesh",
    batting: 82, bowling: 10, fielding: 86, captaincy: 72, pressure: 74, overall: 72,
    specialty: "Bangladesh Wall", rarity: "Epic",
    battingHand: "Right-handed", bowlingStyle: "Off Spin", iplTeam: "N/A", debutYear: 2005, age: 36,

    formats: {
      odi:      { matches: 280, runs: 7823, avg: 36.00, sr: 77.83, hundreds: 10, fifties: 48, wickets: 0,  economy: 0,    bestScore: "144*" },
      test:     { matches: 92,  runs: 5765, avg: 38.44, sr: 48.52, hundreds: 11, fifties: 32, wickets: 0,  economy: 0,    bestScore: "223*" },
      t20:      { matches: 102, runs: 1791, avg: 22.11, sr: 118.75,hundreds: 0,  fifties: 8,  wickets: 0,  economy: 0,    bestScore: "72*" },
      worldCup: { matches: 32, runs: 890,  avg: 31.79, sr: 77.82, hundreds: 1,  fifties: 5,  wickets: 0,  economy: 0 },
      knockouts:{ matches: 12, runs: 318,  avg: 28.91, sr: 75.54, hundreds: 0,  fifties: 2,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 218, runs: 5940, avg: 34.75, sr: 76.40, hundreds: 8, fifties: 37, wickets: 0,  economy: 0 },
    },
  },
  {
    name: "Wasim Akram", role: "Bowler", country: "Pakistan",
    batting: 44, bowling: 98, fielding: 82, captaincy: 80, pressure: 92, overall: 94,
    specialty: "Sultan of Swing", rarity: "Legend",
    battingHand: "Left-handed", bowlingStyle: "Left-arm Fast", iplTeam: "N/A", debutYear: 1984, age: 57,

    formats: {
      odi:      { matches: 356, runs: 3717, avg: 16.52, sr: 85.34, hundreds: 3,  fifties: 6,  wickets: 502, economy: 3.89, bestScore: "86" },
      test:     { matches: 104, runs: 2898, avg: 22.65, sr: 54.62, hundreds: 3,  fifties: 7,  wickets: 414, economy: 2.77, bestScore: "257*" },
      t20:      { matches: 0,   runs: 0,    avg: 0,     sr: 0,     hundreds: 0,  fifties: 0,  wickets: 0,   economy: 0,    bestScore: "" },
      worldCup: { matches: 38, runs: 414,  avg: 17.25, sr: 89.03, hundreds: 0,  fifties: 1,  wickets: 55,  economy: 3.68 },
      knockouts:{ matches: 16, runs: 168,  avg: 16.80, sr: 85.28, hundreds: 0,  fifties: 0,  wickets: 24,  economy: 3.72 },
      bilateral:{ matches: 280, runs: 2834, avg: 15.91, sr: 83.47, hundreds: 3, fifties: 5,  wickets: 404, economy: 3.94 },
    },
  },
  {
    name: "Imran Khan", role: "All-rounder", country: "Pakistan",
    batting: 82, bowling: 94, fielding: 78, captaincy: 96, pressure: 92, overall: 91,
    specialty: "Lion of Lahore", rarity: "Legend",
    battingHand: "Right-handed", bowlingStyle: "Fast", iplTeam: "N/A", debutYear: 1971, age: 71,

    formats: {
      odi:      { matches: 175, runs: 3709, avg: 33.41, sr: 72.62, hundreds: 1,  fifties: 19, wickets: 182, economy: 3.89, bestScore: "102*" },
      test:     { matches: 88,  runs: 3807, avg: 37.69, sr: 49.19, hundreds: 6,  fifties: 18, wickets: 362, economy: 2.54, bestScore: "136" },
      t20:      { matches: 0,   runs: 0,    avg: 0,     sr: 0,     hundreds: 0,  fifties: 0,  wickets: 0,   economy: 0,    bestScore: "" },
      worldCup: { matches: 18, runs: 666,  avg: 55.50, sr: 75.76, hundreds: 1,  fifties: 5,  wickets: 34,  economy: 3.62 },
      knockouts:{ matches: 8,  runs: 298,  avg: 49.67, sr: 76.02, hundreds: 1,  fifties: 2,  wickets: 16,  economy: 3.74 },
      bilateral:{ matches: 140, runs: 2762, avg: 30.69, sr: 70.94, hundreds: 0, fifties: 13, wickets: 140, economy: 3.94 },
    },
  },
  {
    name: "Fakhar Zaman", role: "Batsman", country: "Pakistan",
    batting: 84, bowling: 10, fielding: 78, captaincy: 48, pressure: 70, overall: 70,
    specialty: "Left-hand Explosive Opener", rarity: "Rare",
    battingHand: "Left-handed", bowlingStyle: "Off Spin", iplTeam: "N/A", debutYear: 2017, age: 34,

    formats: {
      odi:      { matches: 101, runs: 4038, avg: 43.89, sr: 91.84, hundreds: 10, fifties: 24, wickets: 0,  economy: 0,    bestScore: "210*" },
      test:     { matches: 5,   runs: 248,  avg: 31.00, sr: 52.54, hundreds: 0,  fifties: 2,  wickets: 0,  economy: 0,    bestScore: "94" },
      t20:      { matches: 59,  runs: 1690, avg: 31.30, sr: 135.41,hundreds: 1,  fifties: 11, wickets: 0,  economy: 0,    bestScore: "91*" },
      worldCup: { matches: 13, runs: 534,  avg: 41.08, sr: 94.01, hundreds: 2,  fifties: 3,  wickets: 0,  economy: 0 },
      knockouts:{ matches: 7,  runs: 254,  avg: 36.29, sr: 91.37, hundreds: 0,  fifties: 2,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 78, runs: 3008, avg: 43.59, sr: 91.24, hundreds: 8,  fifties: 18, wickets: 0,  economy: 0 },
    },
  },
  {
    name: "Glenn Maxwell", role: "All-rounder", country: "Australia",
    batting: 88, bowling: 72, fielding: 86, captaincy: 60, pressure: 80, overall: 80,
    specialty: "Big Show", rarity: "Epic",
    battingHand: "Right-handed", bowlingStyle: "Off Spin", iplTeam: "RCB", debutYear: 2012, age: 35,

    formats: {
      odi:      { matches: 148, runs: 4232, avg: 34.13, sr: 122.49,hundreds: 5,  fifties: 24, wickets: 77,  economy: 5.38, bestScore: "201*" },
      test:     { matches: 7,   runs: 339,  avg: 28.25, sr: 70.77, hundreds: 1,  fifties: 0,  wickets: 3,   economy: 3.38, bestScore: "104" },
      t20:      { matches: 108, runs: 2359, avg: 27.43, sr: 157.47,hundreds: 2,  fifties: 15, wickets: 44,  economy: 8.14, bestScore: "145*" },
      worldCup: { matches: 21, runs: 826,  avg: 39.33, sr: 131.10,hundreds: 2,  fifties: 5,  wickets: 8,   economy: 5.78 },
      knockouts:{ matches: 12, runs: 388,  avg: 44.29, sr: 130.20,hundreds: 1,  fifties: 2,  wickets: 4,   economy: 6.02 },
      bilateral:{ matches: 112, runs: 2962, avg: 31.81, sr: 120.41,hundreds: 3, fifties: 17, wickets: 58,  economy: 5.44 },
    },
  },
  {
    name: "Adam Gilchrist", role: "Wicketkeeper-Batsman", country: "Australia",
    batting: 92, bowling: 10, fielding: 96, captaincy: 72, pressure: 90, overall: 91,
    specialty: "Explosive Keeper", rarity: "Legend",
    battingHand: "Left-handed", bowlingStyle: "Off Spin", iplTeam: "N/A", debutYear: 1996, age: 52,

    formats: {
      odi:      { matches: 287, runs: 9619, avg: 35.89, sr: 96.94, hundreds: 16, fifties: 55, wickets: 0,  economy: 0,    bestScore: "172" },
      test:     { matches: 96,  runs: 5570, avg: 47.61, sr: 81.95, hundreds: 17, fifties: 26, wickets: 0,  economy: 0,    bestScore: "204*" },
      t20:      { matches: 13,  runs: 339,  avg: 26.08, sr: 151.79,hundreds: 0,  fifties: 1,  wickets: 0,  economy: 0,    bestScore: "63*" },
      worldCup: { matches: 31, runs: 1085, avg: 36.17, sr: 98.46, hundreds: 1,  fifties: 7,  wickets: 0,  economy: 0 },
      knockouts:{ matches: 14, runs: 488,  avg: 37.54, sr: 97.01, hundreds: 1,  fifties: 3,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 230, runs: 7498, avg: 35.37, sr: 95.94, hundreds: 13, fifties: 43, wickets: 0, economy: 0 },
    },
  },
  {
    name: "Ricky Ponting", role: "Batsman", country: "Australia",
    batting: 96, bowling: 20, fielding: 95, captaincy: 94, pressure: 93, overall: 94,
    specialty: "Punter", rarity: "Legend",
    battingHand: "Right-handed", bowlingStyle: "Fast-medium", iplTeam: "N/A", debutYear: 1995, age: 49,

    formats: {
      odi:      { matches: 375, runs: 13704, avg: 42.04, sr: 80.39, hundreds: 30, fifties: 82, wickets: 3,  economy: 5.64, bestScore: "164" },
      test:     { matches: 168, runs: 13378, avg: 51.86, sr: 57.64, hundreds: 41, fifties: 62, wickets: 5,  economy: 4.35, bestScore: "257" },
      t20:      { matches: 17,  runs: 401,   avg: 26.73, sr: 124.77,hundreds: 0,  fifties: 3,  wickets: 0,  economy: 0,    bestScore: "98*" },
      worldCup: { matches: 46, runs: 1743,  avg: 45.87, sr: 80.90, hundreds: 5,  fifties: 11, wickets: 0,  economy: 0 },
      knockouts:{ matches: 20, runs: 782,   avg: 46.00, sr: 80.41, hundreds: 2,  fifties: 4,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 296, runs: 10438, avg: 41.60, sr: 79.82, hundreds: 23, fifties: 65, wickets: 3, economy: 5.64 },
    },
  },
  {
    name: "Josh Hazlewood", role: "Bowler", country: "Australia",
    batting: 20, bowling: 90, fielding: 80, captaincy: 52, pressure: 82, overall: 82,
    specialty: "Precision Pacer", rarity: "Rare",
    battingHand: "Right-handed", bowlingStyle: "Fast-medium", iplTeam: "RCB", debutYear: 2014, age: 33,

    formats: {
      odi:      { matches: 107, runs: 280,  avg: 7.00,  sr: 58.33, hundreds: 0,  fifties: 0,  wickets: 162, economy: 5.08, bestScore: "34" },
      test:     { matches: 76,  runs: 601,  avg: 10.19, sr: 44.17, hundreds: 0,  fifties: 0,  wickets: 309, economy: 2.68, bestScore: "36*" },
      t20:      { matches: 56,  runs: 24,   avg: 4.80,  sr: 72.73, hundreds: 0,  fifties: 0,  wickets: 59,  economy: 7.82, bestScore: "6*" },
      worldCup: { matches: 22, runs: 14,   avg: 3.50,  sr: 50.00, hundreds: 0,  fifties: 0,  wickets: 35,  economy: 4.76 },
      knockouts:{ matches: 12, runs: 8,    avg: 2.67,  sr: 44.44, hundreds: 0,  fifties: 0,  wickets: 18,  economy: 4.82 },
      bilateral:{ matches: 76, runs: 234,  avg: 7.31,  sr: 58.50, hundreds: 0,  fifties: 0,  wickets: 116, economy: 5.12 },
    },
  },
  {
    name: "Travis Head", role: "Batsman", country: "Australia",
    batting: 86, bowling: 22, fielding: 82, captaincy: 56, pressure: 78, overall: 76,
    specialty: "Aggressive Opener", rarity: "Rare",
    battingHand: "Left-handed", bowlingStyle: "Off Spin", iplTeam: "SRH", debutYear: 2016, age: 30,

    formats: {
      odi:      { matches: 70,  runs: 2503, avg: 40.37, sr: 107.08,hundreds: 6,  fifties: 16, wickets: 12, economy: 5.68, bestScore: "140" },
      test:     { matches: 54,  runs: 3742, avg: 41.57, sr: 70.46, hundreds: 10, fifties: 16, wickets: 3,  economy: 3.74, bestScore: "163" },
      t20:      { matches: 44,  runs: 1108, avg: 27.70, sr: 149.66,hundreds: 0,  fifties: 6,  wickets: 4,  economy: 8.82, bestScore: "89" },
      worldCup: { matches: 12, runs: 548,  avg: 54.80, sr: 118.36,hundreds: 2,  fifties: 3,  wickets: 0,  economy: 0 },
      knockouts:{ matches: 8,  runs: 298,  avg: 49.67, sr: 115.50,hundreds: 1,  fifties: 2,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 52, runs: 1782, avg: 38.74, sr: 105.74,hundreds: 4,  fifties: 11, wickets: 9,  economy: 5.74 },
    },
  },
  {
    name: "Jos Buttler", role: "Wicketkeeper-Batsman", country: "England",
    batting: 90, bowling: 10, fielding: 92, captaincy: 76, pressure: 84, overall: 86,
    specialty: "T20 Maverick", rarity: "Epic",
    battingHand: "Right-handed", bowlingStyle: "Off Spin", iplTeam: "RR", debutYear: 2011, age: 34,

    formats: {
      odi:      { matches: 183, runs: 5463, avg: 41.85, sr: 107.77,hundreds: 12, fifties: 26, wickets: 0,  economy: 0,    bestScore: "162*" },
      test:     { matches: 57,  runs: 2590, avg: 32.38, sr: 62.06, hundreds: 4,  fifties: 14, wickets: 0,  economy: 0,    bestScore: "152*" },
      t20:      { matches: 117, runs: 3248, avg: 37.79, sr: 143.97,hundreds: 4,  fifties: 24, wickets: 0,  economy: 0,    bestScore: "101*" },
      worldCup: { matches: 24, runs: 996,  avg: 49.80, sr: 116.78,hundreds: 3,  fifties: 6,  wickets: 0,  economy: 0 },
      knockouts:{ matches: 14, runs: 528,  avg: 48.00, sr: 112.07,hundreds: 1,  fifties: 4,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 140, runs: 3894, avg: 40.56, sr: 106.15,hundreds: 8, fifties: 18, wickets: 0,  economy: 0 },
    },
  },
  {
    name: "James Anderson", role: "Bowler", country: "England",
    batting: 24, bowling: 94, fielding: 74, captaincy: 42, pressure: 86, overall: 86,
    specialty: "Swing King", rarity: "Legend",
    battingHand: "Right-handed", bowlingStyle: "Fast-medium", iplTeam: "N/A", debutYear: 2003, age: 41,

    formats: {
      odi:      { matches: 194, runs: 273,  avg: 5.57,  sr: 46.43, hundreds: 0,  fifties: 0,  wickets: 269, economy: 4.87, bestScore: "28" },
      test:     { matches: 188, runs: 1276, avg: 8.80,  sr: 33.74, hundreds: 0,  fifties: 0,  wickets: 700, economy: 2.85, bestScore: "81" },
      t20:      { matches: 19,  runs: 15,   avg: 5.00,  sr: 55.56, hundreds: 0,  fifties: 0,  wickets: 18,  economy: 7.72, bestScore: "7*" },
      worldCup: { matches: 28, runs: 28,   avg: 4.67,  sr: 42.42, hundreds: 0,  fifties: 0,  wickets: 34,  economy: 4.78 },
      knockouts:{ matches: 12, runs: 14,   avg: 3.50,  sr: 43.75, hundreds: 0,  fifties: 0,  wickets: 16,  economy: 4.82 },
      bilateral:{ matches: 152, runs: 228, avg: 5.70,  sr: 46.72, hundreds: 0,  fifties: 0,  wickets: 218, economy: 4.92 },
    },
  },
  {
    name: "Stuart Broad", role: "Bowler", country: "England",
    batting: 34, bowling: 90, fielding: 72, captaincy: 46, pressure: 82, overall: 82,
    specialty: "Reverse Swing Ace", rarity: "Epic",
    battingHand: "Right-handed", bowlingStyle: "Fast-medium", iplTeam: "N/A", debutYear: 2006, age: 37,

    formats: {
      odi:      { matches: 121, runs: 693,  avg: 11.55, sr: 80.77, hundreds: 0,  fifties: 1,  wickets: 178, economy: 5.05, bestScore: "45" },
      test:     { matches: 167, runs: 3662, avg: 18.47, sr: 47.42, hundreds: 0,  fifties: 13, wickets: 604, economy: 3.04, bestScore: "169" },
      t20:      { matches: 56,  runs: 99,   avg: 7.62,  sr: 107.61,hundreds: 0,  fifties: 0,  wickets: 65,  economy: 7.61, bestScore: "25*" },
      worldCup: { matches: 18, runs: 98,   avg: 11.00, sr: 78.40, hundreds: 0,  fifties: 0,  wickets: 22,  economy: 5.18 },
      knockouts:{ matches: 8,  runs: 44,   avg: 8.80,  sr: 72.13, hundreds: 0,  fifties: 0,  wickets: 10,  economy: 5.34 },
      bilateral:{ matches: 88, runs: 548,  avg: 10.96, sr: 80.12, hundreds: 0,  fifties: 1,  wickets: 138, economy: 5.12 },
    },
  },
  {
    name: "Brendon McCullum", role: "Wicketkeeper-Batsman", country: "New Zealand",
    batting: 87, bowling: 10, fielding: 88, captaincy: 90, pressure: 88, overall: 86,
    specialty: "Fearless Captain", rarity: "Epic",
    battingHand: "Right-handed", bowlingStyle: "Off Spin", iplTeam: "KKR", debutYear: 2002, age: 42,

    formats: {
      odi:      { matches: 260, runs: 6083, avg: 26.44, sr: 96.65, hundreds: 5,  fifties: 35, wickets: 0,  economy: 0,    bestScore: "166" },
      test:     { matches: 101, runs: 6453, avg: 38.64, sr: 65.31, hundreds: 12, fifties: 31, wickets: 0,  economy: 0,    bestScore: "302" },
      t20:      { matches: 71,  runs: 2140, avg: 35.67, sr: 136.48,hundreds: 2,  fifties: 13, wickets: 0,  economy: 0,    bestScore: "123" },
      worldCup: { matches: 29, runs: 885,  avg: 32.78, sr: 97.15, hundreds: 1,  fifties: 5,  wickets: 0,  economy: 0 },
      knockouts:{ matches: 12, runs: 378,  avg: 34.36, sr: 95.45, hundreds: 0,  fifties: 3,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 206, runs: 4828, avg: 25.55, sr: 95.71, hundreds: 4, fifties: 27, wickets: 0,  economy: 0 },
    },
  },
  {
    name: "Tim Southee", role: "Bowler", country: "New Zealand",
    batting: 34, bowling: 87, fielding: 76, captaincy: 62, pressure: 80, overall: 78,
    specialty: "Seam and Swing", rarity: "Rare",
    battingHand: "Right-handed", bowlingStyle: "Fast-medium", iplTeam: "N/A", debutYear: 2007, age: 35,

    formats: {
      odi:      { matches: 161, runs: 708,  avg: 9.83,  sr: 87.47, hundreds: 0,  fifties: 0,  wickets: 237, economy: 5.22, bestScore: "77*" },
      test:     { matches: 107, runs: 1534, avg: 13.88, sr: 58.16, hundreds: 0,  fifties: 3,  wickets: 390, economy: 3.24, bestScore: "77*" },
      t20:      { matches: 112, runs: 326,  avg: 9.32,  sr: 113.19,hundreds: 0,  fifties: 0,  wickets: 122, economy: 8.38, bestScore: "30*" },
      worldCup: { matches: 28, runs: 88,   avg: 8.80,  sr: 80.00, hundreds: 0,  fifties: 0,  wickets: 39,  economy: 5.10 },
      knockouts:{ matches: 14, runs: 42,   avg: 7.00,  sr: 77.78, hundreds: 0,  fifties: 0,  wickets: 20,  economy: 5.28 },
      bilateral:{ matches: 120, runs: 576, avg: 9.60,  sr: 85.71, hundreds: 0,  fifties: 0,  wickets: 178, economy: 5.32 },
    },
  },
  {
    name: "Dale Steyn", role: "Bowler", country: "South Africa",
    batting: 28, bowling: 97, fielding: 80, captaincy: 52, pressure: 90, overall: 90,
    specialty: "Greatest Fast Bowler of Era", rarity: "Legend",
    battingHand: "Right-handed", bowlingStyle: "Fast", iplTeam: "N/A", debutYear: 2004, age: 41,

    formats: {
      odi:      { matches: 125, runs: 396,  avg: 7.06,  sr: 64.18, hundreds: 0,  fifties: 0,  wickets: 196, economy: 4.83, bestScore: "27" },
      test:     { matches: 93,  runs: 1251, avg: 13.10, sr: 50.65, hundreds: 0,  fifties: 1,  wickets: 439, economy: 3.06, bestScore: "76" },
      t20:      { matches: 47,  runs: 72,   avg: 6.55,  sr: 86.75, hundreds: 0,  fifties: 0,  wickets: 64,  economy: 7.68, bestScore: "11" },
      worldCup: { matches: 23, runs: 48,   avg: 6.86,  sr: 60.76, hundreds: 0,  fifties: 0,  wickets: 32,  economy: 4.62 },
      knockouts:{ matches: 10, runs: 22,   avg: 5.50,  sr: 57.89, hundreds: 0,  fifties: 0,  wickets: 14,  economy: 4.72 },
      bilateral:{ matches: 90, runs: 306,  avg: 6.65,  sr: 62.96, hundreds: 0,  fifties: 0,  wickets: 148, economy: 4.92 },
    },
  },
  {
    name: "Hashim Amla", role: "Batsman", country: "South Africa",
    batting: 92, bowling: 10, fielding: 84, captaincy: 72, pressure: 86, overall: 86,
    specialty: "Picture-perfect Technique", rarity: "Epic",
    battingHand: "Right-handed", bowlingStyle: "Off Spin", iplTeam: "N/A", debutYear: 2004, age: 41,

    formats: {
      odi:      { matches: 181, runs: 8113, avg: 49.16, sr: 88.39, hundreds: 27, fifties: 39, wickets: 0,  economy: 0,    bestScore: "159*" },
      test:     { matches: 124, runs: 9282, avg: 46.64, sr: 50.96, hundreds: 28, fifties: 41, wickets: 0,  economy: 0,    bestScore: "311*" },
      t20:      { matches: 44,  runs: 1277, avg: 35.47, sr: 122.93,hundreds: 0,  fifties: 10, wickets: 0,  economy: 0,    bestScore: "97*" },
      worldCup: { matches: 24, runs: 1044, avg: 52.20, sr: 90.78, hundreds: 4,  fifties: 5,  wickets: 0,  economy: 0 },
      knockouts:{ matches: 10, runs: 448,  avg: 56.00, sr: 88.19, hundreds: 1,  fifties: 4,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 138, runs: 5934, avg: 47.87, sr: 87.22, hundreds: 20, fifties: 29, wickets: 0, economy: 0 },
    },
  },
  {
    name: "Heinrich Klaasen", role: "Wicketkeeper-Batsman", country: "South Africa",
    batting: 86, bowling: 10, fielding: 84, captaincy: 58, pressure: 76, overall: 74,
    specialty: "T20 Finisher", rarity: "Rare",
    battingHand: "Right-handed", bowlingStyle: "Off Spin", iplTeam: "SRH", debutYear: 2017, age: 32,

    formats: {
      odi:      { matches: 68,  runs: 1692, avg: 35.25, sr: 108.28,hundreds: 2,  fifties: 10, wickets: 0,  economy: 0,    bestScore: "123*" },
      test:     { matches: 6,   runs: 284,  avg: 28.40, sr: 58.32, hundreds: 0,  fifties: 3,  wickets: 0,  economy: 0,    bestScore: "79" },
      t20:      { matches: 68,  runs: 1748, avg: 36.42, sr: 157.33,hundreds: 2,  fifties: 10, wickets: 0,  economy: 0,    bestScore: "119*" },
      worldCup: { matches: 8,  runs: 342,  avg: 57.00, sr: 159.44,hundreds: 1,  fifties: 2,  wickets: 0,  economy: 0 },
      knockouts:{ matches: 5,  runs: 182,  avg: 45.50, sr: 148.78,hundreds: 0,  fifties: 2,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 52, runs: 1194, avg: 32.27, sr: 105.47,hundreds: 1,  fifties: 7,  wickets: 0,  economy: 0 },
    },
  },
  {
    name: "Shane Warne", role: "Bowler", country: "Australia",
    batting: 40, bowling: 98, fielding: 76, captaincy: 62, pressure: 90, overall: 92,
    specialty: "King of Spin", rarity: "Legend",
    battingHand: "Right-handed", bowlingStyle: "Leg Spin", iplTeam: "N/A", debutYear: 1992, age: 52,

    formats: {
      odi:      { matches: 194, runs: 1018, avg: 13.05, sr: 82.01, hundreds: 0,  fifties: 1,  wickets: 293, economy: 4.25, bestScore: "55" },
      test:     { matches: 145, runs: 3154, avg: 17.33, sr: 57.49, hundreds: 0,  fifties: 12, wickets: 708, economy: 2.65, bestScore: "99" },
      t20:      { matches: 1,   runs: 0,    avg: 0,     sr: 0,     hundreds: 0,  fifties: 0,  wickets: 1,   economy: 5.50, bestScore: "0" },
      worldCup: { matches: 23, runs: 138,  avg: 11.50, sr: 77.09, hundreds: 0,  fifties: 0,  wickets: 32,  economy: 4.12 },
      knockouts:{ matches: 10, runs: 56,   avg: 9.33,  sr: 74.67, hundreds: 0,  fifties: 0,  wickets: 14,  economy: 4.28 },
      bilateral:{ matches: 152, runs: 804, avg: 12.94, sr: 80.56, hundreds: 0,  fifties: 1,  wickets: 234, economy: 4.32 },
    },
  },
  {
    name: "Rahul Dravid", role: "Batsman", country: "India",
    batting: 95, bowling: 18, fielding: 90, captaincy: 84, pressure: 90, overall: 92,
    specialty: "The Wall", rarity: "Legend",
    battingHand: "Right-handed", bowlingStyle: "Off Spin", iplTeam: "N/A", debutYear: 1996, age: 51,

    formats: {
      odi:      { matches: 344, runs: 10889, avg: 39.17, sr: 71.22, hundreds: 12, fifties: 83, wickets: 4,  economy: 5.44, bestScore: "153" },
      test:     { matches: 164, runs: 13288, avg: 52.31, sr: 42.52, hundreds: 36, fifties: 63, wickets: 1,  economy: 4.38, bestScore: "270" },
      t20:      { matches: 1,   runs: 31,    avg: 31.00, sr: 103.33,hundreds: 0,  fifties: 0,  wickets: 0,  economy: 0,    bestScore: "31" },
      worldCup: { matches: 38, runs: 1592,  avg: 53.07, sr: 72.15, hundreds: 3,  fifties: 12, wickets: 0,  economy: 0 },
      knockouts:{ matches: 16, runs: 648,   avg: 54.00, sr: 71.52, hundreds: 1,  fifties: 5,  wickets: 0,  economy: 0 },
      bilateral:{ matches: 278, runs: 8506, avg: 37.58, sr: 70.14, hundreds: 9,  fifties: 65, wickets: 4,  economy: 5.44 },
    },
  },
  {
    name: "Jacques Kallis", role: "All-rounder", country: "South Africa",
    batting: 95, bowling: 88, fielding: 94, captaincy: 76, pressure: 92, overall: 94,
    specialty: "Greatest All-rounder Ever", rarity: "Legend",
    battingHand: "Right-handed", bowlingStyle: "Fast-medium", iplTeam: "N/A", debutYear: 1995, age: 49,

    formats: {
      odi:      { matches: 328, runs: 11579, avg: 44.37, sr: 72.89, hundreds: 17, fifties: 86, wickets: 273, economy: 4.47, bestScore: "139" },
      test:     { matches: 166, runs: 13289, avg: 55.38, sr: 46.48, hundreds: 45, fifties: 58, wickets: 292, economy: 2.94, bestScore: "224" },
      t20:      { matches: 25,  runs: 666,   avg: 30.27, sr: 116.96,hundreds: 0,  fifties: 5,  wickets: 12,  economy: 7.38, bestScore: "73*" },
      worldCup: { matches: 36, runs: 1469,  avg: 52.46, sr: 77.24, hundreds: 3,  fifties: 11, wickets: 21,  economy: 4.46 },
      knockouts:{ matches: 14, runs: 618,   avg: 56.18, sr: 76.76, hundreds: 1,  fifties: 5,  wickets: 8,   economy: 4.52 },
      bilateral:{ matches: 254, runs: 8692, avg: 41.98, sr: 71.78, hundreds: 12, fifties: 67, wickets: 218, economy: 4.48 },
    },
  },
  {
    name: "Virender Sehwag", role: "Batsman", country: "India",
    batting: 93, bowling: 40, fielding: 80, captaincy: 66, pressure: 84, overall: 86,
    specialty: "Nawab of Najafgarh", rarity: "Legend",
    battingHand: "Right-handed", bowlingStyle: "Off Spin", iplTeam: "DD", debutYear: 1999, age: 45,

    formats: {
      odi:      { matches: 251, runs: 8273, avg: 35.06, sr: 104.33,hundreds: 15, fifties: 38, wickets: 96,  economy: 5.24, bestScore: "219" },
      test:     { matches: 104, runs: 8586, avg: 49.34, sr: 82.23, hundreds: 23, fifties: 32, wickets: 40,  economy: 3.98, bestScore: "319" },
      t20:      { matches: 19,  runs: 394,  avg: 23.18, sr: 145.02,hundreds: 0,  fifties: 3,  wickets: 1,   economy: 8.22, bestScore: "68" },
      worldCup: { matches: 30, runs: 1158, avg: 41.36, sr: 107.59,hundreds: 3,  fifties: 5,  wickets: 6,   economy: 5.38 },
      knockouts:{ matches: 12, runs: 488,  avg: 40.67, sr: 104.28,hundreds: 1,  fifties: 2,  wickets: 2,   economy: 5.52 },
      bilateral:{ matches: 198, runs: 6328, avg: 33.84, sr: 102.48,hundreds: 11, fifties: 28, wickets: 80,  economy: 5.24 },
    },
  }
];
// note: no explicit type ∩┐╜ injected by merge script

async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');
    await Player.deleteMany({});
    console.log('Cleared existing players');
    const result = await Player.insertMany(playersData);
    console.log(`Seeded ${result.length} players successfully`);
    await mongoose.disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}
seed();
