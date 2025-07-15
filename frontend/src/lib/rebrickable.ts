const REBRICKABLE_API_BASE = "https://rebrickable.com/api/v3";

// API key from requirements document
const API_KEY =
  process.env.NEXT_PUBLIC_REBRICKABLE_API_KEY ||
  "137711e69d67d911ccb3f219f0216a5c";

export interface Minifig {
  set_num: string;
  name: string;
  num_parts: number;
  set_img_url: string;
  set_url: string;
  last_modified_dt: string;
}

export interface MinifigPart {
  id: number;
  inv_part_id: number;
  part: {
    part_num: string;
    name: string;
    part_cat_id: number;
    part_url: string;
    part_img_url: string;
    external_ids: Record<string, unknown>;
    print_of: string | null;
  };
  color: {
    id: number;
    name: string;
    rgb: string;
    is_trans: boolean;
    external_ids: Record<string, unknown>;
  };
  set_num: string;
  quantity: number;
  is_spare: boolean;
  element_id: string;
  num_sets: number;
}

export interface MinifigsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Minifig[];
}

export interface MinifigPartsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MinifigPart[];
}

class RebrickableAPI {
  private baseURL = REBRICKABLE_API_BASE;
  private apiKey = API_KEY;

  private async makeRequest<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);

    // Add API key to params
    const searchParams = new URLSearchParams({
      key: this.apiKey,
      ...params,
    });

    url.search = searchParams.toString();

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `Rebrickable API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getMinifigs(
    search?: string,
    page?: number,
    pageSize: number = 20
  ): Promise<MinifigsResponse> {
    const params: Record<string, string> = {
      page_size: pageSize.toString(),
    };

    if (search) {
      params.search = search;
    }

    if (page) {
      params.page = page.toString();
    }

    return this.makeRequest<MinifigsResponse>("/lego/minifigs/", params);
  }

  async getRandomMinifigs(count: number = 20): Promise<MinifigsResponse> {
    // Get a random page of minifigs
    const randomPage = Math.floor(Math.random() * 10) + 1;
    return this.getMinifigs(undefined, randomPage, count);
  }

  async getMinifigParts(minifigId: string): Promise<MinifigPartsResponse> {
    return this.makeRequest<MinifigPartsResponse>(
      `/lego/minifigs/${minifigId}/parts/`
    );
  }

  async getMinifigDetails(minifigId: string): Promise<Minifig> {
    return this.makeRequest<Minifig>(`/lego/minifigs/${minifigId}/`);
  }
}

export const rebrickableAPI = new RebrickableAPI();
