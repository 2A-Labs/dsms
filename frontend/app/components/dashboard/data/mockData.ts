import type { Instructor, Lecture, Question } from "./types";

export const instructors: Instructor[] = [
  {
    id: 1,
    name: "Jamie Carter",
    initials: "JC",
    school: "Roadwise Central",
    location: "Northside",
    slots: ["Mon 28 · 09:00", "Tue 29 · 13:00", "Thu 01 · 15:00"],
  },
  {
    id: 2,
    name: "Priya Shah",
    initials: "PS",
    school: "Roadwise Central",
    location: "West End",
    slots: ["Mon 28 · 11:00", "Wed 30 · 10:00", "Fri 02 · 14:00"],
  },
  {
    id: 3,
    name: "Marcus Green",
    initials: "MG",
    school: "Roadwise Central",
    location: "Lakeside",
    slots: ["Tue 29 · 10:00", "Thu 01 · 09:00", "Sat 03 · 11:00"],
  },
];

export const lectures: Lecture[] = [
  {
    title: "Mirror, signal, manoeuvre",
    instructor: "Jamie Carter",
    duration: "08:42",
    color: "bg-primary-light",
  },
  {
    title: "Roundabouts made simple",
    instructor: "Jamie Carter",
    duration: "12:18",
    color: "bg-warning/15",
  },
  {
    title: "A calm approach to junctions",
    instructor: "Jamie Carter",
    duration: "06:35",
    color: "bg-success/15",
  },
];

