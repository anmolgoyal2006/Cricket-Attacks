"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Player_1 = __importDefault(require("../models/Player"));
const config_1 = require("../config");
dotenv_1.default.config();
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
    },
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
];
async function seed() {
    try {
        await mongoose_1.default.connect(config_1.config.mongodbUri);
        console.log('Connected to MongoDB');
        await Player_1.default.deleteMany({});
        console.log('Cleared existing players');
        const result = await Player_1.default.insertMany(playersData);
        console.log(`Seeded ${result.length} players successfully`);
        await mongoose_1.default.disconnect();
        console.log('Done');
    }
    catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed-all.js.map