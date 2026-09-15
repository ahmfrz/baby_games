import { assetUrl } from '../../../services/AssetService.js';

const asset = (name) => assetUrl(`games/strawberry-garden/art/${name}`);

export const strawberryAssets = {
  character: asset('strawberry.svg'),
  idle: asset('characters/strawberry-idle.svg'),
  happy: asset('characters/strawberry-happy.svg'),
  pick: asset('characters/strawberry-pick.svg'),
  wink: asset('characters/strawberry-wink.svg'),
  surprised: asset('characters/strawberry-surprised.svg'),
  jump: asset('characters/strawberry-jump.svg'),
  celebrate: asset('characters/strawberry-celebrate.svg'),
  butterfly: asset('butterfly.svg'),
  basket: asset('basket.svg'),
  sink: asset('sink.svg'),
  blender: asset('blender.svg'),
  cake: asset('cake.svg'),
  garden: asset('garden-bg.svg'),
  toddler: asset('toddler.svg'),
  flowers: asset('flower-cluster.svg'),
};
