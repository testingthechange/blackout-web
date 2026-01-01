export const CATALOG = [
  {
    id: "album-001",
    albumName: "Blackout Vol. 1",
    artist: "Blackout Artist",
    releaseDate: "2025-12-31",
    coverUrl: "https://placehold.co/600x600/png",
    tracks: [
      { id: "t1", title: "Track 01", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { id: "t2", title: "Track 02", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { id: "t3", title: "Track 03", previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    ],
  },
];

export function getProduct(productId) {
  return CATALOG.find((p) => p.id === productId) || null;
}
