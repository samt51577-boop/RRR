// courses.js
// This file is populated with notable courses for each state.

const COURSES_BY_STATE = {
    "IA": [
        {
            id: "glen_oaks_cc",
            name: "Glen Oaks Country Club",
            slope: 143, // Championship Tees
            rating: 74.3,
            pars: [4, 3, 4, 4, 3, 4, 4, 4, 5, 4, 5, 4, 4, 3, 5, 3, 4, 4],
            indexes: [12, 10, 4, 18, 8, 2, 6, 14, 16, 3, 15, 11, 5, 9, 13, 17, 1, 7],
            state: "IA"
        },
        {
            id: "dmcc_north",
            name: "DMCC North Course",
            slope: 139,
            rating: 74.8,
            pars: [4, 5, 3, 4, 3, 4, 4, 4, 5, 4, 4, 3, 5, 5, 4, 4, 3, 5],
            indexes: [11, 7, 15, 1, 17, 3, 13, 5, 9, 14, 6, 18, 8, 2, 10, 12, 16, 4],
            state: "IA"
        },
        {
            id: "dmcc_south",
            name: "DMCC South Course (Updated)",
            slope: 135,
            rating: 73.2,
            pars: [4, 5, 3, 4, 3, 4, 4, 4, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5],
            indexes: [11, 7, 15, 1, 17, 3, 13, 5, 9, 14, 6, 18, 8, 2, 10, 12, 16, 4],
            state: "IA"
        },
        {
            id: "waveland_golf",
            name: "Waveland Golf Course",
            slope: 124,
            rating: 71.2,
            pars: [4, 3, 5, 4, 4, 4, 5, 3, 4, 3, 4, 5, 3, 4, 5, 4, 4, 4],
            indexes: [9, 17, 1, 7, 13, 15, 11, 5, 3, 6, 10, 4, 18, 14, 12, 2, 8, 16],
            state: "IA"
        },
        {
            id: "willow_creek",
            name: "Willow Creek (Blue/White)",
            slope: 121,
            rating: 70.1,
            pars: [4, 4, 3, 4, 4, 4, 3, 5, 4, 4, 5, 4, 3, 5, 4, 4, 3, 4],
            indexes: [5, 7, 15, 11, 9, 1, 17, 3, 13, 10, 6, 2, 16, 8, 14, 12, 18, 4],
            state: "IA"
        }
    ]
};
