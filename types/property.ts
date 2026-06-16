import { PropertyType } from '../store/filterStore'
export interface Property{
 id:string;
 title:string;
 description:string;
 price:number   
 type:string;
 bedrooms:number;
 bathrooms: number;
 area_sqft: number;
 address:string;
 city: string;
 latitude: number;
 longtitude:number;
 images:string[];
 is_featured: boolean;
 is_sold:boolean;
 created_at:string;
}


export interface FormState extends Omit<Property, 'is_sold' | 'type'> {
  type: PropertyType,
  localImages: string[]
}