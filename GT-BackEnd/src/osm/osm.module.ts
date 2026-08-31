import { Global, Module } from '@nestjs/common';
import { NominatimClient } from '../restaurants/nominatim.client';
import { OverpassClient } from '../restaurants/overpass.client';

@Global()
@Module({
  providers: [NominatimClient, OverpassClient],
  exports: [NominatimClient, OverpassClient],
})
export class OsmModule {}
