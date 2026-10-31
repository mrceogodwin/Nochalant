import { handleArtistStudio } from "../_lib/artist-studio.js";

export default async function handler(req, res) {
  return handleArtistStudio(req, res);
}
