import type { PlaceType } from '@wayra/types';
import {
  Building2,
  Train,
  TramFront,
  Bus,
  BusFront,
  Plane,
  Route as RouteIcon,
  MapPin,
  Landmark,
  Home as HomeIcon,
} from 'lucide-react';

export function typeIconFor(type: PlaceType) {
  switch (type) {
    case 'city':
      return Building2;
    case 'neighborhood':
      return HomeIcon;
    case 'station':
      return Train;
    case 'metro_station':
      return Train;
    case 'tram_stop':
      return TramFront;
    case 'bus_stop':
      return Bus;
    case 'stop':
      return BusFront;
    case 'airport':
      return Plane;
    case 'street':
    case 'address':
      return RouteIcon;
    case 'landmark':
      return Landmark;
    case 'poi':
    default:
      return MapPin;
  }
}
