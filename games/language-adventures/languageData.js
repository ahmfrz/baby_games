import { assetDirectoryUrl } from '../../services/AssetService.js';

export const SCENARIOS = [
  { id:'home', title:'At Home', icon:'🏠', tone:'coral', art:'scenes/toy-room.webp', cardArt:'cards/home-video.webp', subtitle:'Little helpers make a big difference.', video:'home-tidy-room.mp4', steps:[
    { phrase:'Can you find the ball?', prompt:'Tap the ball.', type:'video-tap', activity:'tidy-room', target:'ball', position:[38,63], videoStart:0, videoPause:1.85, success:'You found the ball!' },
    { phrase:'Where should the ball go?', prompt:'Tap the toy box.', type:'video-tap', activity:'put-ball-away', target:'toybox', position:[73,54], videoStart:1.85, videoPause:5.00, success:'Great helping!' },
    { phrase:'Can you find Teddy?', prompt:'Tap Teddy.', type:'video-tap', activity:'find-hidden', target:'teddy', position:[67,67], videoStart:5.00, videoPause:6.85, success:'There is Teddy!' },
    { phrase:'Where should Teddy go?', prompt:'Tap the toy box.', type:'video-tap', activity:'put-teddy-away', target:'toybox', position:[73,54], videoStart:6.85, videoPause:8.55, success:'You tidied up!' }
  ]},
  { id:'park', title:'In the Park', icon:'🌳', tone:'green', art:'scenes/park.webp', cardArt:'cards/park.webp', subtitle:'Notice, share, and make a new friend.', video:'park-adventure.mp4', steps:[
    { phrase:'Look at the puppy!', prompt:'Tap the puppy.', type:'video-tap', activity:'meet-friend', target:'puppy', position:[55,64], videoStart:0, videoPause:2.20, success:'Hello, puppy!' },
    { phrase:'Can you find the butterfly?', prompt:'Tap the butterfly.', type:'video-tap', activity:'spot-nature', target:'butterfly', position:[54,60], videoStart:2.20, videoPause:4.60, success:'You found it!' },
    { phrase:'Let’s share.', prompt:'Tap the ball.', type:'video-tap', activity:'share-at-park', target:'ball', position:[48,76], videoStart:4.60, videoPause:7.50, success:'Sharing is kind!' },
    { phrase:'I am going!', prompt:'Tap the path.', type:'video-tap', activity:'follow-path', target:'path', position:[55,82], videoStart:7.50, videoPause:9.20, success:'Let’s go!' }
  ]},
  { id:'school', title:'At School', icon:'🎒', tone:'blue', art:'school-friend.webp', cardArt:'cards/school.webp', subtitle:'Learn, listen, and help your friends.', video:'school-adventure.mp4', steps:[
    { phrase:'Hello, friend!', prompt:'Tap your friend.', type:'video-tap', activity:'greet-classmate', target:'friend', position:[61,60], videoStart:0, videoPause:2.20, success:'Hello!' },
    { phrase:'Where are the crayons?', prompt:'Tap the crayons.', type:'video-tap', activity:'pack-school', target:'crayons', position:[57,65], videoStart:2.20, videoPause:4.60, success:'You found them!' },
    { phrase:'Share the crayons.', prompt:'Tap the crayons.', type:'video-tap', activity:'share-supplies', target:'crayons', position:[53,65], videoStart:4.60, videoPause:7.50, success:'That was kind!' },
    { phrase:'Time to learn!', prompt:'Tap the book.', type:'video-tap', activity:'open-book', target:'book', position:[57,77], videoStart:7.50, videoPause:9.20, success:'Ready to learn!' }
  ]},
  { id:'nature', title:'In Nature', icon:'🏔️', tone:'purple', art:'nature-helper.webp', cardArt:'cards/nature.webp', subtitle:'Care for our beautiful world.', steps:[
    { phrase:'Look at the mountains!', prompt:'Tap the mountains.', type:'tap', activity:'discover-view', target:'mountains', position:[52,52], success:'So beautiful!' },
    { phrase:'What belongs in nature?', prompt:'Tap the butterfly.', type:'choice', activity:'protect-nature', choices:[['Butterfly','butterfly',true],['Bottle','bottle',false],['Wrapper','wrapper',false]], success:'A happy butterfly!' },
    { phrase:'Pick it up.', prompt:'Drag the bottle to the recycling bin.', type:'drag', activity:'recycle-cleanup', item:'bottle', target:'bin', itemPosition:[42,61], targetPosition:[78,68], success:'Thank you for helping!' },
    { phrase:'The Earth is our home.', prompt:'Tap the smiling Earth.', type:'tap', activity:'care-for-earth', target:'earth', position:[52,68], success:'Be kind to our planet!' }
  ]},
  { id:'world', title:'Around the World', icon:'🌍', tone:'orange', art:'hero-explorer.webp', cardArt:'cards/world.webp', subtitle:'Explore new places and meet new friends.', video:'world-adventure.mp4', steps:[
    { phrase:'Where shall we go?', prompt:'Tap the airplane.', type:'video-tap', activity:'board-plane', target:'plane', position:[62,52], videoStart:0, videoPause:2.20, success:'Off we go!' },
    { phrase:'Look at this place!', prompt:'Tap the landmark.', type:'video-tap', activity:'landmark-match', target:'landmark', position:[55,54], videoStart:2.20, videoPause:4.80, success:'What a wonderful place!' },
    { phrase:'Hello, friend!', prompt:'Tap the friendly globe.', type:'video-tap', activity:'greet-world', target:'globe', position:[68,60], videoStart:4.80, videoPause:7.60, success:'Hello, world!' },
    { phrase:'Let’s explore together.', prompt:'Tap the big map.', type:'video-tap', activity:'trace-route', target:'map', position:[55,78], videoStart:7.60, videoPause:9.20, success:'Adventure complete!' }
  ]}
];

// Runtime asset URL rooted at the site document, not the generated Vite JS chunk.
// Using import.meta.url here breaks after build because Vite emits the chunk under /assets/.
export const ASSET_ROOT = assetDirectoryUrl('games/language-adventures', 'image');
export const SCENE_ROOT = assetDirectoryUrl('games/language-adventures/scenes', 'image');
export const NEW_ART_ROOT = assetDirectoryUrl('games/language-adventures/new', 'image');
export const VIDEO_ROOT = assetDirectoryUrl('games/language-adventures/video', 'video');
