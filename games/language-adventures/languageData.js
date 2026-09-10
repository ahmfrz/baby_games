export const SCENARIOS = [
  { id:'home', title:'At Home', icon:'🏠', tone:'coral', art:'home-helper.png', subtitle:'Little helpers make a big difference.', steps:[
    { phrase:'Let’s tidy up!', prompt:'Tap the toy box.', type:'tap', activity:'tidy-room', target:'toybox', position:[72,66], success:'Great helping!' },
    { phrase:'Where is Teddy?', prompt:'Tap Teddy.', type:'choice', activity:'find-hidden', choices:[['Teddy','teddy',true],['Ball','ball',false],['Book','book',false]], success:'There is Teddy!' },
    { phrase:'Give me the ball.', prompt:'Drag the ball to the child.', type:'drag', activity:'share-toy', item:'ball', target:'child', itemPosition:[45,60], targetPosition:[18,68], success:'Thank you!' },
    { phrase:'Good night!', prompt:'Tap the sleepy bed.', type:'tap', activity:'bedtime', target:'bed', position:[78,67], success:'Sweet dreams!' }
  ]},
  { id:'park', title:'In the Park', icon:'🌳', tone:'green', art:'park-friend.png', subtitle:'Notice, share, and make a new friend.', steps:[
    { phrase:'Look at the puppy!', prompt:'Tap the puppy.', type:'tap', activity:'meet-friend', target:'puppy', position:[53,68], success:'Hello, puppy!' },
    { phrase:'Can you find the butterfly?', prompt:'Tap the butterfly.', type:'choice', activity:'spot-nature', choices:[['Butterfly','butterfly',true],['Leaf','leaf',false],['Ball','ball',false]], success:'You found it!' },
    { phrase:'Let’s share.', prompt:'Drag the ball to your friend.', type:'drag', activity:'share-at-park', item:'ball', target:'friend', itemPosition:[42,62], targetPosition:[78,67], success:'Sharing is kind!' },
    { phrase:'I am going!', prompt:'Tap the path.', type:'tap', activity:'follow-path', target:'path', position:[54,78], success:'Let’s go!' }
  ]},
  { id:'school', title:'At School', icon:'🎒', tone:'blue', art:'school-friend.png', subtitle:'Learn, listen, and help your friends.', steps:[
    { phrase:'Hello, friend!', prompt:'Tap your friend.', type:'tap', activity:'greet-classmate', target:'friend', position:[25,68], success:'Hello!' },
    { phrase:'Where are the crayons?', prompt:'Find the crayons.', type:'choice', activity:'pack-school', choices:[['Crayons','crayons',true],['Cup','cup',false],['Ball','ball',false]], success:'You found them!' },
    { phrase:'Share the crayons.', prompt:'Drag the crayons to your friend.', type:'drag', activity:'share-supplies', item:'crayons', target:'friend', itemPosition:[42,63], targetPosition:[77,67], success:'That was kind!' },
    { phrase:'Time to learn!', prompt:'Tap the book.', type:'tap', activity:'open-book', target:'book', position:[56,68], success:'Ready to learn!' }
  ]},
  { id:'nature', title:'In Nature', icon:'🏔️', tone:'purple', art:'nature-helper.png', subtitle:'Care for our beautiful world.', steps:[
    { phrase:'Look at the mountains!', prompt:'Tap the mountains.', type:'tap', activity:'discover-view', target:'mountains', position:[52,52], success:'So beautiful!' },
    { phrase:'What belongs in nature?', prompt:'Tap the butterfly.', type:'choice', activity:'protect-nature', choices:[['Butterfly','butterfly',true],['Bottle','bottle',false],['Wrapper','wrapper',false]], success:'A happy butterfly!' },
    { phrase:'Pick it up.', prompt:'Drag the bottle to the recycling bin.', type:'drag', activity:'recycle-cleanup', item:'bottle', target:'bin', itemPosition:[42,61], targetPosition:[78,68], success:'Thank you for helping!' },
    { phrase:'The Earth is our home.', prompt:'Tap the smiling Earth.', type:'tap', activity:'care-for-earth', target:'earth', position:[52,68], success:'Be kind to our planet!' }
  ]},
  { id:'world', title:'Around the World', icon:'🌍', tone:'orange', art:'hero-explorer.png', subtitle:'Explore new places and meet new friends.', steps:[
    { phrase:'Where shall we go?', prompt:'Tap the airplane.', type:'tap', activity:'board-plane', target:'plane', position:[73,38], success:'Off we go!' },
    { phrase:'Look at this place!', prompt:'Tap the landmark.', type:'choice', activity:'landmark-match', choices:[['Landmark','landmark',true],['Cloud','cloud',false],['Suitcase','suitcase',false]], success:'What a wonderful place!' },
    { phrase:'Hello, friend!', prompt:'Tap the friendly globe.', type:'tap', activity:'greet-world', target:'globe', position:[51,68], success:'Hello, world!' },
    { phrase:'Let’s explore together.', prompt:'Tap the big map.', type:'tap', activity:'trace-route', target:'map', position:[51,69], success:'Adventure complete!' }
  ]}
];

export const ASSET_ROOT = new URL('./assets/', import.meta.url).href;
export const NEW_ART_ROOT = new URL('./assets/new/', import.meta.url).href;
