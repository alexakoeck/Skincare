
export enum SkinType {
  Dry = 'Dry',
  Oily = 'Oily',
  Combination = 'Combination',
  Sensitive = 'Sensitive',
}

export enum DeliveryOption {
  Online = 'Online Delivery',
  InStore = 'In-Store Pickup',
}

export interface UserPreferences {
  skinType: SkinType;
  age: number;
  budget: number;
  delivery: DeliveryOption;
}

export interface Product {
  productName: string;
  brand: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  explanation: string;
}