export const questions: Question[] = [
  {
    category: "theory",
    prompt: "What should you do when approaching a zebra crossing?",
    options: [
      "Speed up before pedestrians arrive",
      "Slow down and stop for waiting pedestrians",
      "Sound the horn continuously",
      "Move to the opposite lane",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "What is the safest following distance in good conditions?",
    options: [
      "One second",
      "Two seconds",
      "Half a car length",
      "No fixed distance is needed",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "When should you use your headlights in poor visibility?",
    options: [
      "Only after sunset",
      "When you cannot see clearly ahead",
      "Only on motorways",
      "Never during the day",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "What does a red X over a motorway lane mean?",
    options: [
      "The lane is for overtaking",
      "The lane is closed",
      "The lane has a lower speed limit",
      "The lane is for buses only",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "What is the main purpose of checking your blind spot?",
    options: [
      "To check your fuel level",
      "To see areas not covered by mirrors",
      "To read road signs",
      "To judge the weather",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "What should you do if your vehicle begins to skid?",
    options: [
      "Brake hard immediately",
      "Steer gently into the skid",
      "Accelerate sharply",
      "Release the steering wheel",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt:
      "What is the usual maximum speed on a built-up road unless signs say otherwise?",
    options: ["20 mph", "30 mph", "40 mph", "50 mph"],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "Why should you avoid coasting downhill?",
    options: [
      "It uses more fuel",
      "It reduces control of the vehicle",
      "It makes the engine louder",
      "It improves braking",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "What should you do before opening your door into traffic?",
    options: [
      "Check mirrors and blind spot",
      "Turn on hazard lights only",
      "Rev the engine",
      "Flash headlights",
    ],
    answer: 0,
  },
  {
    category: "theory",
    prompt: "When is it appropriate to use the horn?",
    options: [
      "To greet another driver",
      "To warn others of your presence",
      "To show frustration",
      "At every junction",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "What does good tyre pressure help with?",
    options: [
      "Control and fuel efficiency",
      "Making the horn louder",
      "Increasing the radio signal",
      "Changing the road surface",
    ],
    answer: 0,
  },
  {
    category: "theory",
    prompt: "What should you do if dazzled by oncoming headlights?",
    options: [
      "Look towards the left edge of the road",
      "Look directly at the lights",
      "Close your eyes",
      "Accelerate past",
    ],
    answer: 0,
  },
  {
    category: "theory",
    prompt: "Why should you reduce speed in rain?",
    options: [
      "The engine becomes weaker",
      "Stopping distances increase",
      "Road signs disappear",
      "The steering locks",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "What is an appropriate use of hazard warning lights?",
    options: [
      "Parking anywhere briefly",
      "Warning of a temporary obstruction",
      "Driving through a green light",
      "Indicating a normal turn",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "What should you do when an emergency vehicle approaches?",
    options: [
      "Block the junction",
      "Move safely out of its way",
      "Follow it closely",
      "Stop in the middle of the road",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "What is the safest way to carry a loose passenger item?",
    options: [
      "On the driver floor",
      "Secured so it cannot move",
      "On the dashboard",
      "In front of an airbag",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "What does a steady amber traffic light mean?",
    options: [
      "Go faster",
      "Stop unless you have crossed the line",
      "Reverse",
      "The road is closed",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "Why is regular rest important on a long drive?",
    options: [
      "It prevents fatigue",
      "It warms the tyres",
      "It changes the speed limit",
      "It improves phone signal",
    ],
    answer: 0,
  },
  {
    category: "theory",
    prompt: "What should you do if you miss your exit?",
    options: [
      "Reverse on the road",
      "Continue and find a safe alternative",
      "Make a sudden turn",
      "Stop in the lane",
    ],
    answer: 1,
  },
  {
    category: "theory",
    prompt: "What should you check before moving off?",
    options: [
      "Only the rear-view mirror",
      "Mirrors, blind spot, and surroundings",
      "Only the dashboard",
      "Only the passenger",
    ],
    answer: 1,
  },
  {
    category: "signs",
    prompt: "What shape are warning signs usually?",
    options: ["Circular", "Triangular", "Rectangular", "Octagonal"],
    answer: 1,
  },
  {
    category: "signs",
    prompt: "What does a circular sign with a red border generally show?",
    options: [
      "An instruction or restriction",
      "A tourist attraction",
      "A service area",
      "A motorway route",
    ],
    answer: 0,
  },
  {
    category: "signs",
    prompt: "What does an octagonal sign mean?",
    options: ["Give way", "Stop", "No entry", "One way"],
    answer: 1,
  },
  {
    category: "signs",
    prompt: "What do blue circular signs generally give?",
    options: [
      "Mandatory instructions",
      "Warnings",
      "Parking information only",
      "Temporary diversions",
    ],
    answer: 0,
  },
  {
    category: "signs",
    prompt: "What does a red and white triangular sign warn you about?",
    options: [
      "A hazard ahead",
      "A permitted turn",
      "A parking bay",
      "A one-way street",
    ],
    answer: 0,
  },
  {
    category: "signs",
    prompt: "What does a broken white centre line mean?",
    options: [
      "You may cross if safe",
      "You must never cross",
      "The road is closed",
      "Only buses may cross",
    ],
    answer: 0,
  },
  {
    category: "signs",
    prompt: "What does a yellow box junction indicate?",
    options: [
      "Stop only in an emergency",
      "Do not enter unless your exit is clear",
      "Parking is encouraged",
      "The lane is for bicycles",
    ],
    answer: 1,
  },
  {
    category: "signs",
    prompt: "What does a no-entry sign tell drivers?",
    options: [
      "No vehicles may enter from that direction",
      "Only buses may enter",
      "Entry is allowed at night",
      "Parking is free",
    ],
    answer: 0,
  },
  {
    category: "signs",
    prompt: "What colour are most motorway signs?",
    options: ["Blue", "Brown", "White", "Yellow"],
    answer: 0,
  },
  {
    category: "signs",
    prompt: "What does a red circle around a number show?",
    options: [
      "Minimum speed",
      "Maximum speed",
      "Distance to a town",
      "Lane number",
    ],
    answer: 1,
  },
  {
    category: "intersections",
    prompt: "At a give-way line, what must you do?",
    options: [
      "Always stop for five seconds",
      "Give priority to traffic on the major road",
      "Sound your horn",
      "Turn on hazard lights",
    ],
    answer: 1,
  },
  {
    category: "intersections",
    prompt: "When turning right at a junction, what should you watch for?",
    options: [
      "Only traffic behind",
      "Oncoming traffic and pedestrians",
      "Only parked cars",
      "Only the kerb",
    ],
    answer: 1,
  },
  {
    category: "intersections",
    prompt: "What is the safest approach to a blind junction?",
    options: [
      "Approach slowly with good observation",
      "Accelerate through it",
      "Use the wrong lane",
      "Stop with wheels turned out",
    ],
    answer: 0,
  },
  {
    category: "intersections",
    prompt: "Who should you give way to when turning across a cycle lane?",
    options: [
      "Nobody",
      "Cyclists continuing straight",
      "Only buses",
      "Only vehicles behind",
    ],
    answer: 1,
  },
];
