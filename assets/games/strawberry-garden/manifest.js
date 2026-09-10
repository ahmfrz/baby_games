const asset = (name) => new URL(`./art/${name}`, import.meta.url).href;

export const strawberryAssets = {
  character: asset('strawberry.svg'),
  butterfly: asset('butterfly.svg'),
  basket: asset('basket.svg'),
  sink: asset('sink.svg'),
  blender: asset('blender.svg'),
  cake: asset('cake.svg'),
  garden: asset('garden-bg.svg'),
  toddler: asset('toddler.svg'),
  flowers: asset('flower-cluster.svg'),
};
