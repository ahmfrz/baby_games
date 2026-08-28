export const SCENARIOS = [
  {
    id: 'home',
    name: '🏠 Home',
    shortName: 'Home',
    scene: 'bedroom',
    color: 'sun',
    steps: [
      {
        id: 'where-is-mumma',
        phrase: 'Where is Mumma?',
        instruction: 'Find Mumma!',
        type: 'find-mumma',
        success: 'There she is!'
      },
      {
        id: 'come-here',
        phrase: 'Come here!',
        instruction: 'Tap Mumma.',
        type: 'come-here',
        success: 'I am coming!'
      },
      {
        id: 'lets-go',
        phrase: "Let’s go!",
        instruction: 'Tap the door.',
        type: 'door',
        success: "Let’s go!"
      },
      {
        id: 'i-am-going',
        phrase: 'I am going.',
        instruction: 'Tap me as I go!',
        type: 'going',
        success: 'I am going!'
      },
      {
        id: 'i-am-sleeping',
        phrase: 'I am sleeping.',
        instruction: 'Tap the sleepy girl.',
        type: 'sleeping',
        success: 'Good night!'
      }
    ]
  },
  {
    id: 'park',
    name: '🌳 Park',
    shortName: 'Park',
    scene: 'park',
    color: 'leaf',
    steps: [
      {
        id: 'i-am-running',
        phrase: 'I am running.',
        instruction: 'Tap the runner!',
        type: 'running',
        success: 'Run, run, run!'
      },
      {
        id: 'what-is-that',
        phrase: 'What is that?',
        instruction: 'What do you see? Tap the ball.',
        type: 'choice-ball',
        success: 'That is a ball!'
      },
      {
        id: 'where-did-it-go',
        phrase: 'Where did it go?',
        instruction: 'Find the ball!',
        type: 'find-ball',
        success: 'There it is!'
      },
      {
        id: 'go-there',
        phrase: 'Go there.',
        instruction: 'Tap the slide.',
        type: 'destination-slide',
        success: 'I went there!'
      },
      {
        id: 'park-lets-go',
        phrase: "Let’s go!",
        instruction: 'Tap the path.',
        type: 'destination-path',
        success: 'Bye-bye, park!'
      }
    ]
  },
  {
    id: 'kitchen',
    name: '🍎 Kitchen',
    shortName: 'Kitchen',
    scene: 'kitchen',
    color: 'berry',
    steps: [
      {
        id: 'i-am-eating',
        phrase: 'I am eating.',
        instruction: 'Tap the yummy food.',
        type: 'eating',
        success: 'Yummy!'
      },
      {
        id: 'what-did-you-eat',
        phrase: 'What did you eat?',
        instruction: 'Tap the apple.',
        type: 'food-choice',
        success: 'I ate an apple!'
      },
      {
        id: 'i-am-drinking',
        phrase: 'I am drinking.',
        instruction: 'Tap the water.',
        type: 'drink-choice',
        success: 'Ahh, water!'
      },
      {
        id: 'take-this',
        phrase: 'Take this.',
        instruction: 'Drag the banana to the girl.',
        type: 'drag-to-toddler',
        success: 'Thank you!'
      },
      {
        id: 'give-me-that',
        phrase: 'Give me that.',
        instruction: 'Drag the cookie to Mumma.',
        type: 'drag-to-mumma',
        success: 'Thank you!'
      }
    ]
  },
  {
    id: 'toys',
    name: '🧸 Toy Room',
    shortName: 'Toys',
    scene: 'toy-room',
    color: 'sky',
    steps: [
      {
        id: 'toy-what-is-that',
        phrase: 'What is that?',
        instruction: 'Tap Teddy.',
        type: 'teddy-choice',
        success: 'That is Teddy!'
      },
      {
        id: 'how-do-you-do-that',
        phrase: 'How do you do that?',
        instruction: 'Tap Teddy to make him play.',
        type: 'teddy-trick',
        success: 'Wow! Teddy can do it!'
      },
      {
        id: 'how-are-you',
        phrase: 'How are you?',
        instruction: 'Tap the happy face.',
        type: 'how-are-you',
        success: 'I am happy!'
      },
      {
        id: 'why-did-you-do-that',
        phrase: 'Why did you do that?',
        instruction: 'Tap Teddy.',
        type: 'teddy-mischief',
        success: 'Silly Teddy!'
      },
      {
        id: 'toy-where-is-it',
        phrase: 'Where is it?',
        instruction: 'Find Teddy!',
        type: 'find-teddy',
        success: 'There you are!'
      }
    ]
  }
];

export const ASSET_ROOT = 'games/language-adventures/assets/';
