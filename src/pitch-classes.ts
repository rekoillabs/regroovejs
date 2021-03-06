const pitchClasses = {
  index: {
    kick: 0,
    snare: 1,
    ch: 2,
    oh: 3,
    lt: 4,
    mt: 5,
    ht: 6,
    ride: 7,
    crash: 8,
  },
  drum_index: {
    0: 36,
    1: 38,
    2: 42,
    3: 46,
    4: 41,
    5: 45,
    6: 50,
    7: 51,
    8: 49,
  },
  pitch: {
    kick: [36, 35],
    snare: [38, 37, 39, 40],
    ch: [42, 44, 54],
    oh: [46, 69, 70],
    lt: [41, 43],
    mt: [48, 47, 45, 61, 64, 66, 68],
    ht: [50, 60, 62, 63, 65, 67],
    ride: [51, 52, 53, 55, 56, 59],
    crash: [49, 56, 58],
  },
};

export default pitchClasses;
