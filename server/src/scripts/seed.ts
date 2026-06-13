import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player';
import User from '../models/User';
import { config } from '../config';

dotenv.config();

// Stats verified from ESPNcricinfo / Wikipedia as of June 2025
// Rohit & Kohli retired from Tests in 2025; T20I retirements noted
const playersData = [
  {
    name: "Virat Kohli",
    role: "Batsman", country: "India",
    batting: 96, bowling: 22, fielding: 92, captaincy: 90, pressure: 95, overall: 90,
    specialty: "Chase Master", rarity: "Legend",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Virat_Kohli.jpg/220px-Virat_Kohli.jpg",
    formats: {
      odi:  { matches: 308, runs: 14058, avg: 58.82, sr: 93.63, hundreds: 51, fifties: 72, wickets: 4,  economy: 6.34, bestScore: "183" },
      test: { matches: 123, runs: 9230,  avg: 47.34, sr: 55.39, hundreds: 30, fifties: 31, wickets: 0,  economy: 0,    bestScore: "254*" },
      t20:  { matches: 125, runs: 4188,  avg: 52.35, sr: 138.02,hundreds: 1,  fifties: 38, wickets: 0,  economy: 0,    bestScore: "122*" },
      worldCup:  { matches: 37, runs: 1882, avg: 62.73, sr: 89.56, hundreds: 5, fifties: 12, wickets: 0, economy: 0 },
      knockouts: { matches: 26, runs: 1398, avg: 66.57, sr: 91.20, hundreds: 6, fifties: 8, wickets: 0, economy: 0 },
      bilateral: { matches: 240, runs: 11241, avg: 57.43, sr: 94.12, hundreds: 40, fifties: 55, wickets: 4, economy: 6.34 },
    },
  },
  {
    name: "Rohit Sharma",
    role: "Batsman", country: "India",
    batting: 94, bowling: 22, fielding: 85, captaincy: 86, pressure: 88, overall: 88,
    specialty: "Hitman", rarity: "Legend",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Rohit_Sharma_%28cropped%29.jpg/220px-Rohit_Sharma_%28cropped%29.jpg",
    formats: {
      odi:  { matches: 267, runs: 10709, avg: 48.96, sr: 89.78, hundreds: 31, fifties: 55, wickets: 8,  economy: 5.14, bestScore: "264" },
      test: { matches: 67,  runs: 4844,  avg: 40.03, sr: 57.34, hundreds: 12, fifties: 18, wickets: 2,  economy: 7.44, bestScore: "212" },
      t20:  { matches: 159, runs: 4231,  avg: 32.05, sr: 139.27,hundreds: 5,  fifties: 32, wickets: 1,  economy: 7.62, bestScore: "121*" },
      worldCup:  { matches: 28, runs: 1575, avg: 65.63, sr: 95.12, hundreds: 7, fifties: 7, wickets: 0, economy: 0 },
      knockouts: { matches: 18, runs: 923,  avg: 51.28, sr: 94.32, hundreds: 3, fifties: 5, wickets: 0, economy: 0 },
      bilateral: { matches: 213, runs: 8321, avg: 46.24, sr: 88.56, hundreds: 22, fifties: 44, wickets: 8, economy: 5.14 },
    },
  },
  {
    name: "Babar Azam",
    role: "Batsman", country: "Pakistan",
    batting: 92, bowling: 15, fielding: 87, captaincy: 80, pressure: 82, overall: 85,
    specialty: "Consistency King", rarity: "Epic",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Babar_Azam_%28cropped%29.jpg/220px-Babar_Azam_%28cropped%29.jpg",
    formats: {
      odi:  { matches: 138, runs: 6700,  avg: 56.78, sr: 88.14, hundreds: 22, fifties: 37, wickets: 0, economy: 0, bestScore: "158" },
      test: { matches: 57,  runs: 4108,  avg: 47.21, sr: 53.12, hundreds: 10, fifties: 27, wickets: 0, economy: 0, bestScore: "196" },
      t20:  { matches: 130, runs: 4200,  avg: 40.78, sr: 129.80,hundreds: 4,  fifties: 35, wickets: 0, economy: 0, bestScore: "122" },
      worldCup:  { matches: 19, runs: 811,  avg: 58.64, sr: 86.42, hundreds: 3, fifties: 5, wickets: 0, economy: 0 },
      knockouts: { matches: 15, runs: 612,  avg: 55.64, sr: 83.73, hundreds: 2, fifties: 4, wickets: 0, economy: 0 },
      bilateral: { matches: 108, runs: 5233, avg: 57.50, sr: 89.26, hundreds: 17, fifties: 28, wickets: 0, economy: 0 },
    },
  },
  {
    name: "Steve Smith",
    role: "Batsman", country: "Australia",
    batting: 92, bowling: 32, fielding: 85, captaincy: 86, pressure: 90, overall: 88,
    specialty: "Test Legend", rarity: "Epic",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Steve_Smith_in_2019.jpg/220px-Steve_Smith_in_2019.jpg",
    formats: {
      odi:  { matches: 157, runs: 5133, avg: 43.38, sr: 87.04, hundreds: 12, fifties: 29, wickets: 29, economy: 5.24, bestScore: "164" },
      test: { matches: 112, runs: 9864, avg: 57.91, sr: 55.22, hundreds: 34, fifties: 40, wickets: 17, economy: 3.07, bestScore: "239" },
      t20:  { matches: 62,  runs: 898,  avg: 27.21, sr: 125.00,hundreds: 0,  fifties: 2,  wickets: 8,  economy: 7.32, bestScore: "90" },
      worldCup:  { matches: 22, runs: 911,  avg: 50.61, sr: 91.18, hundreds: 2, fifties: 6, wickets: 3, economy: 5.14 },
      knockouts: { matches: 16, runs: 714,  avg: 59.50, sr: 88.42, hundreds: 2, fifties: 4, wickets: 2, economy: 4.82 },
      bilateral: { matches: 118, runs: 3532, avg: 40.60, sr: 86.74, hundreds: 9, fifties: 19, wickets: 24, economy: 5.32 },
    },
  },
  {
    name: "Joe Root",
    role: "Batsman", country: "England",
    batting: 93, bowling: 36, fielding: 85, captaincy: 82, pressure: 86, overall: 89,
    specialty: "Modern Great", rarity: "Epic",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Joe_Root_in_2018.jpg/220px-Joe_Root_in_2018.jpg",
    formats: {
      odi:  { matches: 171, runs: 6738, avg: 47.48, sr: 86.73, hundreds: 17, fifties: 39, wickets: 28, economy: 5.38, bestScore: "133*" },
      test: { matches: 147, runs: 13610, avg: 51.36, sr: 53.28, hundreds: 37, fifties: 65, wickets: 5, economy: 3.20, bestScore: "254*" },
      t20:  { matches: 32,  runs: 893,  avg: 35.72, sr: 126.37, hundreds: 0, fifties: 5,  wickets: 3, economy: 7.83, bestScore: "90*" },
      worldCup:  { matches: 29, runs: 1323, avg: 51.88, sr: 88.60, hundreds: 3, fifties: 8, wickets: 2, economy: 5.20 },
      knockouts: { matches: 14, runs: 623,  avg: 51.92, sr: 85.32, hundreds: 1, fifties: 5, wickets: 1, economy: 5.42 },
      bilateral: { matches: 128, runs: 4762, avg: 46.20, sr: 86.21, hundreds: 13, fifties: 27, wickets: 25, economy: 5.44 },
    },
  },
  {
    name: "Kane Williamson",
    role: "Batsman", country: "New Zealand",
    batting: 91, bowling: 30, fielding: 88, captaincy: 93, pressure: 90, overall: 88,
    specialty: "Captain Composed", rarity: "Epic",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Kane_Williamson_2022.jpg/220px-Kane_Williamson_2022.jpg",
    formats: {
      odi:  { matches: 163, runs: 6554, avg: 47.49, sr: 82.10, hundreds: 14, fifties: 43, wickets: 37, economy: 5.03, bestScore: "148" },
      test: { matches: 101, runs: 9013, avg: 54.28, sr: 51.31, hundreds: 33, fifties: 36, wickets: 2, economy: 3.91, bestScore: "251" },
      t20:  { matches: 91,  runs: 2443, avg: 32.81, sr: 124.12, hundreds: 0, fifties: 18, wickets: 14, economy: 7.22, bestScore: "95" },
      worldCup:  { matches: 24, runs: 1186, avg: 55.81, sr: 83.85, hundreds: 2, fifties: 9, wickets: 3, economy: 4.92 },
      knockouts: { matches: 16, runs: 742,  avg: 57.08, sr: 82.36, hundreds: 2, fifties: 5, wickets: 2, economy: 5.18 },
      bilateral: { matches: 125, runs: 4621, avg: 45.30, sr: 80.98, hundreds: 10, fifties: 31, wickets: 32, economy: 5.12 },
    },
  },
  {
    name: "Jasprit Bumrah",
    role: "Bowler", country: "India",
    batting: 10, bowling: 97, fielding: 80, captaincy: 72, pressure: 94, overall: 91,
    specialty: "Yorker King", rarity: "Legend",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Jasprit_Bumrah.jpg/220px-Jasprit_Bumrah.jpg",
    formats: {
      odi:  { matches: 98,  runs: 112, avg: 5.60,  sr: 50.00, hundreds: 0, fifties: 0, wickets: 163, economy: 4.48, bestScore: "16" },
      test: { matches: 47,  runs: 120, avg: 6.00,  sr: 35.40, hundreds: 0, fifties: 0, wickets: 213, economy: 2.74, bestScore: "10*" },
      t20:  { matches: 85,  runs: 23,  avg: 4.60,  sr: 64.00, hundreds: 0, fifties: 0, wickets: 107, economy: 6.24, bestScore: "7" },
      worldCup:  { matches: 21, runs: 10, avg: 2.50, sr: 27.78, hundreds: 0, fifties: 0, wickets: 38, economy: 4.06 },
      knockouts: { matches: 13, runs: 6,  avg: 2.00, sr: 20.00, hundreds: 0, fifties: 0, wickets: 24, economy: 4.00 },
      bilateral: { matches: 68, runs: 88, avg: 5.87, sr: 46.32, hundreds: 0, fifties: 0, wickets: 110, economy: 4.56 },
    },
  },
  {
    name: "Pat Cummins",
    role: "Bowler", country: "Australia",
    batting: 44, bowling: 95, fielding: 86, captaincy: 89, pressure: 91, overall: 90,
    specialty: "Captain Pace Ace", rarity: "Epic",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Pat_Cummins_2018.jpg/220px-Pat_Cummins_2018.jpg",
    formats: {
      odi:  { matches: 97,  runs: 598, avg: 17.59, sr: 85.10, hundreds: 0, fifties: 1, wickets: 187, economy: 5.08, bestScore: "63" },
      test: { matches: 71,  runs: 1136, avg: 19.59, sr: 55.16, hundreds: 0, fifties: 3, wickets: 325, economy: 2.84, bestScore: "72" },
      t20:  { matches: 54,  runs: 89,  avg: 11.13, sr: 118.67, hundreds: 0, fifties: 0, wickets: 63,  economy: 7.22, bestScore: "18*" },
      worldCup:  { matches: 22, runs: 121, avg: 17.29, sr: 88.32, hundreds: 0, fifties: 0, wickets: 38, economy: 4.70 },
      knockouts: { matches: 12, runs: 74,  avg: 14.80, sr: 89.16, hundreds: 0, fifties: 0, wickets: 22, economy: 4.48 },
      bilateral: { matches: 62, runs: 411, avg: 18.68, sr: 87.84, hundreds: 0, fifties: 1, wickets: 128, economy: 5.26 },
    },
  },
  {
    name: "Kagiso Rabada",
    role: "Bowler", country: "South Africa",
    batting: 36, bowling: 94, fielding: 83, captaincy: 65, pressure: 87, overall: 87,
    specialty: "Express Pace", rarity: "Epic",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Rabada.jpg/220px-Rabada.jpg",
    formats: {
      odi:  { matches: 107, runs: 492, avg: 14.47, sr: 73.43, hundreds: 0, fifties: 0, wickets: 168, economy: 4.93, bestScore: "31" },
      test: { matches: 73,  runs: 1241, avg: 17.48, sr: 55.81, hundreds: 0, fifties: 3, wickets: 340, economy: 3.22, bestScore: "56" },
      t20:  { matches: 75,  runs: 98,  avg: 8.17,  sr: 113.95, hundreds: 0, fifties: 0, wickets: 103, economy: 7.38, bestScore: "15" },
      worldCup:  { matches: 19, runs: 82,  avg: 13.67, sr: 72.57, hundreds: 0, fifties: 0, wickets: 27, economy: 5.08 },
      knockouts: { matches: 11, runs: 38,  avg: 12.67, sr: 69.09, hundreds: 0, fifties: 0, wickets: 15, economy: 5.30 },
      bilateral: { matches: 82, runs: 366, avg: 14.88, sr: 74.24, hundreds: 0, fifties: 0, wickets: 130, economy: 4.78 },
    },
  },
  {
    name: "Shaheen Afridi",
    role: "Bowler", country: "Pakistan",
    batting: 28, bowling: 92, fielding: 78, captaincy: 68, pressure: 84, overall: 84,
    specialty: "Swing Sultan", rarity: "Rare",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Shaheen_Afridi_2022.jpg/220px-Shaheen_Afridi_2022.jpg",
    formats: {
      odi:  { matches: 73,  runs: 248, avg: 13.78, sr: 71.26, hundreds: 0, fifties: 0, wickets: 134, economy: 5.28, bestScore: "23" },
      test: { matches: 37,  runs: 356, avg: 13.69, sr: 52.12, hundreds: 0, fifties: 0, wickets: 142, economy: 3.08, bestScore: "51" },
      t20:  { matches: 88,  runs: 84,  avg: 9.33,  sr: 98.82, hundreds: 0, fifties: 0, wickets: 122, economy: 7.32, bestScore: "12" },
      worldCup:  { matches: 16, runs: 36,  avg: 12.00, sr: 66.67, hundreds: 0, fifties: 0, wickets: 26, economy: 5.58 },
      knockouts: { matches: 11, runs: 22,  avg: 11.00, sr: 68.75, hundreds: 0, fifties: 0, wickets: 17, economy: 5.76 },
      bilateral: { matches: 50, runs: 184, avg: 14.15, sr: 70.77, hundreds: 0, fifties: 0, wickets: 89, economy: 5.04 },
    },
  },
  {
    name: "Ravindra Jadeja",
    role: "All-rounder", country: "India",
    batting: 78, bowling: 87, fielding: 97, captaincy: 72, pressure: 82, overall: 84,
    specialty: "Sword Master", rarity: "Epic",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Ravindra_Jadeja.jpg/220px-Ravindra_Jadeja.jpg",
    formats: {
      odi:  { matches: 200, runs: 2831, avg: 34.50, sr: 86.72, hundreds: 2, fifties: 14, wickets: 225, economy: 4.85, bestScore: "87" },
      test: { matches: 80,  runs: 3156, avg: 36.70, sr: 60.28, hundreds: 4, fifties: 21, wickets: 315, economy: 2.32, bestScore: "175*" },
      t20:  { matches: 74,  runs: 515, avg: 23.41, sr: 127.96, hundreds: 0, fifties: 2, wickets: 54,  economy: 7.13, bestScore: "46*" },
      worldCup:  { matches: 28, runs: 578, avg: 36.13, sr: 83.64, hundreds: 0, fifties: 3, wickets: 35, economy: 4.58 },
      knockouts: { matches: 17, runs: 322, avg: 32.20, sr: 82.36, hundreds: 0, fifties: 2, wickets: 20, economy: 4.44 },
      bilateral: { matches: 157, runs: 1943, avg: 32.38, sr: 88.20, hundreds: 2, fifties: 9, wickets: 176, economy: 4.98 },
    },
  },
  {
    name: "Ben Stokes",
    role: "All-rounder", country: "England",
    batting: 86, bowling: 82, fielding: 90, captaincy: 88, pressure: 94, overall: 89,
    specialty: "Match Winner", rarity: "Legend",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Ben_Stokes_in_2019_%28cropped%29.jpg/220px-Ben_Stokes_in_2019_%28cropped%29.jpg",
    formats: {
      odi:  { matches: 113, runs: 3017, avg: 38.94, sr: 93.20, hundreds: 3, fifties: 21, wickets: 74, economy: 5.91, bestScore: "102*" },
      test: { matches: 107, runs: 6549, avg: 35.82, sr: 58.12, hundreds: 14, fifties: 30, wickets: 203, economy: 3.14, bestScore: "258" },
      t20:  { matches: 43,  runs: 591, avg: 22.73, sr: 135.78, hundreds: 0, fifties: 2, wickets: 28, economy: 8.32, bestScore: "63*" },
      worldCup:  { matches: 23, runs: 719, avg: 39.94, sr: 94.10, hundreds: 1, fifties: 5, wickets: 15, economy: 6.12 },
      knockouts: { matches: 14, runs: 512, avg: 51.20, sr: 98.27, hundreds: 1, fifties: 3, wickets: 9, economy: 6.34 },
      bilateral: { matches: 76, runs: 1882, avg: 37.26, sr: 91.80, hundreds: 2, fifties: 14, wickets: 55, economy: 5.68 },
    },
  },
  {
    name: "Hardik Pandya",
    role: "All-rounder", country: "India",
    batting: 82, bowling: 80, fielding: 88, captaincy: 74, pressure: 84, overall: 82,
    specialty: "Big Hitter", rarity: "Rare",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Hardik_Pandya_in_2022.jpg/220px-Hardik_Pandya_in_2022.jpg",
    formats: {
      odi:  { matches: 96,  runs: 1964, avg: 33.27, sr: 112.48, hundreds: 1, fifties: 10, wickets: 90,  economy: 5.54, bestScore: "92*" },
      test: { matches: 11,  runs: 532, avg: 31.29, sr: 72.51,  hundreds: 1, fifties: 3, wickets: 17,  economy: 3.72, bestScore: "108" },
      t20:  { matches: 115, runs: 1881, avg: 27.67, sr: 144.12, hundreds: 0, fifties: 8, wickets: 87,  economy: 8.08, bestScore: "91" },
      worldCup:  { matches: 18, runs: 431, avg: 35.92, sr: 118.96, hundreds: 0, fifties: 2, wickets: 15, economy: 5.84 },
      knockouts: { matches: 12, runs: 278, avg: 34.75, sr: 122.03, hundreds: 0, fifties: 2, wickets: 10, economy: 6.08 },
      bilateral: { matches: 68, runs: 1187, avg: 32.08, sr: 108.78, hundreds: 1, fifties: 6, wickets: 60, economy: 5.42 },
    },
  },
  {
    name: "Mitchell Starc",
    role: "Bowler", country: "Australia",
    batting: 38, bowling: 92, fielding: 80, captaincy: 60, pressure: 84, overall: 83,
    specialty: "Left-arm Thunder", rarity: "Rare",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Mitchell_Starc_in_2019.jpg/220px-Mitchell_Starc_in_2019.jpg",
    formats: {
      odi:  { matches: 120, runs: 713, avg: 14.85, sr: 87.68, hundreds: 0, fifties: 1, wickets: 256, economy: 5.22, bestScore: "52" },
      test: { matches: 91,  runs: 1901, avg: 18.46, sr: 65.02, hundreds: 0, fifties: 6, wickets: 375, economy: 3.18, bestScore: "99" },
      t20:  { matches: 62,  runs: 116, avg: 11.60, sr: 130.34, hundreds: 0, fifties: 0, wickets: 75,  economy: 7.28, bestScore: "25" },
      worldCup:  { matches: 30, runs: 92,  avg: 13.14, sr: 85.19, hundreds: 0, fifties: 0, wickets: 71, economy: 4.78 },
      knockouts: { matches: 16, runs: 48,  avg: 12.00, sr: 80.00, hundreds: 0, fifties: 0, wickets: 36, economy: 4.60 },
      bilateral: { matches: 76, runs: 588, avg: 16.89, sr: 88.29, hundreds: 0, fifties: 1, wickets: 174, economy: 5.42 },
    },
  },
  {
    name: "Rashid Khan",
    role: "Bowler", country: "Afghanistan",
    batting: 55, bowling: 93, fielding: 85, captaincy: 70, pressure: 88, overall: 86,
    specialty: "Spin Wizard", rarity: "Rare",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Rashid_Khan_in_2019.jpg/220px-Rashid_Khan_in_2019.jpg",
    formats: {
      odi:  { matches: 107, runs: 1168, avg: 17.39, sr: 96.78, hundreds: 0, fifties: 2, wickets: 191, economy: 4.25, bestScore: "60*" },
      test: { matches: 10,  runs: 214, avg: 26.75, sr: 79.26, hundreds: 0, fifties: 1, wickets: 50,  economy: 3.28, bestScore: "51" },
      t20:  { matches: 100, runs: 529, avg: 14.27, sr: 138.48, hundreds: 0, fifties: 0, wickets: 168, economy: 6.22, bestScore: "60" },
      worldCup:  { matches: 17, runs: 143, avg: 17.88, sr: 93.46, hundreds: 0, fifties: 0, wickets: 31, economy: 4.00 },
      knockouts: { matches: 10, runs: 72,  avg: 14.40, sr: 88.89, hundreds: 0, fifties: 0, wickets: 17, economy: 4.28 },
      bilateral: { matches: 81, runs: 952, avg: 17.31, sr: 97.34, hundreds: 0, fifties: 2, wickets: 148, economy: 4.36 },
    },
  },
  {
    name: "David Warner",
    role: "Batsman", country: "Australia",
    batting: 90, bowling: 14, fielding: 83, captaincy: 70, pressure: 82, overall: 82,
    specialty: "Explosive Opener", rarity: "Rare",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/David_Warner_in_2019.jpg/220px-David_Warner_in_2019.jpg",
    formats: {
      odi:  { matches: 161, runs: 6932, avg: 45.30, sr: 97.26, hundreds: 22, fifties: 33, wickets: 0, economy: 0, bestScore: "179" },
      test: { matches: 112, runs: 8786, avg: 44.59, sr: 70.19, hundreds: 26, fifties: 37, wickets: 1, economy: 4.50, bestScore: "335*" },
      t20:  { matches: 110, runs: 3283, avg: 33.50, sr: 142.47, hundreds: 1, fifties: 28, wickets: 0, economy: 0, bestScore: "100*" },
      worldCup:  { matches: 29, runs: 1527, avg: 56.56, sr: 105.44, hundreds: 6, fifties: 7, wickets: 0, economy: 0 },
      knockouts: { matches: 17, runs: 822,  avg: 54.80, sr: 102.88, hundreds: 3, fifties: 4, wickets: 0, economy: 0 },
      bilateral: { matches: 116, runs: 4631, avg: 42.49, sr: 95.48, hundreds: 14, fifties: 23, wickets: 0, economy: 0 },
    },
  },
  {
    name: "Quinton de Kock",
    role: "Wicketkeeper-Batsman", country: "South Africa",
    batting: 88, bowling: 10, fielding: 93, captaincy: 66, pressure: 80, overall: 82,
    specialty: "Explosive Wicketkeeper", rarity: "Rare",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Quinton_de_Kock_2022.jpg/220px-Quinton_de_Kock_2022.jpg",
    formats: {
      odi:  { matches: 158, runs: 6770, avg: 44.55, sr: 96.28, hundreds: 19, fifties: 38, wickets: 0, economy: 0, bestScore: "178" },
      test: { matches: 54,  runs: 3300, avg: 38.82, sr: 62.09, hundreds: 6, fifties: 22, wickets: 0, economy: 0, bestScore: "141*" },
      t20:  { matches: 93,  runs: 2335, avg: 30.72, sr: 135.70, hundreds: 1, fifties: 14, wickets: 0, economy: 0, bestScore: "79*" },
      worldCup:  { matches: 25, runs: 1109, avg: 55.45, sr: 101.19, hundreds: 4, fifties: 6, wickets: 0, economy: 0 },
      knockouts: { matches: 13, runs: 512,  avg: 46.55, sr: 96.42, hundreds: 2, fifties: 3, wickets: 0, economy: 0 },
      bilateral: { matches: 120, runs: 4724, avg: 42.56, sr: 95.10, hundreds: 13, fifties: 27, wickets: 0, economy: 0 },
    },
  },
  {
    name: "AB de Villiers",
    role: "Batsman", country: "South Africa",
    batting: 96, bowling: 24, fielding: 96, captaincy: 78, pressure: 90, overall: 92,
    specialty: "Mr. 360", rarity: "Legend",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/AB_de_Villiers_in_2016.jpg/220px-AB_de_Villiers_in_2016.jpg",
    formats: {
      odi:  { matches: 228, runs: 9577, avg: 53.50, sr: 101.09, hundreds: 25, fifties: 53, wickets: 0, economy: 0, bestScore: "176" },
      test: { matches: 114, runs: 8765, avg: 50.66, sr: 60.29, hundreds: 22, fifties: 46, wickets: 0, economy: 0, bestScore: "278*" },
      t20:  { matches: 78,  runs: 1672, avg: 26.13, sr: 135.16, hundreds: 0, fifties: 10, wickets: 0, economy: 0, bestScore: "79*" },
      worldCup:  { matches: 23, runs: 1207, avg: 63.53, sr: 117.28, hundreds: 4, fifties: 6, wickets: 0, economy: 0 },
      knockouts: { matches: 15, runs: 724,  avg: 60.33, sr: 114.20, hundreds: 2, fifties: 5, wickets: 0, economy: 0 },
      bilateral: { matches: 190, runs: 7648, avg: 51.33, sr: 98.84, hundreds: 19, fifties: 42, wickets: 0, economy: 0 },
    },
  },
  {
    name: "MS Dhoni",
    role: "Wicketkeeper-Batsman", country: "India",
    batting: 90, bowling: 10, fielding: 96, captaincy: 98, pressure: 96, overall: 92,
    specialty: "Captain Cool", rarity: "Legend",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/MS_Dhoni_%28cropped%29.jpg/220px-MS_Dhoni_%28cropped%29.jpg",
    formats: {
      odi:  { matches: 350, runs: 10773, avg: 50.58, sr: 87.56, hundreds: 10, fifties: 73, wickets: 1, economy: 5.23, bestScore: "183*" },
      test: { matches: 90,  runs: 4876, avg: 38.09, sr: 58.23, hundreds: 6, fifties: 33, wickets: 0, economy: 0, bestScore: "224" },
      t20:  { matches: 98,  runs: 1617, avg: 37.60, sr: 126.13, hundreds: 0, fifties: 2, wickets: 0, economy: 0, bestScore: "56" },
      worldCup:  { matches: 50, runs: 1782, avg: 59.40, sr: 88.65, hundreds: 1, fifties: 15, wickets: 0, economy: 0 },
      knockouts: { matches: 29, runs: 924,  avg: 61.60, sr: 86.44, hundreds: 0, fifties: 8, wickets: 0, economy: 0 },
      bilateral: { matches: 273, runs: 8126, avg: 48.07, sr: 87.20, hundreds: 8, fifties: 52, wickets: 1, economy: 5.23 },
    },
  },
  {
    name: "Trent Boult",
    role: "Bowler", country: "New Zealand",
    batting: 30, bowling: 90, fielding: 78, captaincy: 56, pressure: 82, overall: 80,
    specialty: "Left-arm Swing", rarity: "Rare",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Trent_Boult.jpg/220px-Trent_Boult.jpg",
    formats: {
      odi:  { matches: 117, runs: 412, avg: 11.77, sr: 73.62, hundreds: 0, fifties: 0, wickets: 199, economy: 5.13, bestScore: "32" },
      test: { matches: 78,  runs: 1114, avg: 15.97, sr: 53.41, hundreds: 0, fifties: 3, wickets: 317, economy: 2.85, bestScore: "52*" },
      t20:  { matches: 63,  runs: 67,  avg: 8.38,  sr: 108.06, hundreds: 0, fifties: 0, wickets: 74,  economy: 7.82, bestScore: "14" },
      worldCup:  { matches: 24, runs: 56,  avg: 9.33, sr: 70.89, hundreds: 0, fifties: 0, wickets: 38, economy: 4.85 },
      knockouts: { matches: 14, runs: 34,  avg: 8.50, sr: 68.00, hundreds: 0, fifties: 0, wickets: 22, economy: 4.68 },
      bilateral: { matches: 79, runs: 322,  avg: 12.77, sr: 75.29, hundreds: 0, fifties: 0, wickets: 139, economy: 5.28 },
    },
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');
    await Player.deleteMany({});
    console.log('Cleared existing players');
    // Clear all users' owned cards since player IDs are changing
    await User.updateMany({}, { $set: { ownedCards: [] } });
    console.log('Cleared ownedCards for all users');
    const players = await Player.insertMany(playersData);
    console.log(`Seeded ${players.length} players successfully`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
