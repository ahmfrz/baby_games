import homeTidyRoomVideo from './video/home-tidy-room.mp4';

export const SCENARIOS = [
  { id:'home', title:'At Home', icon:'🏠', tone:'coral', art:'../scenes/toy-room.png', cardArt:'cards/home-video.jpg', subtitle:'Little helpers make a big difference.', videoUrl:homeTidyRoomVideo, steps:[
    { phrase:'Can you find the ball?', prompt:'Tap the ball.', type:'video-tap', activity:'tidy-room', target:'ball', position:[38,63], videoStart:0, videoPause:2.15, success:'You found the ball!' },
    { phrase:'Where should the ball go?', prompt:'Tap the toy box.', type:'video-tap', activity:'put-ball-away', target:'toybox', position:[73,54], videoStart:2.15, videoPause:5.05, success:'Great helping!' },
    { phrase:'Can you find Teddy?', prompt:'Tap Teddy.', type:'video-tap', activity:'find-hidden', target:'teddy', position:[67,67], videoStart:5.05, videoPause:6.65, success:'There is Teddy!' },
    { phrase:'Where should Teddy go?', prompt:'Tap the toy box.', type:'video-tap', activity:'put-teddy-away', target:'toybox', position:[73,54], videoStart:6.65, videoPause:8.15, success:'You tidied up!' }
  ]},
  { id:'park', title:'In the Park', icon:'🌳', tone:'green', art:'../scenes/park.png', cardArt:'cards/park.png', subtitle:'Notice, share, and make a new friend.', steps:[
    { phrase:'Look at the puppy!', prompt:'Tap the puppy.', type:'tap', activity:'meet-friend', target:'puppy', position:[53,68], success:'Hello, puppy!' },
    { phrase:'Can you find the butterfly?', prompt:'Tap the butterfly.', type:'choice', activity:'spot-nature', choices:[['Butterfly','butterfly',true],['Leaf','leaf',false],['Ball','ball',false]], success:'You found it!' },
    { phrase:'Let’s share.', prompt:'Drag the ball to your friend.', type:'drag', activity:'share-at-park', item:'ball', target:'friend', itemPosition:[42,62], targetPosition:[78,67], success:'Sharing is kind!' },
    { phrase:'I am going!', prompt:'Tap the path.', type:'tap', activity:'follow-path', target:'path', position:[54,78], success:'Let’s go!' }
  ]},
  { id:'school', title:'At School', icon:'🎒', tone:'blue', art:'school-friend.png', cardArt:'cards/school.png', subtitle:'Learn, listen, and help your friends.', steps:[
    { phrase:'Hello, friend!', prompt:'Tap your friend.', type:'tap', activity:'greet-classmate', target:'friend', position:[25,68], success:'Hello!' },
    { phrase:'Where are the crayons?', prompt:'Find the crayons.', type:'choice', activity:'pack-school', choices:[['Crayons','crayons',true],['Cup','cup',false],['Ball','ball',false]], success:'You found them!' },
    { phrase:'Share the crayons.', prompt:'Drag the crayons to your friend.', type:'drag', activity:'share-supplies', item:'crayons', target:'friend', itemPosition:[42,63], targetPosition:[77,67], success:'That was kind!' },
    { phrase:'Time to learn!', prompt:'Tap the book.', type:'tap', activity:'open-book', target:'book', position:[56,68], success:'Ready to learn!' }
  ]},
  { id:'nature', title:'In Nature', icon:'🏔️', tone:'purple', art:'nature-helper.png', cardArt:'cards/nature.png', subtitle:'Care for our beautiful world.', steps:[
    { phrase:'Look at the mountains!', prompt:'Tap the mountains.', type:'tap', activity:'discover-view', target:'mountains', position:[52,52], success:'So beautiful!' },
    { phrase:'What belongs in nature?', prompt:'Tap the butterfly.', type:'choice', activity:'protect-nature', choices:[['Butterfly','butterfly',true],['Bottle','bottle',false],['Wrapper','wrapper',false]], success:'A happy butterfly!' },
    { phrase:'Pick it up.', prompt:'Drag the bottle to the recycling bin.', type:'drag', activity:'recycle-cleanup', item:'bottle', target:'bin', itemPosition:[42,61], targetPosition:[78,68], success:'Thank you for helping!' },
    { phrase:'The Earth is our home.', prompt:'Tap the smiling Earth.', type:'tap', activity:'care-for-earth', target:'earth', position:[52,68], success:'Be kind to our planet!' }
  ]},
  { id:'world', title:'Around the World', icon:'🌍', tone:'orange', art:'hero-explorer.png', cardArt:'cards/world.png', subtitle:'Explore new places and meet new friends.', steps:[
    { phrase:'Where shall we go?', prompt:'Tap the airplane.', type:'tap', activity:'board-plane', target:'plane', position:[73,38], success:'Off we go!' },
    { phrase:'Look at this place!', prompt:'Tap the landmark.', type:'choice', activity:'landmark-match', choices:[['Landmark','landmark',true],['Cloud','cloud',false],['Suitcase','suitcase',false]], success:'What a wonderful place!' },
    { phrase:'Hello, friend!', prompt:'Tap the friendly globe.', type:'tap', activity:'greet-world', target:'globe', position:[51,68], success:'Hello, world!' },
    { phrase:'Let’s explore together.', prompt:'Tap the big map.', type:'tap', activity:'trace-route', target:'map', position:[51,69], success:'Adventure complete!' }
  ]}
];

// Runtime asset URL rooted at the site document, not the generated Vite JS chunk.
// Using import.meta.url here breaks after build because Vite emits the chunk under /assets/.
export const ASSET_ROOT = new URL('games/language-adventures/assets/', document.baseURI).href;
export const NEW_ART_ROOT = new URL('games/language-adventures/assets/new/', document.baseURI).href;
export const VIDEO_ROOT = new URL('games/language-adventures/video/', document.baseURI).href;
