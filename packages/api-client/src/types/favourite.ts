import type { ListingWithSeller } from './search';

export interface Favourite {
  id: string;
  listing_id: string;
  created_at: string;
  listing: ListingWithSeller;
}

export interface FavouritesResponse {
  favourites: Favourite[];
}

export interface FavouriteCheckResponse {
  is_favourite: boolean;
}
